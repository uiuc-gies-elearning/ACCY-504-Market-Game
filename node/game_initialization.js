// Back end functionality for the admin game initialization page. Holds a
// singular function that takes in inputs from the frontend page a simply
// creates a new instance of a game in the game table, and submits all the
// specified prices.

const fs = require('fs');

// Import express app and mysql connection
var serverfile = require("./server.js");

const ROLES = Array(serverfile.NUM_PLAYERS)
      .fill(1, 0, serverfile.NUM_BUYERS)
      .fill(2, serverfile.NUM_BUYERS);

// sample usernames
const NAMES = [
  'Killer Queen',
  'Green Day',
  'Crazy Diamond',
  'Star Platinum',
  'Echoes',
  'Pearl Jam',
  'Enigma'
];

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

                  let teams = generateTeams(serverfile.NUM_PLAYERS, game_id);

                  let buyerIdx = 1, sellerIdx = 1;
                  let buyerIxo = 1; // FML
                  teams.forEach(team => {
                    let userDto = {
                      teamname: team.teamname.concat('_', game_id),
                      password: team.password,
                      role_id: team.role,
                      game_id: game_id,
                      profits: 0,
                      audited: null,
                      buy_pos: team.role === 1 ? buyerIxo++ : null
                    };
                    serverfile.connection.query('INSERT INTO user SET ?', userDto, (err2, res2) => {
                      if (err2) console.error(err2);
                      else {
                        console.log('Updating side lists');
                        console.log(res2);
                        console.log(team);
                        switch (team.role) {
                        case 1: // Buyer
                          let buyerDto = {
                            buyer_number: buyerIdx,
                            user_id: res2.insertId,
                            game_id: game_id
                          };
                          serverfile.connection.query('INSERT INTO `buyer list` SET ?', buyerDto, (errb, resb) => {
                            if (errb) console.error(errb);
                          });
                          buyerIdx++;
                          break;
                        case 2: // Seller
                          let sellerDto = {
                            seller_number: sellerIdx,
                            user_id: res2.insertId,
                            game_id: game_id
                          };
                          serverfile.connection.query('INSERT INTO `seller list` SET ?', sellerDto, (errs, ress) => {
                            if (errs) console.error(errs);
                          });
                          sellerIdx++;
                          break;
                        default: // Admin
                          break;
                        }
                      }
                    });
                  });
                }
              );
            }
          );
        }
      );
    });
  });
};

function swap(arr, a, b) {
  let tmp = arr[a];
  arr[a] = arr[b];
  arr[b] = tmp;
}

function shuffle(items) {
  let arr = items.slice();
  let curr = items.length;
  while (curr !== 0) {
    let rand = Math.floor(Math.random() * curr);
    curr--;
    swap(arr, curr, rand);
  }
  return arr;
}

const generateTeamNames = n => {
  let names = fs.readFileSync(fs.realpathSync('./res/teamnames.txt'))
    .toString()
    .trim()
    .split('\n');
  return shuffle(names).slice(0, n);
};

const generatePassword = gameid => Math.random().toString(36).substring(2) + gameid.toString(36);

function generateTeam(name, role, gameid) {
  return {
    teamname: name,
    password: generatePassword(gameid),
    role: role
  };
}

const generateTeams = (n, gameid) => generateTeamNames(n)
      .map((name, idx) => generateTeam(name, ROLES[idx], gameid));

module.exports.game_initialization = game_initialization;
