//============================================================================================================
//Query's database to get history of all seller offers and sales for every period and returns as a JSON Object
//============================================================================================================

//Import express app and mysql connection
var serverfile = require('./server.js');

var load_history = function(){

	serverfile.connection.query('SELECT * FROM history WHERE game_id = 1', function(err, result){
		if (err) {
			console.error(err);
			return;
		}

		var history = {
			phase: [], 
			period: [], 
			seller1quality: [], 
			seller2quality: [], 
			seller3quality: [], 
			seller1price: [], 
			seller2price: [], 
			seller3price: [],
			seller1units: [], 
			seller2units: [], 
			seller3units: []
		};

		//Query grabs history id, seller number, units sold, price sold, and quality sold
		serverfile.connection.query('SELECT `sale history`.history_id, `seller list`.seller_number, `sale history`.units_sold, `sale history`.price_sold, `sale history`.quality_id FROM `sale history` INNER JOIN `seller list` on `sale history`.seller_id = `seller list`.seller_id ORDER BY `sale history`.history_id ASC', function(err, rows){
			if (err) {
				console.error(err);
				return;
			}

			//Loops through all history id's, pushes in the corresponding phase/period, then matches the
			//history in the joined table, where there should be 3 corresponding seller entries
			for(i = 0; i<result.length; i++){
				history.phase.push(result[i]["cur_phase"]);
				history.period.push(result[i]["cur_period"]);
				cur_history = result[i]["history_id"];
				for(n = 0; n<rows.length; n++){
					if(rows[n]["history_id"] == cur_history){
						seller = rows[n]["seller_number"];
						if(seller==1){
							history.seller1quality.push(rows[n]["quality_id"]);
							history.seller1price.push(rows[n]["price_sold"]);
							history.seller1units.push(rows[n]["units_sold"]);
						}
						else if(seller==2){
							history.seller2quality.push(rows[n]["quality_id"]);
							history.seller2price.push(rows[n]["price_sold"]);
							history.seller2units.push(rows[n]["units_sold"]);
						}
						else if(seller==3){
							history.seller3quality.push(rows[n]["quality_id"]);
							history.seller3price.push(rows[n]["price_sold"]);
							history.seller3units.push(rows[n]["units_sold"]);
						}
						else{
							console.log("ERROR: Extraneous Seller");
						}
					}
				}
			}
			serverfile.app.io.route('loadHistory', function(req){
				req.io.emit("historyLoaded", history);
			});
		});
	});
};

module.exports.load_history = load_history;