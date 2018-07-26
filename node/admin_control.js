var serverfile = require('./server.js');

var admin_control = function(){
	
	serverfile.app.io.route('statLoad', function(req) {
		serverfile.connection.query('SELECT cur_period FROM history ORDER BY history_id DESC LIMIT 1;', function(err, result){
			if (err) {
				console.error(err);
				return;
			}
			var period = result[0]["cur_period"];
			serverfile.connection.query('SELECT cur_phase FROM history ORDER BY history_id DESC LIMIT 1;', function(err, result){
				if (err) {
					console.error(err);
					return;
				}
				var phase = result[0]["cur_phase"];
				var stats = {
					period : period,
					phase : phase
				};
				req.io.emit("stats", stats);
			});

		});
	});

    serverfile.app.io.route('updatePeriod', function(req) {
		var curPeriod = serverfile.connection.query('SELECT cur_phase, cur_period FROM history ORDER BY history_id DESC LIMIT 1;', function(err, result){
    		if (err) {
				console.error(err);
				return;
			}
			var newPeriod = ++result[0]["cur_period"];
			var newHistory = {
				cur_phase : result[0]["cur_phase"],
				cur_period : newPeriod,
				game_id : 1
			};
			var newQuery = serverfile.connection.query('INSERT INTO history SET ?', newHistory, function(err, result){
				if (err) {
					console.error(err);
					return;
				}
			});
    		req.io.emit("periodUpdate", newPeriod);
    	});
	});

	serverfile.app.io.route('updatePhase', function(req) {
		serverfile.connection.query('SELECT cur_phase, cur_period FROM history ORDER BY history_id DESC LIMIT 1;', function(err, result){
    		if (err) {
				console.error(err);
				return;
			}
			var newPhase = ++result[0]["cur_phase"];
			var newPeriod = ++result[0]["cur_period"];
			var newHistory = {
				cur_phase : newPhase,
				cur_period : newPeriod
			};
			var newQuery = serverfile.connection.query('INSERT INTO history SET ?', newHistory, function(err, result){
				if (err) {
					console.error(err);
					return;
				}
			});
    		req.io.emit("periodUpdate", newPeriod);
    		req.io.emit("phaseUpdate", newPhase);
    	});
	});
};

module.exports.admin_control = admin_control;