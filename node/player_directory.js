const server = require("./server.js");

module.exports.player_directory = (request, response) => {
  const gameId = request.user.game_id;
  server.connection.query(
    'SELECT teamname, password FROM user WHERE role_id != 3 AND game_id = ?',
    gameId,
    (err, res) => {
      if (err) {
        console.error('Failed to get player information', err);
        request.writeHead(500, err);
      } else {
        const users = [];
        for (let i = 0; i < 7; i++)
          users.push({
            teamname: res[i].teamname,
            password: res[i].password
          });
        response.setHeader("Content-Type", "application/json");
        response.write(JSON.stringify(users));
      }
      response.end();
    }
  );
};
