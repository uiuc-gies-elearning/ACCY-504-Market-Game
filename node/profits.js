const server = require("./server.js");

const financial = d => Number.parseFloat(d).toFixed(2);

module.exports.profits = (request, response) => {
  let gameid = request.user.game_id;
try{
  server.connection.query(
    "SELECT price_low, price_med, price_high, resale_low, resale_med, resale_high FROM game WHERE game_id = ?",
    gameid,
    (err, res) => {
      if (err) {
        console.error(err);
        return;
      }

      let prices = [
        res[0]["price_low"],
        res[0]["price_med"],
        res[0]["price_high"]
      ]

      let resale = [
        res[0]["resale_low"],
        res[0]["resale_med"],
        res[0]["resale_high"]
      ];
       
try{
      server.connection.query(
        "SELECT distinct u.user_id, u.teamname, bh.buy_quality, bh.buy_price, hh.audit_amount,h.cur_phase,h.cur_period FROM `buy history` bh\n" +
        "    INNER JOIN `buyer list` bl ON bh.buyer_id = bl.buyer_id\n" +
        "    INNER JOIN user u ON bl.user_id = u.user_id\n" +
        "    INNER JOIN history h ON bh.history_id = h.history_id\n" +
        "    LEFT JOIN history hh ON u.teamname = hh.audit_winner AND bh.history_id = hh.history_id\n" +
        "WHERE u.game_id = ?\n" +
        "ORDER BY u.user_id, h.cur_period",
        gameid,
        (err, res) => {
          if (err) {
            console.error(err);
            return;
          }
          if (res.length === 0) return;
		  if (res.length % 4!==0) return;
          
          let nbuyers = 4;
          let nperiods = res.length / nbuyers;

          let profits = [];
          for (let buyerid = 0; buyerid < nbuyers; ++buyerid) {
            let buyerBaseIdx = buyerid * nperiods;
			
			if (typeof res[buyerBaseIdx]==='undefined')
			{
				continue;
			}
			
            let buyerProfits = {
              team: res[buyerBaseIdx]["teamname"],
              profits: [0],
              totalProfits: [0]
            };
            let totalProfits = 0;
			//console.log(res);
            for (let period = 0; period < nperiods; ++period) {
              let datavec = res[buyerBaseIdx + period];
			  //console.log(datavec);
              let buyQuality = datavec["buy_quality"] - 1;
              let profit =
                buyQuality === 3 ? 0 : resale[buyQuality] - datavec["buy_price"] - datavec['audit_amount'];
              totalProfits += profit;
              buyerProfits.profits.push(financial(profit));
              buyerProfits.totalProfits.push(financial(totalProfits));
            }
            profits.push(buyerProfits);
          }
          response.setHeader("Content-Type", "application/json");
          response.write(JSON.stringify(profits));
          response.end();
        }
      );
	  
}

catch(err)
{
	 res.redirect('/');
}

    }
  );
  
}

catch(err)
{
	 res.redirect('/');
}
};
