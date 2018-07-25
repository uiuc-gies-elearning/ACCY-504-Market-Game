//============================================================================================================
//Query's database to get history of all seller offers and sales for every period and returns as a JSON Object
//============================================================================================================

var serverfile = require('./server.js');

var load_history = function(){
	serverfile.connection.query('SELECT * FROM history', function(err, result){
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

		for(i = 0; i<results.length; i++){
			history.phase.push(results[i]["cur_phase"]);
			history.period.push(results[i]["cur_period"]);
			history_id = results[i]["history_id"];

			serverfile.connection.query('SELECT `seller list`.seller_number, `sale history`.units_sold, `sale history`.price_sold, `sale history`.quality_id FROM `sale history` INNER JOIN `seller list` on `sale history`.seller_id = `seller list`.seller_id WHERE `sale history`.history_id = ?', history_id, function(err, rows){
				if (err) {
					console.error(err);
					return;
				}
				for(i = 0; rows.length ;i++){
					seller = rows[i][seller_number];
					if(seller==1){
						history.seller1quality.push(rows[i]["quality_id"]);
						history.seller1price.push(rows[i]["price_sold"]);
						history.seller1units.push(rows[i]["units_sold"]);
					}
					else if(seller==2){
						history.seller2quality.push(rows[i]["quality_id"]);
						history.seller2price.push(rows[i]["price_sold"]);
						history.seller2units.push(rows[i]["units_sold"]);
					}
					else{
						history.seller3quality.push(rows[i]["quality_id"]);
						history.seller3price.push(rows[i]["price_sold"]);
						history.seller3units.push(rows[i]["units_sold"]);
					}
				}
			});
		}
		console.log("This is the history: " + history);
		return history;
	});
};

module.exports.load_history = load_history;