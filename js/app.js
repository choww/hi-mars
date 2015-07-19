(function() {
	var app = angular.module('marsWeather', ['ngRoute']);
	
	// enable CORS
	app.config(['$httpProvider', function($httpProvider) {
		$httpProvider.defaults.useXDomain = true;
		delete $httpProvider.defaults.headers.common['X-Requested-With'];
	}]);

	// API Call service
	app.factory("APIService", function($http) {
		var api_url;
		var data = {};
		data.setURL = function(url) {
			api_url = url;
		}
		data.getData = function() {
			
			return $http.jsonp(api_url);
		}
		return data; 

	});

	// weather data display
	app.directive('weatherData', function() {
		return {
			restrict: 'E',
			templateUrl: 'templates/weather-data.html'
		}
	});
	// celsius-fahrenheit temperature display
	app.directive('tempUnits', function(){
		return {
			restrict: 'E',
			templateUrl: 'templates/temp-units.html'
		}
	});
	// displays season in the north/south based on Ls
	app.directive('season', function(){
		return {
			restrict: 'E',
			templateUrl: 'templates/season.html'
		}
	});

	// controllers
	app.controller("tempController", function($scope) {
		$scope.unit="celsius";
		$scope.chooseUnit = function(unit) {
			$scope.unit = unit;
		};
		$scope.showUnit = function(unit) {
			return $scope.unit === unit;
		};
	});

	app.controller("seasonController", function($scope) {
		$scope.ls = {
			Ls0_90: 'Vernal equinox',
			Ls91_180: 'Summer solstice',
			Ls181_270: 'Autumnal equinox',
			Ls271_359: 'Winter solstice'
		};

		$scope.getSeason = function(ls) {
			if (ls >= 0 && ls <= 90) {
				return $scope.ls.Ls0_90;
			}
			else if (ls > 90 && ls <= 180) {
				return $scope.ls.Ls91_180;
			}
			else if (ls > 180 && ls <= 270) {
				return $scope.ls.Ls181_270;
			}
			else if (ls > 270 && ls <= 359) {
				return $scope.ls.Ls271_359;
			}
		};

	});

	app.controller("graphController", function($scope, APIService) {
		$scope.graphData = {};
			// Grab dates for the API query
		var date = new Date(),
			today = date.toJSON().slice(0,10);

		// Grab the date for one year before today
		var year = date.getFullYear(),
			day = date.getDate(),
			month = date.getMonth()+1;

		if (day < 10) {
			day = '0' + day;
		}
		if (month < 10) {
			month = '0' + month;
		}
		var one_yr_earlier = (year-1)+'-'+month+'-'+day;
		var api_url = "http://marsweather.ingenology.com/v1/archive/?terrestrial_date_end="+today+"&terrestrial_date_start="+one_yr_earlier+"&format=jsonp&callback=JSON_CALLBACK";

		////////// D3JS STUFF //////////
		var margin = {top: 40, right: 10, bottom: 10, left: 50};
			width = 500 - margin.left - margin.right;
		    height = 300 - margin.top - margin.bottom;
					
		// Use API Service 
		function getData() {
			APIService.setURL(api_url);
			APIService.getData().success(function(data) {
					$scope.graphData = data.results;

					// set values for x and y axis
					var y = d3.scale.linear()
								.domain([d3.min($scope.graphData.map(function(d) { return d.min_temp; })), 0])
			   					.range([height, 0])
			   					.nice();

					var x = d3.scale.ordinal()
								.domain($scope.graphData.map(function(d) { return d.sol; }))
								.rangeRoundBands([0,width], .05);
	  				
	  				// Axes
					var xAxis = d3.svg.axis()
									.scale(x)
									.orient("top");

					var yAxis = d3.svg.axis()
									.scale(y)
									.orient("left");	  				

	  				// create the graph area 
					var chart = d3.select(".chart")
					    .attr("width", width+ margin.left + margin.right)
					    .attr("height", height + margin.top + margin.bottom)
					    .append("g")
					    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

					chart.append("g")
					  	.attr("class", "x axis")
					  	.attr("transform", "translate(0,0)")
					  	.call(xAxis)
					  	// add axis label
						.append("text")
					  		.attr("x", (width+margin.right)/2)
					  		.attr("y", -margin.top/2 - 10)
					  		.text("sol");

					chart.append("g")
					  	.attr("class", "y axis")
					  	.call(yAxis)
					  	.append("text")
					  		.attr("transform", "rotate(-90)")
					  		.attr("y", -margin.left/2 - 10)
					  		.attr("x", -height/2 + margin.top)
					  		.attr("dy", ".71em")
					  		.style("text-anchor", "end")
					  		.text("Min temp (C)");

					var line = d3.svg.line()
								.x(function(d) { return x(d.sol); })
								.y(function(d) { return y(d.min_temp); })

					chart.append("path")
						.attr("class", "line")
						.attr("d", line($scope.graphData));

					/**
					BAR GRAPH

	  				// create a new class .bar here instead so we don't select the axes 
					var bar = chart.selectAll(".bar")
					      		.data($scope.graphData).enter();
					bar.append("rect")
					  	.attr("class", "bar")
					  	.attr("x", function(d) { return x(d.sol); })
					    .attr("y", 0)
					    .attr("height", function(d) { return Math.abs(y(d.min_temp));} )
					    .attr("width", x.rangeBand());
					**/

				}).error(function(data, status) {
					console.log('http error', status);
				});
		};
		getData();
		
	});

	app.controller('weatherController', function($scope, $interval, APIService) {
		$scope.weather = {};
		$scope.refresh = 0;
		// keep track of whether API data loaded or not
		$scope.weather.loaded = 0;

		var api_url = 'http://marsweather.ingenology.com/v1/latest/?format=jsonp&callback=JSON_CALLBACK'

		function getWeather() {
			APIService.setURL(api_url);
			APIService.getData().success(function(data) {
				$scope.weather = data;
				// only load data when API query successful 
				$scope.weather.loaded = 1;
			}).error(function(data, status) {
				$scope.weather.loaded = 2;
				console.log('http error', status);
			});

		}
		getWeather();

		// query the API every min
		$interval(function(){
			//if ($scope.weather.connected) {
				getWeather();
				// for debugging purposes
				$scope.weather.report.sol = 'loading...';
				$scope.refresh++;
			//}
		},10000);

	});



})();
