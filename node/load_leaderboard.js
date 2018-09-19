//=========================================================================================
//Query Database to get teamname, role, and profits from the 'user' table and sort them by
//profit in order to get a leaderboard JSON object.
//=========================================================================================

var serverfile = require('./server.js');

var load_leaderboard = function(request){

	var userGame = request.user.game_id;

	serverfile.connection.query('SELECT teamname, role_id, profits FROM user WHERE game_id = ? AND role_id <> 3', userGame, function(err, result) {
		if(err) {
			console.error(err);
			return;
		}
		var leaderboardInfo = {
			teamname : [],
			role_id : [],
			profits : []
		}

		var list = [];
		for(var n = 0; n < result.length; n++){
			list.push({teamname : result[n]["teamname"], role_id : result[n]["role_id"], profits : result[n]["profits"]});
		}
		list.sort(function(a, b){return b.profits - a.profits});

		for(var i = 0; i < list.length; i++){
			leaderboardInfo.teamname[i] = list[i].teamname;
			leaderboardInfo.role_id[i] = list[i].role_id;
			leaderboardInfo.profits[i] = list[i].profits;
		}
		serverfile.app.io.route('loadLeaderboard', function(req){
			req.io.emit("leaderboardLoaded", leaderboardInfo);
		});
	});
}

module.exports.load_leaderboard = load_leaderboard;