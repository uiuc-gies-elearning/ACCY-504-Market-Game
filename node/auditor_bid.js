//=====================================================================================================
//Backend functionality for auditor bidding. Inserts bid into table 'auditor bid', and checks if all
//users in the auditor customer group have bid. If so, the user with the highest bid has their audited
//column in the users table set to true, every other user is set to false, the stage is updated, and
//the auditor bid table is cleared.
//=====================================================================================================

var serverfile = require("./server.js");

var auditor_bid = function(request) {
  var userGame = request.user.game_id;

  serverfile.app.io.route("bidSubmitted", function(req) {
    var user = req.session.user.user_id;
    var bid = {
      user_id: user,
      bid_amount: req.data
    };
    serverfile.connection.query(
      "INSERT INTO `auditor bid` SET ?",
      bid,
      function(err, result) {
        if (err) {
          console.error(err);
          return;
        }

        var maxBids = 7;

        serverfile.connection.query(
          "SELECT `auditor bid`.user_id, `auditor bid`.bid_amount FROM `auditor bid` INNER JOIN user on `auditor bid`.user_id = user.user_id WHERE game_id = ?",
          userGame,
          function(err, result) {
            if (err) {
              console.error(err);
              return;
            }
            if (result.length == maxBids) {
              //TODO: Randomize on matching max bids or not, currently selects fastest bidder
              var bidAmounts = [];
              var userIDs = [];
              for (var i = 0; i < result.length; i++) {
                bidAmounts.push(result[i]["bid_amount"]);
                userIDs.push(result[i]["user_id"]);
              }
              var auditIndex = findMaxIndex(bidAmounts);
              var audittedUser = userIDs[auditIndex];
              var bidPrice = bidAmounts[auditIndex];
              serverfile.connection.query(
                "UPDATE user SET audited = 0 WHERE game_id = ?",
                userGame,
                function(err, result) {
                  if (err) {
                    console.error(err);
                    return;
                  }
                  serverfile.connection.query(
                    "UPDATE user SET audited = 1 WHERE user_id = ? AND game_id = ?",
                    [audittedUser, userGame],
                    function(err, result) {
                      if (err) {
                        console.error(err);
                        return;
                      }
                      serverfile.connection.query(
                        "UPDATE user SET profits = profits - ? WHERE user_id = ?",
                        [bidPrice, audittedUser],
                        function(err, result) {
                          if (err) {
                            console.error(err);
                            return;
                          }
                          serverfile.connection.query(
                            "UPDATE game SET stage_id = 0 WHERE game_id = ?",
                            userGame,
                            function(err, result) {
                              if (err) {
                                console.error(err);
                                return;
                              }
                              serverfile.connection.query(
                                "DELETE `auditor bid` FROM `auditor bid` INNER JOIN user on `auditor bid`.user_id = user.user_id WHERE game_id = ?",
                                userGame,
                                function(err, result) {
                                  if (err) {
                                    console.error(err);
                                    return;
                                  }
                                  serverfile.connection.query(
                                    "UPDATE history SET audit_winner = (SELECT teamname FROM user WHERE user_id = ?) WHERE game_id = ? ORDER BY cur_period DESC LIMIT 1",
                                    [audittedUser, userGame],
                                    function(err, result) {
                                      if (err) {
                                        console.error(err);
                                        return;
                                      }
                                      serverfile.app.io
                                        .room(userGame)
                                        .broadcast("stageUpdated", 0);
                                    }
                                  );
                                }
                              );
                            }
                          );
                        }
                      );
                    }
                  );
                }
              );
            } else req.io.emit("bidWait", req.session.user.role_id);
          }
        );
      }
    );
  });
};

function findMaxIndex(array) {
  var value = -Infinity;
  var maxIndex;
  for (var i = 0; i < array.length; i++) {
    if (array[i] > value) {
      maxIndex = i;
      value = array[i];
    }
  }
  return maxIndex;
}

module.exports.auditor_bid = auditor_bid;
