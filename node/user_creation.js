var serverfile = require('./server.js');

var user_create = function(io){
		//when the server receives clicked message, do this
    	serverfile.io.on('connection', function(client) {
			let socket_id = [];
	    	socket_id.push(client.id);
	    	if (socket_id[0] === client.id) {
	    		serverfile.io.removeAllListeners('connection');
	    	}
	    	
	    	console.log('Client connected...');

		    client.on('namesubmit', function(data) {
		    	var user = {
					teamname : data.name,
					role_id : data.role,
					profits : 0
				};
				var query = serverfile.connection.query('insert into user set ?', user, function(err, result){
					if (err) {
						console.error(err);
						return;
					}
					//console.error(result);
					console.log(query.sql);
					console.log(result);
				});
				client.emit('buttonUpdate', 'submitted name');
	    	});

			client.on('disconnect', function() {
		        console.log("disconnect: ", client.id);
		        //serverfile.io.removeAllListeners('connection');
		        client.disconnect(true);
		        window.location = "/";
	    	});
    	});
	};

module.exports.user_create = user_create;