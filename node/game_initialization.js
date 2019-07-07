//========================================================================================
//Backend functionality for the admin game initialization page. Holds a singular function
//that takes in inputs from the frontend page a simply creates a new instance of a game
//in the game table, and submits all the specified prices.
//========================================================================================

//Import express app and mysql connection
var serverfile = require("./server.js");

var game_initialization = function(request) {
  serverfile.app.io.route("gameSubmit", function(req) {
    var game = {
      game_name: req.data.name,
      price_low: req.data.costLQ,
      price_med: req.data.costMQ,
      price_high: req.data.costHQ,
      resale_low: req.data.resaleLQ,
      resale_med: req.data.resaleMQ,
      resale_high: req.data.resaleHQ,
      stage_id: 0
    };

    serverfile.connection.query("INSERT INTO game SET ?", game, function(
      err,
      result
    ) {
      if (err) {
        console.error(err);
        return;
      }
      var game_id = result.insertId;
      serverfile.connection.query(
        "UPDATE user SET game_id = ? WHERE user_id = ?",
        [game_id, req.session.user.user_id],
        function(err, result) {
          if (err) {
            console.error(err);
            return;
          }

          var history = {
            game_id: game_id,
            cur_phase: 1,
            cur_period: 1
          };
          serverfile.connection.query(
            "INSERT INTO history SET ?",
            history,
            function(err, result) {
              if (err) {
                console.error(err);
                return;
              }
              serverfile.connection.query(
                "INSERT INTO `game owner` (user_id, game_id) values (?, ?)",
                [req.session.user.user_id, game_id],
                function(err, result) {
                  if (err) {
                    console.error(err);
                    return;
                  }
                  req.io.emit("submitted");
                }
              );
            }
          );
        }
      );
    });
  });
};

module.exports.game_initialization = game_initialization;
