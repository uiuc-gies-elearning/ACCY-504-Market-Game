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
	});
    
	serverfile.app.io.route('selectGame', function(req) {
		var game_id = req.data;
		var user = req.session.user.user_id;
        serverfile.connection.query('SELECT user_id FROM `game owner` WHERE game_id = ?', game_id, function(err, result) {
            if (err) {
                console.error(err);
                return;
            }
            var isOwner = false;
            if(result[0]["user_id"] == user)
                isOwner = true;
            if(req.session.user.role_id == 3 && !isOwner)
                req.io.emit('joinFail', 'notOwner');
            else{
                serverfile.connection.query('SELECT user_id, role_id FROM user WHERE game_id = ?', game_id, function(err, result) {
                    if (err) {
                        console.error(err);
                        return;
                    }
                    if(result.length >= 8)
                        req.io.emit('joinFail', 'gameFull');
                    else{
                        var buyerCount = 0;
                        var sellerCount = 0;
                        for(var i = 0; i < result.length; i++){
                            if(result[i]['role_id'] == 1)
                                buyerCount++;
                            else if(result[i]['role_id'] == 2)
                                sellerCount++;
                        }
                        if(buyerCount >= 4 && req.session.user.role_id == 1)
                            req.io.emit('joinFail', 'buyersFull');
                        else if(sellerCount >=3 && req.session.user.role_id == 2)
                            req.io.emit('joinFail', 'sellersFull');
                        else{
                            serverfile.connection.query('UPDATE user SET game_id = ? WHERE user_id = ?', [game_id, user], function(err, result) {
                                if (err) {
                                    console.error(err);
                                    return;
                                }
                                userInitialization(req.session.user.role_id, game_id, function(){
                                    req.io.emit('gameSelected');
                                });
                            });
                        }
                    }
                });
            }

        });
	});

	function userInitialization(role, game, callback) {
        var userID = request.session.user.user_id;
        
        if(role == 1){
            serverfile.connection.query('SELECT buyer_number FROM `buyer list` WHERE game_id = ? ORDER BY buyer_id DESC LIMIT 1', game, function(err, result){
                if(err) {
                    console.error(err);
                    return;
                }
                var new_buyer_number = 1;
                if(result.length != 0)
                    new_buyer_number = ++result[0]["buyer_number"];
                var newBuyer = {
                    buyer_number : new_buyer_number,
                    user_id : userID,
                    game_id : game
                }
                serverfile.connection.query('INSERT INTO `buyer list` SET ?', newBuyer, function(err, result) {
                    if(err) {
                        console.error(err);
                        return;
                    }
                    serverfile.connection.query('UPDATE user SET buy_pos = ? WHERE user_id = ?', [newBuyer.buyer_number, userID], function(err, result) {
                        if(err) {
                            console.error(err);
                            return;
                        }
                    });
                });
            });
        }
        
        else if(role == 2){
            serverfile.connection.query('SELECT seller_number FROM `seller list` ORDER BY seller_id DESC LIMIT 1', function(err, result){
                if(err) {
                    console.error(err);
                    return;
                }
                var new_seller_number = 1;
                if(result.length != 0)
                    new_seller_number = ++result[0]["seller_number"];
                var newSeller = {
                    seller_number : new_seller_number,
                    user_id : userID,
                    game_id : game
                }
                serverfile.connection.query('INSERT INTO `seller list` SET ?', newSeller, function(err, result) {
                    if(err) {
                        console.error(err);
                        return;
                    }
                });
            });
        }
        callback();
	};
};

module.exports.game_room = game_room;