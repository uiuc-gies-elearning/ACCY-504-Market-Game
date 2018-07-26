var serverfile = require('./server.js');

var game_initialization = function(){

    serverfile.app.io.route('gameSubmit', function(req) {
    	var game = {
    		game_name : req.data.name, 
    		price_low : req.data.costLQ, 
    		price_med : req.data.costMQ, 
    		price_high : req.data.costHQ, 
    		resale_low : req.data.resaleLQ, 
    		resale_med : req.data.resaleMQ, 
    		resale_high : req.data.resaleHQ,
    		stage_id : 1
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
		    		cur_period : 1,
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

    	req.io.emit('submitted');
	});

};

module.exports.game_initialization = game_initialization;