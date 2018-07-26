var serverfile = require('./server.js');

var buyer_select = function(request){

    serverfile.app.io.route('loadOffers', function(req) {
    	serverfile.connection.query('SELECT offers.quality_id, offers.price, `seller list`.seller_number, user.teamname FROM `seller list` INNER JOIN user on `seller list`.user_id = user.user_id INNER JOIN offers on offers.seller_id = `seller list`.seller_id ORDER BY `seller list`.seller_number ASC LIMIT 3;', function(err, result){
    		if (err) {
				console.error(err);
				return;
			}
			var offers = {
				seller1 : {name: result[0]["teamname"], quality : result[0]["quality_id"], price : result[0]["price"]},
				seller2 : {name: result[1]["teamname"], quality : result[1]["quality_id"], price : result[1]["price"]},
				seller3 : {name: result[2]["teamname"], quality : result[2]["quality_id"], price : result[2]["price"]}
			};
			req.io.emit("offersLoaded", offers);
    	});
    });

    serverfile.app.io.route('loadResale', function(req) {
    	serverfile.connection.query('SELECT resale_low, resale_med, resale_high FROM game WHERE game_id = 1', function(err, result){
    		if (err) {
				console.error(err);
				return;
			}
			//TODO: Check if null and return empty
			var resale = {
				resale1 : result[0]["resale_low"],
				resale2 : result[0]["resale_med"],
				resale3 : result[0]["resale_high"]
			};
			req.io.emit("resaleLoaded", resale);
    	});
    });

    serverfile.app.io.route('buy', function(req) {
    	var bid;
    	if(req.data != 0) {
    		serverfile.connection.query('SELECT seller_id FROM `seller list` WHERE seller_number = ' + req.data, function(err, result){
    			if (err) {
						console.error(err);
						return;
					}
    			bid = {seller_id : result[0]["seller_id"], buyer_id : request.user.user_id};
		    	serverfile.connection.query('INSERT INTO bid SET ?', bid, function(err, result) {
		    		if (err) {
						console.error(err);
						return;
					}
					console.log("New bid has been submitted for Seller " + req.data)
		    		req.io.emit("bidSubmitted");
		    	});
    		});
    	}
    	else {
    		bid = {buyer_id : request.user.user_id};
    		console.log(bid);
    		serverfile.connection.query('INSERT INTO bid SET ?', bid, function(err, result) {
    			if (err) {
					console.error(err);
					return;
				}
				console.log("New bid has been submitted for No Buy")
	    		req.io.emit("bidSubmitted");
    		});
    	}
    });

};

module.exports.buyer_select = buyer_select;