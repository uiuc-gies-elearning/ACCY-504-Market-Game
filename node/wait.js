//====================================================================
//Provides wait functionality both the buyer/seller wait page. Simply 
//gives current stage and also the buy position for buyers.
//====================================================================

//Import express app and mysql connection
var serverfile = require('./server.js');

var wait = function(request){

	var userGame = request.user.game_id;
	//TODO: FIX null buyPos/stage bug
	serverfile.app.io.route('loadWaitInfo', function(req) {
		var waitInfo = {
			buyPos : null, 
			stage : null,
			auditCustomer : null
		};
		serverfile.connection.query('SELECT stage_id FROM game WHERE game_id = ?', userGame, function(err, result) {
			if (err) {
                console.error(err);
                return;
            }
			waitInfo.stage = result[0]['stage_id'];
			serverfile.connection.query('SELECT customer_id FROM auditor WHERE game_id = ?', userGame, function(err, result) {
				if (err) {
                    console.error(err);
                    return;
                }
				waitInfo.auditCustomer = result[0]['customer_id'];
				serverfile.connection.query('SELECT buy_pos FROM user WHERE user_id = ?', request.user.user_id, function(err, result) {
					if (err) {
	                    console.error(err);
	                    return;
	                }
					waitInfo.buyPos = result[0]['buy_pos'];
					console.log('start')
					console.log(waitInfo.buyPos);
					console.log(request.user.user_id);
					console.log('end')

					req.io.emit('waitInfo', waitInfo);
				});
			});
		});
	});
};

module.exports.wait = wait;