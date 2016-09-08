var express = require('express');
var yahooFinance = require('yahoo-finance');
var _ = require('lodash');
var User = require("../schemas/user.js");
var Stock = require("../schemas/stock.js");
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});


router.post('/message', function(req, res, next) {
	var number = req.body.From;
	var text = req.body.Body;

	if (text.includes("show") || text.includes("portfolio")) {
		var count = 0;
		var response = "";
		User.findOne({phoneNumber: number}, function(err, doc) {
			doc.pricesWhenBought.forEach(function(each) {
				Stock.findOne({_id: each}, function(err, stock) {
					response += stock.stockName + ': ';
					response += stock.stockQuantity + ' shares bought at '
					response += stock.stockPrice + ' each\n';

					count++;
					if (count == doc.pricesWhenBought.length) {
						res.send('<Response><Message>' + response + '</Message></Response>');
					}
				});
			});
		});
	}

	if (text.includes("profit")) {
		var countIt = 0;
		var countNewPrices = 0;
		var stockSymbols = [];
		var newPrices = [];
		User.findOne({phoneNumber: number}, function(err, doc) {
			doc.pricesWhenBought.forEach(function(each) {
				Stock.findOne({_id: each}, function(err, stock) {
					stockSymbols.push(stock.stockName);
					countIt++;
					if (countIt == doc.pricesWhenBought.length) {
						yahooFinance.snapshot({
							symbols: stockSymbols,
							fields: ['s', 'n', 'l1', 'd1']
						}, function(err, snapshot) {
							snapshot.forEach(function(stockBack) {
								newPrices.push(stockBack.lastTradePriceOnly);
								countNewPrices++;
								if (countNewPrices == snapshot.length) {
									calcDiff(doc.pricesWhenBought, newPrices, function(result) {
										res.send('<Response><Message> Your current profit is $' + result.toFixed(2) + '</Message></Response>');
									});
								}
							});	
						});
					}
				});
			});
		});		
	}
	if (text.includes("buy") || text.includes("Buy") || text.includes("BUY")) {
		var numLength = findNumLength(text);
		var stockSymbol = text.substring(numLength + 4);
		var numberOfStocks = findQuantity(text);

		yahooFinance.snapshot({
			symbol: stockSymbol,
			fields: ['s', 'n', 'l1', 'd1']
		}, function(err, snapshot) {
			var newStock = new Stock({
				stockName: snapshot.symbol,
				stockPrice: snapshot.lastTradePriceOnly,
				stockQuantity: numberOfStocks
			});
			newStock.save();
			var total = numberOfStocks * parseFloat(snapshot.lastTradePriceOnly);
			res.send('<Response><Message> You bought ' + numberOfStocks + ' stocks of ' + snapshot.name + ' for $' + total + '</Message></Response>');
			User.findOne({phoneNumber: number}, function(err, doc) {
				if (err) return console.error(err);
				if (doc) {
					// Update doc
					doc.pricesWhenBought.push(newStock._id);
					doc.save(function(err, updatedDoc) {
						console.log("user found and updated");
						console.log(updatedDoc);
					});
				} else { 
					var newUser = new User({
						phoneNumber: number, 
						profit: 0, 
						moneyEarned: 0, 
						pricesWhenBought: [newStock],
						pricesNow: []
					});		
					newUser.save(function(err, user) {
						if (err) return console.error(err);
						console.log("new user created");
						console.log(user);
					});
				}
			});
		});
	} 
});

function calcDiff(oldPrices, newPrices, callback) {
	var profit = 0;
	var count = 0;
	console.log(oldPrices.length, newPrices.length);
	oldPrices.forEach(function(each) {
		Stock.findOne({_id: each}, function(err, x) {
			profit += parseInt(x.stockQuantity) * (newPrices[count] - x.stockPrice);
			count++;
			if (count == oldPrices.length) {
				callback(profit);
			}
		});
	});
}

function findNumLength(text) {
	var count = 0;
	for (var k = 0; k < text.length; k++) {
		if (!isNaN(parseInt(text[k]))) {
			count++;
		}
	}
	return count;
}

function findQuantity(text) {
	var numb = text.match(/\d/g);
	numb = numb.join("");
	return numb;
}

module.exports = router;
