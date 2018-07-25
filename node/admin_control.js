var serverfile = require('./server.js');

var admin_control = function(){
	    serverfile.io.on('connection', function(client) {
	    	let socket_id = [];
	    	socket_id.push(client.id);
	    	if (socket_id[0] === client.id) {
	    		serverfile.io.removeAllListeners('connection');
	    	}

	    	console.log('Client connected...');

	    	client.on('statLoad', function(data) {
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
	    				console.log(stats);
	    				client.emit("stats", stats);
	    			});

	    		});
	    	});

		    client.on('updatePeriod', function(data) {
	    		var curPeriod = serverfile.connection.query('SELECT cur_phase, cur_period FROM history ORDER BY history_id DESC LIMIT 1;', function(err, result){
		    		if (err) {
						console.error(err);
						return;
					}
					console.log(curPeriod.sql);
					console.log(result[0]["cur_period"]);
					var newPeriod = ++result[0]["cur_period"];
					var newHistory = {
						cur_phase : result[0]["cur_phase"],
						cur_period : newPeriod
					};
					var newQuery = serverfile.connection.query('INSERT INTO history SET ?', newHistory, function(err, result){
						if (err) {
							console.error(err);
							return;
						}
						console.log(newQuery.sql);
						console.log("New history record created");
					});
		    		client.emit("periodUpdate", newPeriod);
		    	});
	    	});

	    	client.on('updatePhase', function(data) {
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
						console.log(newQuery.sql);
						console.log("New history record created");
					});
		    		client.emit("periodUpdate", newPeriod);
		    		client.emit("phaseUpdate", newPhase);
		    	});
	    	});

			client.on('disconnect', function() {
		        console.log("disconnect: ", client.id);
		        serverfile.io.removeAllListeners('connection');
		    });
	    });
	};

module.exports.admin_control = admin_control;