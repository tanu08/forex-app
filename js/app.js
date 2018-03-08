
var API_KEY = "54e970ef46ec4eb4c2e5c076e3c21db5";
var BASE_URL = "https://apilayer.net/api";
var currencies = "GBP,AUD,CAD,JPY,EUR,SGD,CNY";
var LIVE_FOREX_INFO_POLL_INTERVAL = 5 * 60 * 1000; // (in milliseconds)
var POLLING_INFO_TIMER = 5 * 60 * 1000;
var pollingInfoTimer, pollingTimer;
var altFormat = 'yy-mm-dd'; // Format shown in input text field beside the picker
var dateFormat = "yy-mm-dd"; // Format for jquery datepicker
var momentFormat = 'YYYY-MM-DD';
var previousFromDate = moment().subtract(14, 'days').format(momentFormat);
var previousToDate = moment().format(momentFormat);

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
			updateDatepickers(currencyPair);
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
	$(window).on('resize', function() {
		adjustTwitterFeedSize();
	});
}

function updateDatepickers(currencyPair) {
	if(currencyPair === 'USDCNY') {
		$( "#from-date" ).datepicker("option", { disabled: true });
		$( "#to-date" ).datepicker("option", { disabled: true });
		previousFromDate = $( "#from-date" ).datepicker( "getDate" );
		previousToDate = $( "#to-date" ).datepicker( "getDate" );
		setDatepickerDates("2017-06-02", "2017-09-15");
	} else {
		$( "#from-date" ).datepicker("option", { disabled: false });
		$( "#to-date" ).datepicker("option", { disabled: false });
		setDatepickerDates(previousFromDate, previousToDate);
	}
}

function renderDatepickers() {
	var defaultConfig = {
		altFormat: altFormat,
		dateFormat: dateFormat,
		changeYear: true,
		showOn: "both",
		buttonImage: "images/calendar.gif",
		changeMonth: true
    };

    var from = $( "#from-date" ).datepicker(_.extend(defaultConfig, { altField: "#from-date"})).on('change', function(fromDate) {
        previousFromDate = $( "#from-date" ).datepicker( "getDate" );
        getChartData();
    });
    var to = $( "#to-date" ).datepicker(_.extend(defaultConfig,{ altField: "#to-date" })).on('change', function(toDate) {
      	previousToDate = $( "#to-date" ).datepicker( "getDate" );
      	getChartData();
    });

    setDatepickerDates(previousFromDate, previousToDate);
}

function setDatepickerDates(fromDate, toDate) {
	$( "#from-date" ).datepicker( "setDate", fromDate);
	$( "#to-date" ).datepicker( "setDate", toDate);
}

function renderChartOptions() {
	$('.chart-types').controlgroup();
}

function getLiveForexInfo() {
	var urlLive = BASE_URL + "/live?format=1&access_key=" + API_KEY + "&currencies=" + currencies;
	$('.live-polling-status').addClass('hide');
	
	$.ajax({
		type: "GET",
		url: urlLive,
		cache: false,
		success: function(response, textStatus, xhr) {
			console.log('Live Forex data: ' + response.quotes);

			_.each(response.quotes, function(value, key, list) {

				var ele = $('[data-pair=' + key + ']');
				var currentValue = parseFloat(ele.find('.live-currency-info').attr('data-current-value'));
				
				ele.find('.live-currency-info').attr('data-current-value', value).text(value.toFixed(3) + ' ' + key.substring(3,6));
				
				if(!_.isNaN(currentValue) && value > 0 && (currentValue !== value)) {
					var percentageChange = Math.abs(((value - currentValue) / currentValue) * 100).toFixed(3);
					var increased = value > currentValue ? true : false;
					if(percentageChange > 0.001) {
						ele.find('.percentage-change').removeClass('increase decrease').text(percentageChange);
						increased ? ele.find('.percentage-change').addClass('increase') : ele.find('.percentage-change').addClass('decrease');
					}
				}
			});
			startPollingInfoTimer();
		},
		error: function(xhr, textStatus, errorThrown) {
			console.error('Error while getting Live Forex data: ' + textStatus);
		}
	});
}

function startLiveForexInfoPoll() {
	pollingTimer = window.setInterval(function() {
		clearInterval(pollingInfoTimer);
		clearInterval(pollingTimer);
		getLiveForexInfo();
	}, LIVE_FOREX_INFO_POLL_INTERVAL + 1000);
}

function startPollingInfoTimer() {
	var localTimerValue = POLLING_INFO_TIMER;

	pollingInfoTimer = window.setInterval(function() {
		var minutes = moment.duration(localTimerValue).minutes();
		var seconds = moment.duration(localTimerValue).seconds();
		var timeLeft = '';
		if(minutes > 0)  {
			timeLeft += minutes + ' minutes ';
		}
		if(seconds >= 0) {
			timeLeft += seconds + ' seconds';
		}
		$('.live-polling-time-left').text(timeLeft);
		$('.live-polling-status').removeClass('hide');
		localTimerValue -= 1000;

		if(localTimerValue < 0) {
			clearInterval(pollingInfoTimer);
			getLiveForexInfo();
			POLLING_INFO_TIMER = LIVE_FOREX_INFO_POLL_INTERVAL;
		}
	}, 1000);

	//startLiveForexInfoPoll();
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

function adjustTwitterFeedSize() {
	if($('iframe.twitter-timeline.twitter-timeline-rendered').length &&
	   $('iframe.twitter-timeline.twitter-timeline-rendered').outerHeight() > 0) {
		var availableHeight = window.innerHeight - $('.news-panel-title').outerHeight() - 5;
		$('iframe.twitter-timeline-rendered').css({"height": availableHeight + "px" });
		window.clearInterval(window.resizeIframeTimer);
	}
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
			adjustTwitterFeedSize();
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

function chartingColumns( data, currencyPair, predictedData) {
	var chartType = $('.chart-types button.ui-state-active').hasClass('line') ? 'line' : 'column';
	var highestValue, lowestValue;
	var chartTitle = $('.currency-pair-container.selected .currency-pair-title').text() + " - Historical";

	lowestValue = highestValue = data[0][1];

	_.each(data, function(ele, i, list) {
		if(lowestValue > ele[1]) {
			lowestValue = ele[1];
		}
		else if(highestValue < ele[1]) {
			highestValue = ele[1];
		}
	});

	highestValue = highestValue + (0.002 * highestValue);
	lowestValue = lowestValue - (0.002 * lowestValue);

	var series = [
		{
			name : $('.currency-pair-container.selected .currency-pair-title').text() + ' (Historical)', 
			data : data, 
			color: "cyan"
		}];

	if(currencyPair === 'USDCNY' && predictedData) {
		
		series.push({
			name : $('.currency-pair-container.selected .currency-pair-title').text() + ' (Predicted)', 
			data : predictedData, 
			color: "#E96F38"
		});
		chartTitle = $('.currency-pair-container.selected .currency-pair-title').text() + " - Historical & Predicted"
	}

	var columnchart = window.Highcharts.chart('chart-container', {
		chart: {
			type: chartType,
			backgroundColor: "#0b1021"
		},

		title: {
			style: { color: "#FFFFFF" },
			text: chartTitle
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
			min: lowestValue,
			max: highestValue,
			gridLineWidth: 0,
			//tickInterval: 0.00001,
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

		series: series
	});
}

function processPredictedData (quotes, predictedQuotes, currencyPair) {
	var data = [], predictedData = []; 

	_.each( quotes , function( ele, index, list ){
		data.push( [moment.utc( ele.val0, 'DD/MM/YY' ).valueOf(),  ( parseFloat ((ele.val1).toFixed(6)) ) ] );
	});
	_.each( predictedQuotes , function( ele, index, list ){
		predictedData.push( [moment.utc( ele.val0, 'DD/MM/YY' ).valueOf(),  ( parseFloat ((ele.val1).toFixed(6)) ) ] );
	});
	chartingColumns( data, currencyPair, predictedData);
};

function processAPIData(quotes, currencyPair) {
	var data = [], currency = currencyPair.substring(3,6);; 

	_.each( quotes , function( key, date ){
		data.push( [moment.utc( date ).valueOf(),  ( parseFloat (( key["USD" + currency] ).toFixed(6)) ) ] );
	});
	chartingColumns( data, currencyPair );
};

function getChartData() {
	
	var currencyPair = $('.currency-pair-container.selected').attr('data-pair');
	var currency = currencyPair.substring(3,6);
	var start_date = moment($( "#from-date" ).datepicker( "getDate" )).format(momentFormat);
	var end_date = moment($( "#to-date" ).datepicker( "getDate" )).format(momentFormat);

	if(currencyPair === 'USDCNY') {
		processPredictedData(USDCNYQuotes, USDCNYQuotesPredicted, currencyPair);

	} else {

		$.ajax({
			type: "GET",
			url: BASE_URL + "/timeframe?access_key=" + API_KEY + "&start_date=" + start_date + "&end_date=" + end_date + "&currencies=" + currency,
			cache: false,
			success: function(response, textStatus, xhr) {
				processAPIData(response.quotes, currencyPair);
			},
			error: function(xhr, textStatus, errorThrown) {
				console.error('Error while getting data: ' + textStatus);
			}
		});
	}
}


var USDCNYQuotes = [
{"val0":"02/06/17","val1":6.807},
{"val0":"05/06/17","val1":6.7935},
{"val0":"06/06/17","val1":6.7934},
{"val0":"07/06/17","val1":6.7858},
{"val0":"08/06/17","val1":6.793},
{"val0":"09/06/17","val1":6.7971},
{"val0":"12/06/17","val1":6.7948},
{"val0":"13/06/17","val1":6.7954},
{"val0":"14/06/17","val1":6.7939},
{"val0":"15/06/17","val1":6.7852},
{"val0":"16/06/17","val1":6.7995},
{"val0":"19/06/17","val1":6.7972},
{"val0":"20/06/17","val1":6.8096},
{"val0":"21/06/17","val1":6.8193},
{"val0":"22/06/17","val1":6.8197},
{"val0":"23/06/17","val1":6.8238},
{"val0":"26/06/17","val1":6.822},
{"val0":"27/06/17","val1":6.8292},
{"val0":"28/06/17","val1":6.8053},
{"val0":"29/06/17","val1":6.794},
{"val0":"30/06/17","val1":6.7744},
{"val0":"03/07/17","val1":6.7772},
{"val0":"04/07/17","val1":6.7889},
{"val0":"05/07/17","val1":6.7922},
{"val0":"06/07/17","val1":6.7953},
{"val0":"07/07/17","val1":6.7914},
{"val0":"10/07/17","val1":6.7964},
{"val0":"11/07/17","val1":6.7983},
{"val0":"12/07/17","val1":6.7868},
{"val0":"13/07/17","val1":6.7802},
{"val0":"14/07/17","val1":6.7774},
{"val0":"17/07/17","val1":6.7562},
{"val0":"18/07/17","val1":6.7611},
{"val0":"19/07/17","val1":6.7451},
{"val0":"20/07/17","val1":6.7464},
{"val0":"21/07/17","val1":6.7415},
{"val0":"24/07/17","val1":6.741},
{"val0":"25/07/17","val1":6.7485},
{"val0":"26/07/17","val1":6.7529},
{"val0":"27/07/17","val1":6.7307},
{"val0":"28/07/17","val1":6.7373},
{"val0":"31/07/17","val1":6.7283},
{"val0":"01/08/17","val1":6.7148},
{"val0":"02/08/17","val1":6.7205},
{"val0":"03/08/17","val1":6.7211},
{"val0":"04/08/17","val1":6.7132},
{"val0":"07/08/17","val1":6.7228},
{"val0":"08/08/17","val1":6.7184},
{"val0":"09/08/17","val1":6.7075},
{"val0":"10/08/17","val1":6.677},
{"val0":"11/08/17","val1":6.6642},
{"val0":"14/08/17","val1":6.6601},
{"val0":"15/08/17","val1":6.6689},
{"val0":"16/08/17","val1":6.6779},
{"val0":"17/08/17","val1":6.6709},
{"val0":"18/08/17","val1":6.6744},
{"val0":"21/08/17","val1":6.6709},
{"val0":"22/08/17","val1":6.6597},
{"val0":"23/08/17","val1":6.6633},
{"val0":"24/08/17","val1":6.6525},
{"val0":"25/08/17","val1":6.6579},
{"val0":"28/08/17","val1":6.6353},
{"val0":"29/08/17","val1":6.6293},
{"val0":"30/08/17","val1":6.6102},
{"val0":"31/08/17","val1":6.601},
{"val0":"01/09/17","val1":6.5909},
{"val0":"04/09/17","val1":6.5668},
{"val0":"05/09/17","val1":6.537},
{"val0":"06/09/17","val1":6.5311},
{"val0":"07/09/17","val1":6.5269},
{"val0":"08/09/17","val1":6.5032},
{"val0":"11/09/17","val1":6.4997},
{"val0":"12/09/17","val1":6.5277},
{"val0":"13/09/17","val1":6.5382},
{"val0":"14/09/17","val1":6.5465},
{"val0":"15/09/17","val1":6.5423}
];

var USDCNYQuotesPredicted = [
{"val0":"02/06/17","val1":6.806517239},
{"val0":"05/06/17","val1":6.794742886},
{"val0":"06/06/17","val1":6.800063838},
{"val0":"07/06/17","val1":6.788253148},
{"val0":"08/06/17","val1":6.793203608},
{"val0":"09/06/17","val1":6.797526035},
{"val0":"12/06/17","val1":6.789721899},
{"val0":"13/06/17","val1":6.793245889},
{"val0":"14/06/17","val1":6.792135932},
{"val0":"15/06/17","val1":6.785582722},
{"val0":"16/06/17","val1":6.806054903},
{"val0":"19/06/17","val1":6.798587945},
{"val0":"20/06/17","val1":6.822850478},
{"val0":"21/06/17","val1":6.82739101},
{"val0":"22/06/17","val1":6.819490364},
{"val0":"23/06/17","val1":6.825940837},
{"val0":"26/06/17","val1":6.830316083},
{"val0":"27/06/17","val1":6.833641352},
{"val0":"28/06/17","val1":6.811960733},
{"val0":"29/06/17","val1":6.790419381},
{"val0":"30/06/17","val1":6.778546411},
{"val0":"03/07/17","val1":6.773609561},
{"val0":"04/07/17","val1":6.788590884},
{"val0":"05/07/17","val1":6.793053573},
{"val0":"06/07/17","val1":6.79472653},
{"val0":"07/07/17","val1":6.793497271},
{"val0":"10/07/17","val1":6.796764478},
{"val0":"11/07/17","val1":6.797546072},
{"val0":"12/07/17","val1":6.786819954},
{"val0":"13/07/17","val1":6.778947778},
{"val0":"14/07/17","val1":6.779384209},
{"val0":"17/07/17","val1":6.760635556},
{"val0":"18/07/17","val1":6.76707663},
{"val0":"19/07/17","val1":6.752684464},
{"val0":"20/07/17","val1":6.748443998},
{"val0":"21/07/17","val1":6.745970415},
{"val0":"24/07/17","val1":6.757540824},
{"val0":"25/07/17","val1":6.754138933},
{"val0":"26/07/17","val1":6.753650802},
{"val0":"27/07/17","val1":6.729068791},
{"val0":"28/07/17","val1":6.744881506},
{"val0":"31/07/17","val1":6.729640188},
{"val0":"01/08/17","val1":6.718584852},
{"val0":"02/08/17","val1":6.722177225},
{"val0":"03/08/17","val1":6.71555488},
{"val0":"04/08/17","val1":6.712505519},
{"val0":"07/08/17","val1":6.728772153},
{"val0":"08/08/17","val1":6.713381275},
{"val0":"09/08/17","val1":6.706638153},
{"val0":"10/08/17","val1":6.677509602},
{"val0":"11/08/17","val1":6.655826533},
{"val0":"14/08/17","val1":6.653428147},
{"val0":"15/08/17","val1":6.665637864},
{"val0":"16/08/17","val1":6.67392816},
{"val0":"17/08/17","val1":6.671400836},
{"val0":"18/08/17","val1":6.677845132},
{"val0":"21/08/17","val1":6.669804059},
{"val0":"22/08/17","val1":6.661662391},
{"val0":"23/08/17","val1":6.659864464},
{"val0":"24/08/17","val1":6.649789933},
{"val0":"25/08/17","val1":6.656208626},
{"val0":"28/08/17","val1":6.639528956},
{"val0":"29/08/17","val1":6.632597395},
{"val0":"30/08/17","val1":6.613367487},
{"val0":"31/08/17","val1":6.596104131},
{"val0":"01/09/17","val1":6.583284729},
{"val0":"04/09/17","val1":6.566685208},
{"val0":"05/09/17","val1":6.529495901},
{"val0":"06/09/17","val1":6.529516618},
{"val0":"07/09/17","val1":6.526997091},
{"val0":"08/09/17","val1":6.486961625},
{"val0":"11/09/17","val1":6.473520278},
{"val0":"12/09/17","val1":6.513319565},
{"val0":"13/09/17","val1":6.532336877},
{"val0":"14/09/17","val1":6.542888574},
{"val0":"15/09/17","val1":6.538921239}
];

