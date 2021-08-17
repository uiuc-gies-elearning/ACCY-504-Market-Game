const server = require("./server.js");

const financial = d => Number.parseFloat(d).toFixed(2);

module.exports.Aaudit = (request, response) => {
  let gameid = request.user.game_id;

  server.connection.query(
    "SELECT u.teamname,bid_amount FROM `auditor bid history` ah join user u on ah.user_id=u.user_id and u.game_id=? order by bid_id",gameid,
    (err, res) => {
          if (err) {
            console.error(err);
            return;
          }
          if (res.length === 0) return;
          let players = 2;
          let nperiods = Math.ceil(res.length / players);
          let Aaudit=[];
		  console.log(res);
		  console.log(nperiods);
          for (let buyerid = 0; buyerid < players; ++buyerid) {
            let buyerBaseIdx = buyerid * nperiods;
            let Aaudit1 = {
              team: res[buyerBaseIdx]["teamname"],
              audit: [0]
            };
            for (let period = 0; period < nperiods; ++period) {
              let datavec = res[buyerBaseIdx + period];
              let audits = datavec["bid_amount"];
        
              Aaudit1.audit.push(financial(audits));
               }
            Aaudit.push(Aaudit1);
          }
          response.setHeader("Content-Type", "application/json");
          response.write(JSON.stringify(Aaudit));
          response.end();
        }
      );
    };