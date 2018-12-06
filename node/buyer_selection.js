//=====================================================================================================================
//Backend functionality for the buyer selection screen. Functionalities include listening for loadOffers on page start
//that queries the database to get info about seller offers, listening for loadResale that queries the database to get
//resale profits that were created on game initialization, and listening for a buy that submits the selected buy to
//the database.
//======================================================================================================================

//Import express app and mysql connection
var serverfile = require('./server.js');

var buyer_select = function(request){
	
	var userGame = request.user.game_id;

    //On loadResale, returns a JSON object with buyer resale prices
    serverfile.app.io.route('loadResale', function(req) {
    	serverfile.connection.query('SELECT resale_low, resale_med, resale_high FROM game WHERE game_id = ?', userGame, function(err, result){
    		if (err) {
				console.error(err);
				return;
			}
			var resale = {
				resale1 : result[0]["resale_low"],
				resale2 : result[0]["resale_med"],
				resale3 : result[0]["resale_high"]
			};
			req.io.emit("resaleLoaded", resale);
    	});
    });

    //SOCKET FUNCTION: getGameInfo
    //'Game Info' refers to the buyer position, the game phase, whether or not the user is audited, the audited
    //seller (if there is one), and a Disable array that indicates whether or not a seller is 'sold out' (sold 1 unit
    //on no second sale, or 2 units on second sale). This is to give the frontend info on how to display the page (e.g.
    //disabling buy buttons for sold out sellers, showing qualities if audited, etc).
    serverfile.app.io.route('getGameInfo', function(req) {
    	serverfile.connection.query('SELECT cur_phase FROM history WHERE game_id = ? ORDER BY history_id DESC LIMIT 1', userGame, function(err, result){
    		if (err) {
				console.error(err);
				return;
			}
			var phase = result[0]["cur_phase"];
	    	serverfile.connection.query('SELECT `seller list`.seller_number FROM user INNER JOIN `seller list` on `seller list`.user_id = user.user_id WHERE audited = 1 AND user.game_id = ?', userGame, function(err, result){
		    	if (err) {
					console.error(err);
					return;
				}
		    	var info = {
		    		pos : req.session.buy_pos,
		    		phase : phase,
		    		audited : request.user.audited,
		    		sellerAudit : null,
		    		sellerDisable : [null, null, null],
		    		auditCustomer : null
		    	};

		    	if(result.length != 0)
		    		info.sellerAudit = result[0]["seller_number"];
		    	serverfile.connection.query('SELECT offers.seller_id, offers.second_sale, `seller list`.seller_number FROM offers INNER JOIN `seller list` ON offers.seller_id = `seller list`.seller_id WHERE `seller list`.game_id = ?', userGame, function(err, result) {
		    		if (err) {
						console.error(err);
						return;
					}
					var offers = [];
					for(var i = 0; i < result.length; i++){
						var insert = {
							seller_id : result[i]["seller_id"],
							second_sale : result[i]["second_sale"],
							seller_number : result[i]["seller_number"]
						};
						offers.push(insert);
					}
					serverfile.connection.query('SELECT bid.seller_id FROM bid INNER JOIN `seller list` on bid.seller_id = `seller list`.seller_id WHERE `seller list`.game_id = ?', userGame, function(err, result) {
		    			if (err) {
							console.error(err);
							return;
						}

						var bids = [];
						for(var n = 0; n < result.length; n++){
							bids.push(result[n]["seller_id"]);
						}

						for(var i = 0; i < 3; i++){
							//In the case of 2 sales, it is greater than the true value of 1 for
							//second sale variable, and so goes for 1 sales being greater than the
							//false value of 0, so the logical comparison works out
							if(countSales(bids, offers[i].seller_id) > offers[i].second_sale)
								info.sellerDisable[offers[i].seller_number-1] = true;
							else
								info.sellerDisable[offers[i].seller_number-1] = false;
						}
						serverfile.connection.query('SELECT customer_id FROM auditor WHERE game_id = ?', userGame, function(err, result) {
		    				if (err) {
		    					console.error(err);
		    					return;
		    				}
		    				info.auditCustomer = result[0]["customer_id"];
		    				req.io.emit('receivedInfo', info);
						});
					});
		    	});
	    	});
	    });
    });

    //SOCKET FUNCTION: buy
    //'Buy' sends request data that contains the seller the buyer chose. 0 is no buy. The callback function
    //submits the seller id and buyer id to the bid table. Seller ID is NULL for no buy.
    serverfile.app.io.route('buy', function(req) {
    	var bid;
    	var seller_number = req.data;
    	if(seller_number != 0) {
    		serverfile.connection.query('SELECT seller_id FROM `seller list` WHERE seller_number = ? AND game_id = ?', [seller_number, userGame], function(err, result){
    			if (err) {
					console.error(err);
					return;
				}
				var user = req.session.user_id;
				var seller = result[0]["seller_id"]
				serverfile.connection.query('SELECT buyer_id FROM `buyer list` WHERE user_id = ? AND game_id = ?', [user, userGame], function(err, result) {
					if (err) {
						console.error(err);
						return;
					}
	    			bid = {
	    				seller_id : seller, 
	    				buyer_id : result[0]["buyer_id"]
	    			};
			    	serverfile.connection.query('INSERT INTO bid SET ?', bid, function(err, result) {
			    		if (err) {
							console.error(err);
							return;
						}
						serverfile.connection.query('SELECT * FROM bid INNER JOIN `buyer list` ON bid.buyer_id = `buyer list`.buyer_id WHERE game_id = ?', request.user.game_id, function(err, result){
							if(result.length >= 4){
								serverfile.connection.query('UPDATE game SET stage_id = 6 WHERE game_id = ?', userGame, function(err, result){
									if (err) {
										console.error(error);
										return;
									}
									updateHistory(userGame);
									req.io.room(req.session.game_id).broadcast("stageUpdated", 6);
								});
							}
						});
			    	});
				});
    		});
    	}
    	else {
    		//Leaves seller_id empty so there will be a null in the seller_id table column
    		var user = request.user.user_id;
	    	serverfile.connection.query('SELECT buyer_id FROM `buyer list` WHERE user_id = ?', user, function(err, result) {
				if (err) {
					console.error(err);
					return;
				}
	    		bid = {buyer_id : result[0]["buyer_id"]};
	    		serverfile.connection.query('INSERT INTO bid SET ?', bid, function(err, result) {
	    			if (err) {
						console.error(err);
						return;
						serverfile.connection.query('SELECT * FROM bid INNER JOIN `buyer list` ON bid.buyer_id = `buyer list`.buyer_id WHERE game_id = ?', req.session.game_id, function(err, result){
							if(result.length >= 4){
								serverfile.connection.query('UPDATE game SET stage_id = 6 WHERE game_id = ?', userGame, function(err, result){
									if (err) {
										console.error(error);
										return;
									}
									updateHistory(userGame);
									req.io.room(req.session.game_id).broadcast("stageUpdated", 6);
								});
							}
						});
					}

	    		});
	    	});
    	}

		serverfile.connection.query('SELECT * FROM bid INNER JOIN `buyer list` ON bid.buyer_id = `buyer list`.buyer_id WHERE game_id = ?', req.session.game_id, function(err, result){
			if(result.length < 4){
				serverfile.connection.query('SELECT stage_id FROM game WHERE game_id = ?', userGame, function(err, result){
					if (err) {
						console.error(err);
						return;
					}
					var new_stage = ++result[0]["stage_id"];
					serverfile.connection.query('UPDATE game SET stage_id = ? WHERE game_id = ?', [new_stage, userGame], function(err, result){
						if (err) {
							console.error(error);
							return;
						}
						req.io.room(req.session.game_id).broadcast("stageUpdated", new_stage);
					});
				});
			}
		});
		
    });

};

function countSales(array, seller_id) {
	var count = 0;
	for(var i = 0; i < array.length; i++){
		if(array[i] == seller_id)
			count++;
	}
	return count;
}


//FUNCTION: updateHistory
//Takes all relevant offers/bid data and stores them into 'sale history' and 'buy history' tables. Also
//updates all user profits.
function updateHistory(userGame) {
	serverfile.connection.query('SELECT history_id FROM history WHERE game_id = ? ORDER BY history_id DESC LIMIT 1', userGame, function(err, result){
		if (err) {
			console.error(err);
			return;
		}
		var curHistory = result[0]["history_id"];
		serverfile.connection.query('SELECT offers.* FROM offers INNER JOIN `seller list` on offers.seller_id = `seller list`.seller_id WHERE game_id = ?', userGame, function(err, result){
			if (err) {
				console.error(err);
				return;
			}

			var sellerIDs = [result[0]["seller_id"], result[1]["seller_id"], result[2]["seller_id"]];
			var qualities = [result[0]["quality_id"], result[1]["quality_id"], result[2]["quality_id"]];
			var prices = [result[0]["price"], result[1]["price"], result[2]["price"]];


			serverfile.connection.query('SELECT bid.* FROM bid INNER JOIN `buyer list` on bid.buyer_id = `buyer list`.buyer_id WHERE game_id = ?', userGame, function(err, result){
				if (err) {
					console.error(err);
					return;
				}

				var allSaleHistories = [];

				for(i = 0; i<3; i++){
					var count = 0;
					for(n = 0; n<result.length; n++){
						if(result[n]["seller_id"] == sellerIDs[i])
							count++;
					}

					var saleHistory = {
						history_id : curHistory,
						seller_id : sellerIDs[i],
						units_sold : count,
						price_sold : prices[i],
						quality_id : qualities[i]
					}

					allSaleHistories.push(saleHistory);
				}

				allSaleHistories.forEach(function(element) {
					saleHistoryInsert(element);
				});

				allSaleHistories.forEach(function(element) {
					sellerProfitUpdate(element, userGame);
				});
				
				var allBuyHistories = [];
				for(i = 0; i<result.length; i++){
					var curSeller = result[i]["seller_id"];
					var sellQuality, sellPrice;
					if(curSeller == null){
						sellPrice = 0;
						sellQuality = 4;
					}
					else{
						for(n = 0; n<3 ; n++){
							if(curSeller == sellerIDs[n]){
								sellQuality = qualities[n];
								sellPrice = prices[n];
							}
						}
					}

					var buyHistory = {
						history_id : curHistory,
						buyer_id : result[i]["buyer_id"],
						buy_quality : sellQuality,
						buy_price : sellPrice
					}

					allBuyHistories.push(buyHistory);
				}

				allBuyHistories.forEach(function(element) {
					buyHistoryInsert(element);
				});

				allBuyHistories.forEach(function(element) {
					buyerProfitUpdate(element, userGame);
				});

			});
		});


	});
}

//HELPER FUNCTIONS: buyerProfitUpdate, sellerProfitUpdate, saleHistoryInsert, buyHistoryInsert
//--------------------------------------------------------------------------------------------

function buyerProfitUpdate(buyHistory, userGame) {
	serverfile.connection.query('SELECT resale_low, resale_med, resale_high FROM game WHERE game_id = ?', userGame, function(err, result) {
		if (err) {
			console.error(err);
			return;
		}
		var resale = [result[0]["resale_low"], result[0]["resale_med"], result[0]["resale_high"], 0];
		var profit = resale[buyHistory.buy_quality - 1] - buyHistory.buy_price;
		serverfile.connection.query('SELECT user_id FROM `buyer list` WHERE buyer_id = ? AND game_id = ?', [buyHistory.buyer_id, userGame], function(err, result) {
			if (err) {
				console.error(err);
				return;
			}
			var user = result[0]["user_id"];
			serverfile.connection.query('SELECT profits FROM user WHERE user_id = ? AND game_id = ?', [user, userGame], function(err, result) {
				if (err) {
					console.error(err);
					return;
				}
				newProfit = profit + result[0]["profits"];
				serverfile.connection.query('UPDATE user SET profits = ? WHERE user_id = ?', [newProfit, user], function(err, result) {
					if (err) {
						console.error(err);
						return;
					}
				});
			});
		});
	});
}

function sellerProfitUpdate(saleHistory, userGame) {
	serverfile.connection.query('SELECT price_low, price_med, price_high FROM game WHERE game_id = ?', userGame, function(err, result) {
		if (err) {
			console.error(err);
			return;
		}
		var prices = [result[0]["price_low"], result[0]["price_med"], result[0]["price_high"]];
		var productionCost = prices[saleHistory.quality_id - 1];
		var productionTotal;
		var units = saleHistory.units_sold;
		if(units == 2)
			productionTotal = productionCost*2 + 1;
		else
			productionTotal = productionCost*units;
		var profit = units*saleHistory.price_sold - productionTotal;
		serverfile.connection.query('SELECT user_id FROM `seller list` WHERE seller_id = ?', saleHistory.seller_id, function(err, result) {
			if (err) {
				console.error(err);
				return;
			}
			var user = result[0]["user_id"];
			serverfile.connection.query('SELECT profits FROM user WHERE user_id = ?', user, function(err, result){
				if (err) {
					console.error(err);
					return;
				}
				var newProfit = profit + result[0]["profits"];
				serverfile.connection.query('UPDATE user SET profits = ? WHERE user_id = ?', [newProfit, user], function(err, result) {
					if (err) {
						console.error(err);
						return;
					}
				});
			});
		});
	});
}

function saleHistoryInsert(saleHistory){
	serverfile.connection.query('INSERT INTO `Sale History` SET ?', saleHistory, function(err, result) {
		if (err) {
			console.error(err);
			return;
		}				
	});
}

function buyHistoryInsert(buyHistory){
	serverfile.connection.query('INSERT INTO `Buy History` SET ?', buyHistory, function(err, result) {
		if (err) {
			console.error(err);
			return;
		}				
	});
}

module.exports.buyer_select = buyer_select;