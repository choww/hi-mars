(function() {
	var app = angular.module('marsWeather', ['ngRoute']);
	
	// enable CORS
	app.config(['$httpProvider', function($httpProvider) {
		$httpProvider.defaults.useXDomain = true;
		delete $httpProvider.defaults.headers.common['X-Requested-With'];
	}]);

	// API Call service
	app.factory("APIService", function($http, $q) {
		var api_url;
		var data = {};
		data.getData = function(url) {
			
			return $http.jsonp(url);
		}
		return data; 
	});
		
	// Get current date and 2 months prior to current date
	app.factory("dateService", function() {
		var dates = {};

		var date = new Date();
		dates.today = date.toJSON().slice(0,10);

		var year = date.getFullYear(),
			day = date.getDate(),
			month = date.getMonth()+1;
			two_mnths = month - 2;

		// January minus 2 months is November, February minus 2 months is December
		if (two_mnths <= 0) {
			two_mnths = month + 10;
			year -= 1;
		}

		if (day < 10) {
			day = '0' + day;
		}
		if (two_mnths < 10  | month < 10) {
			two_mnths = '0' + two_mnths;
		}
		if (month < 10) {
			month = '0' + month;
		}
		dates.two_mnths_earlier = year+'-'+two_mnths+'-'+day;
		return dates;
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

	app.controller("graphController", function($scope, $q, APIService, dateService) {
		$scope.agg_data = {};

		// combine data from multiple API calls into one aggregate data set.
		var calls = [];
		for (var num = 1; num <= 3; num++) {
			var api_url = "http://marsweather.ingenology.com/v1/archive/?page="+num+"&terrestrial_date_end="+dateService.today+"&terrestrial_date_start="+dateService.two_mnths_earlier+"&format=jsonp&callback=JSON_CALLBACK";
			calls.push(APIService.getData(api_url));
		};

		$q.all(calls).then(function(result) {
			var results = [];
			angular.forEach(result, function(rrr) {
				angular.forEach(rrr, function(rr) {
					angular.forEach(rr.results, function(r) {
						results.push({sol: r.sol, min_temp: r.min_temp, max_temp: r.max_temp});
					})
				})
			});
			return results;
		}).then (function(result) {
			$scope.agg_data = result;
			//////// D3.JS STUFF ////////
			var margin = {top: 40, right: 10, bottom: 10, left: 50};
			width = 1000 - margin.left - margin.right;
		    height = 300 - margin.top - margin.bottom;

		    // min y-axis value
		    ymin = d3.min($scope.agg_data.map(function(d) { return d.min_temp; }).reverse());
			// set values for x and y axis
				var y = d3.scale.linear()
							.domain([ymin, 10])
		   					.range([height, 0])
		   					.nice();

				var x = d3.scale.ordinal()
							.domain($scope.agg_data.map(function(d) { return d.sol; }).reverse())
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
				  		.attr("y", -margin.top *0.80)
				  		.text("Sol");

				yAxis_addons = chart.append("g")
							  	.attr("class", "y axis")
							  	.call(yAxis)
				 // add a line where y = 0
				yAxis_addons.append("line")
				  		.attr("y1", y(0))
				  		.attr("y2", y(0))
				  		.attr("x1", 0)
						.attr("x2", width)
						.attr("stroke-dasharray", "10,10")
				
				yAxis_addons.append("text")
						.attr("transform", "rotate(-90)")
				  		.attr("y", -margin.left * 0.95)
				  		.attr("x", -height/2 + margin.top)
				  		.attr("dy", ".71em")
				  		.style("text-anchor", "end")
				  		.text("Temperature (C)");

				var min_line = d3.svg.line()
							.x(function(d) { return x(d.sol); })
							.y(function(d) { return y(d.min_temp); })

				var max_line = d3.svg.line()
								.x(function(d) { return x(d.sol); })
								.y(function(d) { return y(d.max_temp); })

				chart.append("path")
					.attr("class", "min_line")
					.attr("d", min_line($scope.agg_data));

				chart.append("path")
					.attr("class", "max_line")
					.attr("d", max_line($scope.agg_data));

		});
		
	});

	app.controller('weatherController', function($scope, $interval, APIService) {
		$scope.weather = {};
		$scope.refresh = 0;
		// keep track of whether API data loaded or not
		$scope.weather.loaded = 0;

		var api_url = 'http://marsweather.ingenology.com/v1/latest/?format=jsonp&callback=JSON_CALLBACK'

		function getWeather() {
			APIService.getData(api_url).success(function(data) {
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

	angular.module('d3Graph', ['marsWeather']);



}) ();
