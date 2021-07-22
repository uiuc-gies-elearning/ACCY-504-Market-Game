const server = require("./server.js");

module.exports.player_directory = (request, response) => {
  const gameId = request.user.game_id;
  server.connection.query(
    'SELECT teamname, password, if(role_id=2, "Seller", "Buyer") as Role, if(`user`=1,"logged-in","logged-out") as Login FROM user WHERE role_id != 3 AND game_id = ? order by role_id',
    gameId,  (err, res) => {
      if (err){
        console.log(err);
        response.render('login',{message:err});
      }
      else{
        response.render('player_directory', { players: res });
      }
      console.log(res);
    }
  );
};
