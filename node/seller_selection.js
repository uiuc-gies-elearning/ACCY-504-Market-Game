var serverfile = require('./server.js');

var seller_select = function(request){

    serverfile.app.io.route('loadPrices', function(req) {
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
			req.io.emit("pricesLoaded", prices);
    	});
    });

    serverfile.app.io.route('pickedQuality', function(req) {
    	var id;
    	serverfile.connection.query('SELECT seller_number FROM `seller list` WHERE user_id = ?', request.user.user_id, function(err, result) {
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
	    		req.io.emit("offerSubmitted");
	    	});
    	});
    });
};

module.exports.seller_select = seller_select;