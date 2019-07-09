// Back end functionality for the admin game initialization page. Holds a
// singular function that takes in inputs from the frontend page a simply
// creates a new instance of a game in the game table, and submits all the
// specified prices.

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

                  // XXX
                  let teams = generateTeams(serverfile.NUM_PLAYERS);
                  createTeamsForGame(game_id, teams);
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

const generateTeamNames = n => shuffle(NAMES).slice(0, n);

const generatePassword = () => '1234';

function generateTeam(name, role) {
  return {
    teamname: name,
    password: generatePassword(),
    role: role
  };
}

const generateTeams = n => generateTeamNames(n)
      .map((name, idx) => generateTeam(name, ROLES[idx]));

function createTeamForGame(gameId, team) {
  const userDto = {
    teamname: team.teamname,
    password: team.password,
    role_id: team.role,
    game_id: gameId,
    profits: 0,
    audited: null,
    buy_pos: null
  };
  return serverfile.query('INSERT INTO user SET ?', userDto);
}

const createTeamsForGame = (gameId, teams) =>
      Promise.all(teams.map(team => createTeamForGame(gameId, team)));

module.exports.game_initialization = game_initialization;
