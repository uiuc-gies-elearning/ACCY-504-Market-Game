var serverfile = require("./server.js");

var load_transactions = function(request) {
  var userGame = request.user.game_id;

  //SOCKET FUNCTION: loadBids
  serverfile.app.io.route("loadBids", function(req) {
    serverfile.connection.query(
      "SELECT `seller list`.seller_number, `buyer list`.buyer_number FROM bid INNER JOIN `buyer list` on bid.buyer_id = `buyer list`.buyer_id LEFT JOIN `seller list` on bid.seller_id = `seller list`.seller_id WHERE `buyer list`.game_id = ?",
      userGame,
      function(err, result) {
        if (err) {
          console.error(err);
          return;
        }
        var bids = {
          buyer_number: [],
          buyer_name: [],
          seller_number: []
        };
        for (var i = 0; i < result.length; i++) {
          bids.buyer_number.push(result[i]["buyer_number"]);
          bids.seller_number.push(result[i]["seller_number"]);
        }
        serverfile.connection.query(
          "SELECT `buyer list`.buyer_number, user.teamname FROM `buyer list` INNER JOIN user on `buyer list`.user_id = user.user_id WHERE user.game_id = ?",
          userGame,
          function(err, result) {
            if (err) {
              console.error(err);
              return;
            }
            var buyer_list = [];
            for (var i = 0; i < result.length; i++) {
              var insert = {
                buyer_number: result[i]["buyer_number"],
                buyer_name: result[i]["teamname"]
              };
              buyer_list.push(insert);
            }
            for (var n = 0; n < bids.buyer_number.length; n++) {
              for (var j = 0; j < buyer_list.length; j++) {
                if (bids.buyer_number[n] == buyer_list[j].buyer_number)
                  bids.buyer_name.push(buyer_list[j].buyer_name);
              }
            }
            req.io.emit("bidsLoaded", bids);
          }
        );
      }
    );
  });

  //SOCKET FUNCTION: loadOffers
  serverfile.app.io.route("loadOffers", function(req) {
    serverfile.connection.query(
      "SELECT offers.quality_id, offers.price, `seller list`.seller_number, user.teamname FROM `seller list` INNER JOIN user on `seller list`.user_id = user.user_id INNER JOIN offers on offers.seller_id = `seller list`.seller_id WHERE `seller list`.game_id = ? ORDER BY `seller list`.seller_number ASC LIMIT 3;",
      userGame,
      function(err, result) {
        if (err) {
          console.error(err);
          return;
        }
        //Accessing a null result in the array returns an error
        //console.log("Null result tester: " + result[3]["teamname"]);
        var offers = {
          //TODO: Check if null and return empty
          seller1: null,
          seller2: null,
          seller3: null
        };

        for (var i = 0; i < result.length; i++) {
          if (result[i]["seller_number"] == 1)
            offers.seller1 = {
              name: result[i]["teamname"],
              quality: result[i]["quality_id"],
              price: result[i]["price"]
            };
          else if (result[i]["seller_number"] == 2)
            offers.seller2 = {
              name: result[i]["teamname"],
              quality: result[i]["quality_id"],
              price: result[i]["price"]
            };
          else if (result[i]["seller_number"] == 3)
            offers.seller3 = {
              name: result[i]["teamname"],
              quality: result[i]["quality_id"],
              price: result[i]["price"]
            };
        }
        req.io.emit("offersLoaded", offers);
      }
    );
  });

  serverfile.app.io.route("getAuditInfo", function(req) {
    serverfile.connection.query(
      "SELECT cur_phase FROM history WHERE game_id = ? ORDER BY history_id DESC LIMIT 1",
      userGame,
      function(err, result) {
        if (err) {
          console.error(err);
          return;
        }
        var phase = result[0]["cur_phase"];
        serverfile.connection.query(
          "SELECT `seller list`.seller_number FROM user INNER JOIN `seller list` on `seller list`.user_id = user.user_id WHERE audited = 1 AND user.game_id = ?",
          userGame,
          function(err, result) {
            if (err) {
              console.error(err);
              return;
            }
            var info = {
              phase: phase,
              audited: req.session.user.audited,
              sellerAudit: null
            };

            if (result.length != 0)
              info.sellerAudit = result[0]["seller_number"];

            req.io.emit("auditInfo", info);
          }
        );
      }
    );
  });
};

module.exports.load_transactions = load_transactions;
