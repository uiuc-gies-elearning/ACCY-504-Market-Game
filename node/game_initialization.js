var serverfile = require('./server.js');

var game_initialization = function(){
	    serverfile.io.on('connection', function(client) {
	    	let socket_id = [];
	    	socket_id.push(client.id);
	    	if (socket_id[0] === client.id) {
	    		serverfile.io.removeAllListeners('connection');
	    	}

	    	console.log('Client connected...');   

		    client.on('gameSubmit', function(data) {
		    	var game = {
		    		game_name : data.name, 
		    		price_low : data.costLQ, 
		    		price_med : data.costMQ, 
		    		price_high : data.costHQ, 
		    		resale_low : data.resaleLQ, 
		    		resale_med : data.resaleMQ, 
		    		resale_high : data.resaleHQ
		    	};

		    	var query = serverfile.connection.query('INSERT INTO game SET ?', game, function(err, result){
		    		if (err) {
						console.error(err);
						return;
					}
					console.log(query.sql);
					console.log(result);
					var currGameState = serverfile.connection.query('SELECT game_id FROM game ORDER BY game_id DESC LIMIT 1', function(err, result){
						var history = {
				    		game_id : result[0]["game_id"],
				    		cur_phase : 1,
				    		cur_period : 1
			    		};
				    	var historyInitialization = serverfile.connection.query('INSERT INTO history SET ?', history, function(err, result){
				    		if (err) {
								console.error(err);
								return;
							}
							console.log(historyInitialization.sql);
							console.log(result);
				    	});
			    	});
		    	});

		    	client.emit('submitted');
	    	});

			client.on('disconnect', function() {
		        console.log("disconnect: ", client.id);
		        serverfile.io.removeAllListeners('connection');
		    });
	    });
	};

module.exports.game_initialization = game_initialization;