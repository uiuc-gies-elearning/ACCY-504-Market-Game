const server = require('./server.js')

let financial = d => Number.parseFloat(d).toFixed(2)

module.exports.profits = (request, response) => {
  let gameid = request.user.game_id

  server.connection.query(
    'SELECT resale_low, resale_med, resale_high FROM game WHERE game_id = ?',
    gameid,
    (err, res) => {
      if (err) {
        console.error(err)
        return
      }

      let resale = [
        res[0]['resale_low'],
        res[0]['resale_med'],
        res[0]['resale_high']
      ]

      server.connection.query(
        'SELECT user.teamname, `buy history`.buy_quality, `buy history`.buy_price, history.cur_period FROM `buy history` INNER JOIN history ON `buy history`.history_id = history.history_id INNER JOIN `buyer list` ON `buyer list`.buyer_id = `buy history`.buyer_id INNER JOIN user ON user.user_id = `buyer list`.user_id WHERE `user`.game_id = ? ORDER BY `buyer list`.user_id, history.cur_period',
        gameid,
        (err, res) => {
          if (err) {
            console.error(err)
            return
          }
          if (res.length == 0)
            return
          let nbuyers = 4
          let nperiods = res.length / nbuyers;

          let profits = []
          for (let buyerid = 0; buyerid < nbuyers; ++buyerid) {
            let buyerBaseIdx = buyerid * nperiods;
            let buyerProfits = {
              team: res[buyerBaseIdx]['teamname'],
              profits: [0],
              totalProfits: [0]
            }
            let totalProfits = 0
            for (let period = 0; period < nperiods; ++period) {
              let datavec = res[buyerBaseIdx + period]
              let buyQuality = datavec['buy_quality'] - 1
              let profit =
                buyQuality == 3 ? 0
                                : resale[buyQuality] - datavec['buy_price']
              totalProfits += profit
              buyerProfits.profits.push(financial(profit))
              buyerProfits.totalProfits.push(financial(totalProfits))
            }
            profits.push(buyerProfits)
          }
          response.setHeader('Content-Type', 'application/json')
          response.write(JSON.stringify(profits))
          response.end()
        }
      )
    }
  )
}