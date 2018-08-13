var serverfile = require('./server.js');

var load_transactions = function(request){

	//SOCKET FUNCTION: loadBids
	serverfile.app.io.route('loadBids', function(req){
		serverfile.connection.query('SELECT `seller list`.seller_number, `buyer list`.buyer_number FROM bid INNER JOIN `buyer list` on bid.buyer_id = `buyer list`.buyer_id LEFT JOIN `seller list` on bid.seller_id = `seller list`.seller_id', function(err, result) {
			if(err) {
				console.error(err);
				return;
			}
			var bids = {
				buyer_number : [],
				buyer_name : [],
				seller_number : []
			}
			for(var i = 0; i < result.length; i++){
				bids.buyer_number.push(result[i]["buyer_number"]);
				bids.seller_number.push(result[i]["seller_number"]);
			}
			serverfile.connection.query('SELECT `buyer list`.buyer_number, user.teamname FROM `buyer list` INNER JOIN user on `buyer list`.user_id = user.user_id', function(err, result) {
				if(err) {
					console.error(err);
					return;
				}
				var buyer_list = [];
				for(var i = 0; i < result.length; i++){
					var insert = {buyer_number : result[i]["buyer_number"], buyer_name : result[i]["teamname"]};
					buyer_list.push(insert);
				}
				for(var n = 0; n < bids.buyer_number.length; n++){
					for(var j = 0; j < buyer_list.length; j++){
						if(bids.buyer_number[n] == buyer_list[j].buyer_number)
							bids.buyer_name.push(buyer_list[j].buyer_name);
					}
				}
				req.io.emit("bidsLoaded", bids);
			});
		});
	});	

	//SOCKET FUNCTION: loadOffers
	serverfile.app.io.route('loadOffers', function(req) {
    	serverfile.connection.query('SELECT offers.quality_id, offers.price, `seller list`.seller_number, user.teamname FROM `seller list` INNER JOIN user on `seller list`.user_id = user.user_id INNER JOIN offers on offers.seller_id = `seller list`.seller_id ORDER BY `seller list`.seller_number ASC LIMIT 3;', function(err, result){
    		if (err) {
				console.error(err);
				return;
			}
			//Accessing a null result in the array returns an error
			//console.log("Null result tester: " + result[3]["teamname"]);
			var offers = {
			//TODO: Check if null and return empty
				seller1 : null,
				seller2 : null,
				seller3 : null
			};

			if(result.length > 0)
				offers.seller1 = {name: result[0]["teamname"], quality : result[0]["quality_id"], price : result[0]["price"]};
			if(result.length > 1)
				offers.seller2 = {name: result[1]["teamname"], quality : result[1]["quality_id"], price : result[1]["price"]};
			if(result.length > 2)
				offers.seller3 = {name: result[2]["teamname"], quality : result[2]["quality_id"], price : result[2]["price"]};
			req.io.emit("offersLoaded", offers);
    	});
    });

    serverfile.app.io.route('getAuditInfo', function(req) {
    	serverfile.connection.query('SELECT cur_phase FROM history ORDER BY history_id DESC LIMIT 1', function(err, result){
    		if (err) {
				console.error(err);
				return;
			}
			var phase = result[0]["cur_phase"];
	    	serverfile.connection.query('SELECT `seller list`.seller_id FROM user INNER JOIN `seller list` on `seller list`.user_id = user.user_id WHERE audited = 1', function(err, result){
		    	if (err) {
					console.error(err);
					return;
				}
		    	var info = {
		    		phase : phase,
		    		audited : request.user.audited,
		    		sellerAudit : null
		    	};

		    	if(result.length != 0)
		    		info.sellerAudit = result[0]["seller_id"];

		    	req.io.emit('auditInfo', info);
	    	});
	    });
    });
}

module.exports.load_transactions = load_transactions;