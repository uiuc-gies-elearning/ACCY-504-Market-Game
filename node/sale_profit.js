const server = require("./server.js");

const financial = d => Number.parseFloat(d).toFixed(2);

module.exports.profits = (request, response) => {
  let gameid = request.user.game_id;

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

      server.connection.query(
        "SELECT u.teamname, bh.quality_id, bh.price_sold, units_sold,hh.audit_amount, units_sold FROM `sale history` bh INNER JOIN `seller list` bl ON bh.seller_id = bl.seller_id INNER JOIN user u ON bl.user_id = u.user_id INNER JOIN history h ON bh.history_id = h.history_id LEFT JOIN history hh ON u.teamname = hh.audit_winner AND bh.history_id = hh.history_id WHERE u.game_id = ? ORDER BY u.user_id, h.cur_period",
        gameid,
        (err, res) => {
          if (err) {
            console.error(err);
            return;
          }
          if (res.length === 0) return;
          let nbuyers = 3;
          let nperiods = res.length / nbuyers;

          let profits = [];
          for (let buyerid = 0; buyerid < nbuyers; ++buyerid) {
            let buyerBaseIdx = buyerid * nperiods;
            let buyerProfits = {
              team: res[buyerBaseIdx]["teamname"],
              profits: [0],
              totalProfits: [0]
            };
            let totalProfits = 0;
            for (let period = 0; period < nperiods; ++period) {
              let datavec = res[buyerBaseIdx + period];
              let buyQuality = datavec["quality_id"] - 1;
              let profit =
                buyQuality === 3 ? 0 : datavec["price_sold"] - prices[buyQuality] - datavec['audit_amount'];
              if (datavec["units_sold"]===2)
			  {
				  profit=profit*2-1
			  }
			  if (datavec["units_sold"]===0)
			  {
				  profit=0
			  }
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
  );
};
