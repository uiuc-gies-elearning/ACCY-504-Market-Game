var serverfile = require('./server.js');

var buyer_select = function(req){
    	serverfile.io.on('connection', function(client) {
			let socket_id = [];
	    	socket_id.push(client.id);
	    	if (socket_id[0] === client.id) {
	    		serverfile.io.removeAllListeners('connection');
	    	}

	    	console.log('Client connected...');

		    client.on('loadOffers', function(data) {
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
					client.emit("offersLoaded", offers);
		    	});
		    });

		    client.on('loadResale', function(data) {
		    	serverfile.connection.query('SELECT resale_low, resale_med, resale_high FROM game WHERE game_id = 1', function(err, result){
		    		if (err) {
						console.error(err);
						return;
					}
					var resale = {
						resale1 : result[0]["resale_low"],
						resale2 : result[0]["resale_med"],
						resale3 : result[0]["resale_high"]
					};
					client.emit("resaleLoaded", resale);
		    	});
		    });

		    client.on('buy', function(data) {
		    	var bid;
		    	if(data != 0) {
		    		serverfile.connection.query('SELECT seller_id FROM `seller list` WHERE seller_number = ' + data, function(err, result){
		    			if (err) {
								console.error(err);
								return;
							}
		    			bid = {seller_id : result[0]["seller_id"]};
				    	serverfile.connection.query('INSERT INTO bid SET ?', bid, function(err, result) {
				    		if (err) {
								console.error(err);
								return;
							}
							console.log("New bid has been submitted for Seller " + data)
				    		client.emit("bidSubmitted");
				    	});
		    		});
		    	}
		    	else {
		    		bid = {buyer_id : 1}; //PLACEHOLDER
		    		console.log(bid);
		    		serverfile.connection.query('INSERT INTO bid SET ?', bid, function(err, result) {
		    			if (err) {
							console.error(err);
							return;
						}
						console.log("New bid has been submitted for No Buy")
			    		client.emit("bidSubmitted");
		    		});
		    	}
		    });

			client.on('disconnect', function() {
		        console.log("disconnect: ", client.id);
		        serverfile.io.removeAllListeners('connection');
	    	});
    	});
	};

module.exports.buyer_select = buyer_select;