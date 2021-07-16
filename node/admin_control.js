//============================================
//Backend functionality for the admin control.
//============================================

//Import express app and mysql connection
const serverfile = require("./server.js");

var admin_control = function(request) {
  const userGame = request.user.game_id;
  const gameid = userGame;

  // serverfile.app.io.route("reset", req => {
  //   let semaphore = 6;
  //   serverfile.connection.query('DELETE FROM bid INNER JOIN `seller list` ON seller_id WHERE game_id = ?', gameid, (err, res) => semaphore--);
  //   serverfile.connection.query('DELETE FROM `auditor bid` INNER JOIN user ON user_id WHERE game_id = ?', gameid, (err, res) => semaphore--);
  //   serverfile.connection.query('DELETE FROM `buy history` INNER JOIN history ON history_id WHERE game_id = ?', gameid, (err, res) => semaphore--);
  //   serverfile.connection.query('DELETE FROM `sale history` INNER JOIN history ON history_id WHERE game_id = ?', gameid, (err, res) => semaphore--);
  //   serverfile.connection.query('DELETE FROM history WHERE game_id = ?', gameid, (err, res) => semaphore--);
  //   serverfile.connection.query('UPDATE user SET profits = 0, audited = NULL, buy_pos = NULL WHERE game_id = ? AND role_id != 3', gameid, (err, res) => semaphore--);
  // });

  //The 'Stats' loaded include the current phase, period, and stage
  serverfile.app.io.route("statLoad", function(req) {
    var auditwinner;
    serverfile.connection.query(
      "SELECT cur_period, audit_winner FROM history WHERE game_id = ? ORDER BY history_id DESC LIMIT 1",
      userGame,
      function(err, result) {
        if (err) {
          console.error(err);
          return;
        }
        auditwinner = result[0]["audit_winner"]
        var period = result[0]["cur_period"];
        serverfile.connection.query(
          "SELECT cur_phase FROM history WHERE game_id = ? ORDER BY history_id DESC LIMIT 1",
          userGame,
          function(err, result) {
            if (err) {
              console.error(err);
              return;
            }
            var phase = result[0]["cur_phase"];
            var stats = {
              period: period,
              phase: phase,
              stage: null,
              audited_name: null,
              audited_role: null
            };
            serverfile.connection.query(
              "SELECT stage_id FROM game WHERE game_id = ?",
              userGame,
              function(err, result) {
                if (err) {
                  console.error(err);
                  return;
                }
                stats.stage = result[0]["stage_id"];
                serverfile.connection.query(
                  "SELECT teamname, role_id FROM user WHERE game_id = ? AND audited = 1",
                  userGame,
                  function(err, result) {
                    if (auditwinner == null) {
                      stats.audited_name = null;
                      stats.audited_role = null;
                    }
                    else if (result.length > 0) {
                      stats.audited_name = result[0]["teamname"];
                      stats.audited_role = result[0]["role_id"];
                    }
                    req.io.emit("stats", stats);
                  }
                );
              }
            );
          }
        );
      }
    );
  });

  //Uses count of sellers in offers to query # of offers submitted
  //TODO: Use table joins to check game id as well
  serverfile.app.io.route("sellerUpdate", function(req) {
    serverfile.connection.query(
      "SELECT COUNT(*) FROM offers INNER JOIN `seller list` on offers.seller_id = `seller list`.seller_id WHERE game_id = ?",
      userGame,
      function(err, result) {
        if (err) {
          console.error(err);
          return;
        }
        var num_of_offers = result[0]["COUNT(*)"];
        req.io.emit("sellerUpdated", num_of_offers);
      }
    );
  });

  //Uses count of buyers in bid to query # of bids submitted
  //TODO: Use table joins to check game id as well
  serverfile.app.io.route("buyerUpdate", function(req) {
    serverfile.connection.query(
      "select COUNT(*) from bid",
      userGame,
      function(err, result) {
        if (err) {
          console.error(err);
          return;
        }
        var num_of_bids = result[0]["COUNT(*)"];
        req.io.emit("buyerUpdated", num_of_bids);
      }
    );
  });

  //On period update, a new history row is created, the buy order is randomized, and the offers/bid tables are cleared
  serverfile.app.io.route("updatePeriod", function(req) {
    var curPeriod = serverfile.connection.query(
      "SELECT cur_phase, cur_period FROM history WHERE game_id = ? ORDER BY history_id DESC LIMIT 1;",
      userGame,
      function(err, result) {
        if (err) {
          console.error(err);
          return;
        }
        var newPeriod = ++result[0]["cur_period"];
        var phase = result[0]["cur_phase"];
        var newHistory = {
          cur_phase: phase,
          cur_period: newPeriod,
          game_id: userGame
        };

        var newQuery = serverfile.connection.query(
          "INSERT INTO history SET ?",
          newHistory,
          function(err, result) {
            if (err) {
              console.error(err);

            }
          }
        );

        randomizeBuyOrder(userGame, function() {
          var newStage;
          if (phase == 3) {
            console.log("reached here");
            newStage = 5;
          } else newStage = 0;

          serverfile.connection.query(
            "UPDATE game SET stage_id = ? WHERE game_id = ?",
            [newStage, userGame],
            function(err, result) {
              if (err) {
                console.error(err);
                return;
              }
              req.io
                .room(req.session.game_id)
                .broadcast("stageUpdated", newStage);
            }
          );

          clearPeriodData(userGame);
          req.io.emit("periodUpdate", newPeriod);
        });
      }
    );
  });

  //On phase update, a new history row is created, the buy order is randomized, and the offers/bid tables are cleared
  //Stage is updated based on whether or not it is phase 3 (if phase == 3, auditor bid stage is set)
  serverfile.app.io.route("updatePhase", function(req) {
    serverfile.connection.query(
      "SELECT cur_phase, cur_period FROM history WHERE game_id = ? ORDER BY history_id DESC LIMIT 1",
      userGame,
      function(err, result) {
        if (err) {
          console.error(err);
          return;
        }
        var newPhase = ++result[0]["cur_phase"];
        var newPeriod = ++result[0]["cur_period"];
        var newHistory = {
          cur_phase: newPhase,
          cur_period: newPeriod,
          game_id: userGame
        };

        var newQuery = serverfile.connection.query(
          "INSERT INTO history SET ?",
          newHistory,
          function(err, result) {
            if (err) {
              console.error(err);

            }
          }
        );

        randomizeBuyOrder(userGame, function() {
          var newStage;
          if (newPhase == 3) {
            newStage = 5;
          } else newStage = 0;

          serverfile.connection.query(
            "UPDATE game SET stage_id = ? WHERE game_id = ?",
            [newStage, userGame],
            function(err, result) {
              if (err) {
                console.error(err);
                return;
              }
              req.io
                .room(req.session.game_id)
                .broadcast("stageUpdated", newStage);
            }
          );

          clearPeriodData(userGame);
          req.io.emit("periodUpdate", newPeriod);
          req.io.emit("phaseUpdate", newPhase);
        });
      }
    );
  });

  //Doesn't change stage number, simply loads it
  serverfile.app.io.route("stageUpdate", function(req) {
    serverfile.connection.query(
      "SELECT stage_id FROM game WHERE game_id = ?",
      userGame,
      function(err, result) {
        var cur_stage = result[0]["stage_id"];
        req.io.emit("stageUpdated", cur_stage);
      }
    );
  });

  serverfile.app.io.route("reset", req => {
    const queries = [
      'DELETE FROM `auditor bid` WHERE user_id IN (SELECT user_id FROM users WHERE game_id = ?)',
      'DELETE FROM bid WHERE buyer_id IN (SELECT buyer_id FROM `buyer list` WHERE game_id = ?)',
      'DELETE FROM `buy history` WHERE buyer_id IN (SELECT buyer_id FROM `buyer list` WHERE game_id = ?)',
      'DELETE FROM `sale history` WHERE seller_id IN (SELECT seller_id FROM `seller list` WHERE game_id = ?)',
      'DELETE FROM history WHERE NOT (cur_phase = 1 AND cur_period = 1) AND game_id = ?',
      'DELETE FROM offers WHERE seller_id IN (SELECT seller_id FROM `seller list` WHERE game_id = ?)',
      'UPDATE game SET stage_id = 0 WHERE game_id = ?',
      'UPDATE user SET profits = 0 WHERE role_id IN (1, 2) AND game_id = ?'
    ];
    queries.forEach(q => serverfile.connection.query(q, gameid, (_err, _res) => 0));
    req.io.room(req.session.game_id).broadcast("gameReset");
  });

  serverfile.app.io.route('delete_game', req => {
  
    console.log('Game being deleted');
	
    serverfile.connection.query('UPDATE user SET game_id = null WHERE role_id = 3 and game_id= ?', gameid, (_err, _res) => {
      if (_err) {
        console.error('Failed','UPDATE user SET game_id = null WHERE role_id = 3 and game_id= ?');
        console.error(_err);
      }
      console.log('Update done');
    
    });
    

for( var i=0 ;i<10000000;i++)
{
var a=i;
	
}

 serverfile.connection.query('DELETE FROM game WHERE game_id = ?', gameid, (_err, _res) => {
      if (_err) {
        console.error('Failed','DELETE FROM game WHERE game_id = ?');
        console.error(_err);
      }
      console.log('delete done');
    
    });
  });
  
  
  serverfile.app.io.route('gameDelete', req =>{
	  req.io.room(req.session.game_id).broadcast('game_delete');

  });
  
  
  serverfile.app.io.route('forceForward', req => {
    req.io
      .room(req.session.user.game_id)
      .broadcast('gameforced');
    console.log('broadcast game force');
    }
  );
}

//Buy order must be randomized at the start of every period/phase
//This function uses a shuffle helper function to insert a randomized
//buy order
function randomizeBuyOrder(userGame, callback) {
  var order = shuffle([1, 2, 3, 4]);
  var list = [0, 1, 2, 3];
  list.forEach(function(element) {
    serverfile.connection.query(
      "SELECT user_id FROM `buyer list` WHERE game_id = ?",
      userGame,
      function(err, result) {
        if (err) {
          console.error(err);
          return;
        }
        user = result[element]["user_id"];
        buyPosition = order[element];
        serverfile.connection.query(
          "UPDATE user SET buy_pos = ? WHERE user_id = ?",
          [buyPosition, user],
          function(err, result) {
            if (err) {
              console.error(err);
              return;
            }
            callback();
          }
        );
      }
    );
  });
}

function shuffle(array) {
  var currentIndex = array.length,
    temporaryValue,
    randomIndex;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {
    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}

function clearPeriodData(userGame) {
  serverfile.connection.query(
    "DELETE bid FROM bid INNER JOIN `buyer list` on bid.buyer_id = `buyer list`.buyer_id WHERE game_id = ?",
    userGame,
    function(err, result) {
      if (err) {
        console.error(err);

      }
    }
  );
  serverfile.connection.query(
    "DELETE offers FROM offers INNER JOIN `seller list` on offers.seller_id = `seller list`.seller_id WHERE game_id = ?",
    userGame,
    function(err, result) {
      if (err) {
        console.error(err);

      }
    }
  );
}

module.exports.admin_control = admin_control;