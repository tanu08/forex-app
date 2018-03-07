
var API_KEY = "54e970ef46ec4eb4c2e5c076e3c21db5";
var BASE_URL = "http://apilayer.net/api";
var currencies = "GBP,AUD,CAD,JPY,EUR,SGD,CNY";

/* APIs from https://currencylayer.com/documentation 

Live data API: 
http://apilayer.net/api/live?format=1&access_key=54e970ef46ec4eb4c2e5c076e3c21db5&currencies=GBP,AUD,CAD,JPY,EUR,SGD,CNY"

Date-range API:
http://apilayer.net/api/timeframe?format=1&access_key=54e970ef46ec4eb4c2e5c076e3c21db5&start_date=2010-03-01&end_date=2010-04-01&currencies=GBP

*/
$(document).ready(function() {
	setupEventHandlers();
	getLiveForexInfo();
});

function setupEventHandlers() {
	$('.currency-pair-container').click(function(event) {
		var currencyPair = $(event.currentTarget).attr('data-pair');
		$('.currency-pair-container').removeClass('selected');
		$(event.currentTarget).addClass('selected');
	});
}

function getLiveForexInfo() {
	var urlLive = BASE_URL + "/live?format=1&access_key=" + API_KEY + "&currencies=" + currencies;
	$.ajax({
		type: "GET",
		url: urlLive,
		success: function(response, textStatus, xhr) {
			console.log('Live Forex data: ' + response.quotes);
			_.each(response.quotes, function(value, key, list) {
				var ele = $('[data-pair=' + key + ']');
				value = (value);
				ele.find('.live-currency-info').text(value.toFixed(2) + ' ' + key.substring(3,6));
			});
		},
		error: function(xhr, textStatus, errorThrown) {
			console.error('Error while getting Live Forex data: ' + textStatus);
		}
	});
}

function getPastForexInfo(currency, start_date, end_date) {
	var urlLive = BASE_URL + "/timeframe?format=1&access_key=" + API_KEY + "&currencies=" + currency + '&start_date=' +
					start_date + '&end_date=' + end_date;
	$.ajax({
		type: "GET",
		url: urlLive,
		success: function(response, textStatus, xhr) {
			console.log('Past Forex data: ' + response.quotes);
			
		},
		error: function(xhr, textStatus, errorThrown) {
			console.error('Error while getting Past Forex data: ' + textStatus);
		}
	});
}