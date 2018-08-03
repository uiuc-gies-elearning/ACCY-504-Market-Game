//=====================================================================================================
//Backend functionality for auditor bidding. Inserts bid into table 'auditor bid', and checks if all
//users in the auditor customer group have bid. If so, the user with the highest bid has their audited
//column in the users table set to true, every other user is set to false, the stage is updated, and
//the auditor bid table is cleared.
//=====================================================================================================

var serverfile = require('./server.js');

var auditor_bid = function(request){
	
	serverfile.app.io.route('bidSubmitted', function(req) {
		var user = request.user.user_id;
		var bid = {
			user_id : user,
			bid_amount : req.data
		}
		serverfile.connection.query('INSERT INTO `auditor bid` SET ?', bid, function(err, result) {
			if(err) {
				console.error(err);
				return;
			}
			serverfile.connection.query('SELECT customer_id FROM auditor WHERE game_id = 1', function(err, result) {
				if(err) {
					console.error(err);
					return;
				}
				var customer = result[0]["customer_id"];
				var maxBids;
				if(customer == 1)
					maxBids = 4;
				else
					maxBids = 3;

				serverfile.connection.query('SELECT user_id, bid_amount FROM `auditor bid`', function(err, result) {
					if(err) {
						console.error(err);
						return;
					}
					if(result.length == maxBids){
						//TODO: Randomize on matching max bids
						var bidAmounts = [];
						var userIDs = [];
						for(var i = 0; i<result.length; i++){
							bidAmounts.push(result[i]["bid_amount"]);
						}
						for(var i = 0; i<result.length; i++){
							userIDs.push(result[i]["user_id"]);
						}
						var audittedUser = userIDs[findMaxIndex(bidAmounts)];
						serverfile.connection.query('UPDATE user SET audited = 0 WHERE game_id = 1', function(err, result) {
							if(err) {
								console.error(err);
								return;
							}
							serverfile.connection.query('UPDATE user SET audited = 1 WHERE user_id = ?', audittedUser, function(err, result) {
								if(err) {
									console.error(err);
									return;
								}
								serverfile.connection.query('UPDATE game SET stage_id = 0 WHERE game_id = 1', function(err, result){
									if (err) {
										console.error(err);
										return;
									}
									serverfile.app.io.broadcast("stageUpdated", 0);
									serverfile.connection.query('DELETE FROM `auditor bid`', function(err, result){
										if (err) {
											console.error(err);
											return;
										}
										serverfile.connection.query('ALTER TABLE `auditor bid` AUTO_INCREMENT 1', function(err, result){
											if (err) {
												console.error(err);
												return;
											}
										});
									});
								});
							});
						});
					}
					else
						req.io.emit("bidWait", user);
				});
			});
		});
	});
}

function findMaxIndex(array) {
	var value =-Infinity;
	var maxIndex;
	for(var i = 0; i<array.length; i++){
		if(array[i]>value){
			maxIndex = i;
			value = array[i];
		}
	}
	return maxIndex;
}

module.exports.auditor_bid = auditor_bid;