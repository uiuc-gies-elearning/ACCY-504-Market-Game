var serverfile = require('./server.js');

var seller_select = function(req){
    	serverfile.io.on('connection', function(client) {
			let socket_id = [];
	    	socket_id.push(client.id);
	    	if (socket_id[0] === client.id) {
	    		serverfile.io.removeAllListeners('connection');
	    	}

	    	console.log('Client connected...');
		    client.on('loadPrices', function(data) {
		    	serverfile.connection.query('SELECT price_low, price_med, price_high FROM game WHERE (game_id = 1)', function(err, result){
		    		if (err) {
						console.error(err);
						return;
					}
					var prices = {
						price_low : result[0]["price_low"],
						price_med : result[0]["price_med"],
						price_high : result[0]["price_high"]
					};
					client.emit("pricesLoaded", prices);
		    	});
		    });

		    client.on('pickedQuality', function(data) {
		    	var id;
		    	serverfile.connection.query('SELECT seller_number FROM `seller list` WHERE user_id = ?', req.user.user_id, function(err, result) {
		    		if (err) {
						console.error(err);
						return;
					}
					id = result[0]["seller_number"];
					console.log("Query result is " + id);

			    	var offer = {
			    		quality_id : data.quality,
			    		price : data.price,
			    		second_sale : data.secondSale,
			    		seller_id : id
			    	}
			    	var offer = serverfile.connection.query('INSERT INTO offers SET ?', offer, function(err, result) {
			    		if (err) {
							console.error(err);
							return;
						}
						console.log(offer.sql);
						console.log("New offer has been submitted")
			    		client.emit("offerSubmitted");
			    	});
		    	});
		    });

			client.on('disconnect', function() {
		        console.log("disconnect: ", client.id);
		        serverfile.io.removeAllListeners('connection');
	    	});
    	});
	};

module.exports.seller_select = seller_select;