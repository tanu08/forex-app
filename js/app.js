
var API_KEY = "54e970ef46ec4eb4c2e5c076e3c21db5";
var BASE_URL = "https://apilayer.net/api";
var currencies = "GBP,AUD,CAD,JPY,EUR,SGD,CNY";
var altFormat = 'yy-mm-dd'; // Format shown in input text field beside the picker
var dateFormat = "yy-mm-dd"; // Format for jquery datepicker
var momentFormat = 'YYYY-MM-DD';


/* APIs from https://currencylayer.com/documentation 

Live data API: 
http://apilayer.net/api/live?format=1&access_key=54e970ef46ec4eb4c2e5c076e3c21db5&currencies=GBP,AUD,CAD,JPY,EUR,SGD,CNY"

Date-range API:
http://apilayer.net/api/timeframe?format=1&access_key=54e970ef46ec4eb4c2e5c076e3c21db5&start_date=2010-03-01&end_date=2010-04-01&currencies=GBP

*/
$(document).ready(function() {
	setupEventHandlers();
	getLiveForexInfo();
	loadTwitterFeed();
	renderDatepickers();
	renderChartOptions();
	getChartData();
});

function setupEventHandlers() {
	$('.currency-pair-container').click(function(event) {
		if(!$(event.currentTarget).hasClass('selected')) {
			var currencyPair = $(event.currentTarget).attr('data-pair');
			$('.currency-pair-container').removeClass('selected');
			$(event.currentTarget).addClass('selected');
			getChartData();
			loadTwitterFeed();
		}
	});
	$('.chart-types button').click(function(event) {
		if(!$(event.currentTarget).hasClass('ui-state-active')) {
			$('.chart-types button').removeClass('ui-state-active');
			$(event.currentTarget).addClass('ui-state-active');
			getChartData();
		}
	});
}

function renderDatepickers() {
	var toDate = moment().format(momentFormat);
	var fromDate = moment().subtract(14, 'days').format(momentFormat);
	var defaultConfig = {
		altFormat: altFormat,
		dateFormat: dateFormat,
		changeYear: true,
		showOn: "both",
		buttonImage: "images/calendar.gif",
		changeMonth: true
    };

    var from = $( "#from-date" ).datepicker(_.extend(defaultConfig, { altField: "#from-date"})).on('change', function(fromDate) {
        getChartData();
    });
    var to = $( "#to-date" ).datepicker(_.extend(defaultConfig,{ altField: "#to-date" })).on('change', function(toDate) {
      	getChartData();
    });

	$( "#from-date" ).datepicker( "setDate", fromDate);
	$( "#to-date" ).datepicker( "setDate", toDate);
      
}

function renderChartOptions() {
	$('.chart-types').controlgroup();
}

function getLiveForexInfo() {
	var urlLive = BASE_URL + "/live?format=1&access_key=" + API_KEY + "&currencies=" + currencies;
	$.ajax({
		type: "GET",
		url: urlLive,
		cache: false,
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

function loadTwitterFeed() {
	var dataPair = $('.currency-pair-container.selected').attr('data-pair');
	var dataWidgetId = $('.currency-pair-container.selected').attr('data-widget-id');
	removeCurrentTwitterFeed();
	renderTwitterFeed(dataWidgetId, dataPair);
}

function removeCurrentTwitterFeed() {
	window.clearInterval(window.resizeIframeTimer);
	$('iframe').remove();
	$('#twitter-wjs').remove();
	$('.twitter-feed').empty();
	$('head').find('script').remove();
}

function renderTwitterFeed(widgetId, currencyPair) {

	var js,fjs=document.getElementsByTagName("script")[0], p=/^http:/.test(document.location)?'http':'https';

	var twitterTag = $(document.createElement('a'));
	twitterTag.addClass('twitter-timeline')
	twitterTag.attr('data-widget-id', widgetId);
	twitterTag.attr('href', 'https://twitter.com/hashtag/' + currencyPair);
	twitterTag.text('Loading #' + currencyPair + ' Tweets...');

	$('.twitter-feed').append(twitterTag); 

	if(!document.getElementById("twitter-wjs")) {
		js=document.createElement("script");
		js.id="twitter-wjs";
		js.src=p+"://platform.twitter.com/widgets.js";
		$('body').append(js);

		window.resizeIframeTimer = window.setInterval(function() {
			if($('.twitter-timeline.twitter-timeline-rendered').length) {
				var availableHeight = window.innerHeight - $('.news-panel-title').outerHeight();
				$('.twitter-timeline.twitter-timeline-rendered').height(availableHeight);
				window.clearInterval(window.resizeIframeTimer);
			}

		}, 50);
	}
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

function chartingColumns( data ) {
	var chartType = $('.chart-types button.ui-state-active').hasClass('line') ? 'line' : 'column';

	var columnchart = window.Highcharts.chart('chart-container', {
		chart: {
			type: chartType,
			backgroundColor: "#0b1021"
		},

		title: {
			style: { color: "#FFFFFF" },
			text: $('.currency-pair-container.selected .currency-pair-title').text() + " - Historical"
		},

		navigation: {
			buttonOptions: {
				enabled: false
			}
		},
		
		xAxis: {
            type: 'datetime',
			labels:{
				style: {
					color : "#FFFFFF",
					fontSize: "12px"
				}
			}
        },

		yAxis: [{
			min: 0,
			gridLineWidth: 0,
			labels:{
				style: {
					color : "#FFFFFF",
					fontSize: "12px"
				}
			}
		}],
		credits: {
			enabled: false
		},

		legend: {
			itemStyle: {
				color: "#FFFFFF"
			}
		},

		series: [
		{
			name : $('.currency-pair-container.selected .currency-pair-title').text(), 
			data : data, 
			color: "#22e005"
		}]
	});
}

function getChartData() {
	var data = [];
	var currencyPair = $('.currency-pair-container.selected').attr('data-pair');
	var currency = currencyPair.substring(3,6);
	var start_date = moment($( "#from-date" ).datepicker( "getDate" )).format(momentFormat);
	var end_date = moment($( "#to-date" ).datepicker( "getDate" )).format(momentFormat);

	console.log('getChartData: start_date: ' + start_date + ', end_date: ' + end_date);

	$.ajax({
		type: "GET",
		url: BASE_URL + "/timeframe?access_key=" + API_KEY + "&start_date=" + start_date + "&end_date=" + end_date + "&currencies=" + currency,
		cache: false,
		success: function(response, textStatus, xhr) {
			_.map( response.quotes , function( key, date ){
				data.push( [moment.utc( date ).valueOf(),  ( parseFloat (( key["USD" + currency] ).toFixed(4)) ) ] );
			});
			chartingColumns( data );
		},
		error: function(xhr, textStatus, errorThrown) {
			console.error('Error while getting data: ' + textStatus);
		}
	});
}
