const path = require('path')

const server = require(path.join(__dirname, 'server.js'))

const stage_query = 'SELECT stage_id FROM game WHERE game_id = ?'

module.exports.Stages = Object.freeze({
  SellerPick: 0,
  BuyerOnePick: 1,
  BuyerTwoPick: 2,
  BuyerThreePick: 3,
  BuyerFourPick: 4,
  AuditBid: 5,
  Results: 6
})

module.exports.current_stage = gameid => {
  server.connection.query(stage_query, gameid, (err, res) => {
    if (err) return -1
    else return res[0]['stage_id']
  })
}