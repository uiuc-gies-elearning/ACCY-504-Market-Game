var serverfile = require('./server.js');

var game_room = function(request){
	serverfile.app.io.route('getRole', function(req) {
		req.io.emit('userRole', request.user.role_id);
	});

	serverfile.app.io.route('loadGames', function(req) {
		serverfile.connection.query('SELECT game_id, game_name FROM game', function(err, result) {
    		if (err) {
				console.error(err);
				return;
			}
			var gameList = {
				game_id : [],
				game_name : []
			}
			for(var i = 0; i < result.length; i++){
				gameList.game_id.push(result[i]["game_id"]);
				gameList.game_name.push(result[i]["game_name"]);
			}
			req.io.emit('gamesLoaded', gameList);
	});

	serverfile.app.io.route('selectGame', function(req) {
		var game_id = req.data;
		var user = req.user.user_id;
		serverfile.connection.query('UPDATE user SET game_id = ? WHERE user_id = ?', [game_id, user], function(err, result) {
			if (err) {
				console.error(err);
				return;
			}
			req.io.emit('gameSelected');
		});
	});


	function userInitialization(role) {
		
        newUserMysql.user_id = rows.insertId;

        if(role == 1){
            connection.query('SELECT buyer_number FROM `buyer list` ORDER BY buyer_id DESC LIMIT 1', function(err, result){
                if(err) {
                    console.error(err);
                    return;
                }
                var new_buyer_number = 1;
                if(result.length != 0)
                    new_buyer_number = ++result[0]["buyer_number"];
                var newBuyer = {
                    buyer_number : new_buyer_number,
                    user_id : rows.insertId
                }
                connection.query('INSERT INTO `buyer list` SET ?', newBuyer, function(err, result) {
                    if(err) {
                        console.error(err);
                        return;
                    }
                });
                connection.query('UPDATE user SET buy_pos = ? WHERE user_id = ?', [newBuyer.buyer_number, newBuyer.buyer_id], function(err, result) {
                    if(err) {
                        console.error(err);
                        return;
                    }
                });
            });
        }
        else if(role == 2){
            connection.query('SELECT seller_number FROM `seller list` ORDER BY seller_id DESC LIMIT 1', function(err, result){
                if(err) {
                    console.error(err);
                    return;
                }
                var new_seller_number = 1;
                if(result.length != 0)
                    new_seller_number = ++result[0]["seller_number"];
                var newSeller = {
                    seller_number : new_seller_number,
                    user_id : rows.insertId
                }
                connection.query('INSERT INTO `seller list` SET ?', newSeller, function(err, result) {
                    if(err) {
                        console.error(err);
                        return;
                    }
                });
            });
        }
	}
};

module.exports.game_room = game_room