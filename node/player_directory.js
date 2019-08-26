const server = require("./server.js");

module.exports.player_directory = (request, response) => {
  const gameId = request.user.game_id;
  server.connection.query(
    'SELECT teamname, password FROM user WHERE role_id != 3 AND game_id = ?',
    gameId,  (err, res) => {
      if (err)
        response.render('login');
      else
        response.render('player_directory', { players: res });
      console.log(res);
    }
  );
};
