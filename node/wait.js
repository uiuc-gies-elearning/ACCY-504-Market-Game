//====================================================================
//Provides wait functionality both the buyer/seller wait page. Simply 
//gives current stage and also the buy position for buyers.
//====================================================================

//Import express app and mysql connection
var serverfile = require('./server.js');

var wait = function(request){
	//TODO: FIX null buyPos/stage bug
	serverfile.app.io.route('loadWaitInfo', function(req) {
		var waitInfo = {
			buyPos : request.user.buy_pos, 
			stage : null,
			auditCustomer : null
		};
		serverfile.connection.query('SELECT stage_id FROM game WHERE game_id = 1', function(err, result) {
			if (err) {
                console.error(err);
                return;
            }
			waitInfo.stage = result[0]['stage_id'];
			serverfile.connection.query('SELECT customer_id FROM auditor WHERE game_id = 1', function(err, result) {
				if (err) {
                    console.error(err);
                    return;
                }
				waitInfo.auditCustomer = result[0]['customer_id'];
				req.io.emit('waitInfo', waitInfo);
			});
		});
	});
};

module.exports.wait = wait;