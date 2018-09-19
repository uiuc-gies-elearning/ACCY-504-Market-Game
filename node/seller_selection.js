//=====================================================================================================
//Backend functionality for seller selection. Loads prices for producing goods and on quality and price 
//submission puts data into the offers list on the database.
//=====================================================================================================

//Import express app and mysql connection
var serverfile = require('./server.js');

var seller_select = function(request){

	var userGame = request.user.game_id;

    serverfile.app.io.route('loadPrices', function(req) {
        	serverfile.connection.query('SELECT price_low, price_med, price_high FROM game WHERE (game_id = ?)', userGame, function(err, result){
    		if (err) {
				console.error(err);
				return;
			}
			var prices = {
				price_low : result[0]["price_low"],
				price_med : result[0]["price_med"],
				price_high : result[0]["price_high"]
			};
			req.io.emit("pricesLoaded", prices);
    	});
    });

    //SOCKET FUNCTION: checkAudit
    //Returns phase and whether user is audited or not in order to display message to show the seller if they
    //won the auditor bid or not
    serverfile.app.io.route('checkAudit', function(req) {
	    serverfile.connection.query('SELECT customer_id FROM auditor WHERE game_id = ?', userGame, function(err, result) {
	    	if (err) {
				console.error(err);
				return;
			}
			if(result[0]["customer_id"] == 2){
		    	serverfile.connection.query('SELECT cur_phase FROM history WHERE game_id = ? ORDER BY history_id DESC LIMIT 1', userGame, function(err, result){
		    		if (err) {
						console.error(err);
						return;
					}

					var phase = result[0]["cur_phase"];
					
					serverfile.connection.query('SELECT audited FROM user WHERE user_id = ?', request.user.user_id, function(err, result) {
						var audited = result[0]['audited'];

						var info = {
							phase : phase,
							audited : audited
						}

						req.io.emit("auditChecked", info);
					});
		    	});
			}
	    });
    });

    //SOCKET FUNCTION: pickedQuality
    //Submits seller sale entry into 'offers'. Checks if all sellers have submitted their offers,
    //and then it updates the stage.
    serverfile.app.io.route('pickedQuality', function(req) {
    	serverfile.connection.query('SELECT seller_id FROM `seller list` WHERE user_id = ? AND game_id = ?', [request.user.user_id, userGame], function(err, result) {
    		if (err) {
				console.error(err);
				return;
			}
			var id = result[0]["seller_id"];

	    	var offer = {
	    		quality_id : req.data.quality,
	    		price : req.data.price,
	    		second_sale : req.data.secondSale,
	    		seller_id : id
	    	}
	    	var offer = serverfile.connection.query('INSERT INTO offers SET ?', offer, function(err, result) {
	    		if (err) {
					console.error(err);
					return;
				}
		    	serverfile.connection.query('SELECT COUNT(*) FROM offers INNER JOIN `seller list` on offers.seller_id = `seller list`.seller_id WHERE game_id = ?', userGame, function(err, result) {
		    		if (err) {
						console.error(err);
						return;
					}
					var offer_count = result[0]["COUNT(*)"];
					if(offer_count >= 3){
				    	serverfile.connection.query('UPDATE game SET stage_id = 1 WHERE game_id = ?', userGame, function(err, result) {
				    		if (err) {
				    			console.error(err);
				    			return;
				    		}
				    		req.io.room(request.user.game_id).broadcast("stageUpdated", 1);
				    		req.io.emit("offerSubmitted");
				    	});
				    }
				    else{
				    	req.io.emit("offerSubmitted");
				    	req.io.room(request.user.game_id).broadcast('updateOffers');
				    }
		    	});
	    	});
    	});
    });
};

module.exports.seller_select = seller_select;