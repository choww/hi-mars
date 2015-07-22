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
	app.directive('tempUnits', function() {
		return {
			restrict: 'E',
			templateUrl: 'templates/temp-units.html'
		}
	});
	// displays season in the north/south based on Ls
	app.directive('season', function() {
		return {
			restrict: 'E',
			templateUrl: 'templates/season.html'
		}
	});

	// d3 graph directive
	app.directive ('weatherGraph', function() {
		return {
			restrict: 'E',
			scope: {
				data: '=data'
			},
			link: function(scope, element, attrs) {
				var margin = {top: 40, right: 10, bottom: 10, left: 45}, 
					hpadding = margin.right + margin.left,
					vpadding = margin.top + margin.bottom;
				var width = document.getElementById("graph").clientWidth,
					height = d3.max([window.innerHeight * 0.40, 300]);

				// create the graph area 
				var chart_area = d3.select(element[0])
								.append("svg")
								.attr("class", "chart")
				// offset the actual area where the data goes to make room for x & y axes
				var chart = chart_area.append("g")
					.attr("transform", "translate("+margin.left+","+margin.top+")");
				
				// set values for x and y axis
				var y = d3.scale.linear()
							// default value set here so zero line is in the right position 
							.domain([-90, 10])
							.nice()
							.range([height-vpadding, 0]);
				var x = d3.scale.ordinal();
				
				// set up axes
				var xAxis = d3.svg.axis()
								.scale(x)
								.orient("top");
				var yAxis = d3.svg.axis()
								.scale(y)
								.orient("left");	
				var xAxis_add = chart.append("g")
					  	.attr("class", "x axis")
				var yAxis_add = chart.append("g")
								  	.attr("class", "y axis")
								  	//.attr("transform", "translate("+margin.left/2+","+margin.top/2+")");
				// axis labels & zero line 
				var xAxis_label = xAxis_add.append("text")
									.text("Sol");
				var yAxis_label = yAxis_add.append("text")
									.attr("transform", "rotate(-90)")
									.style("text-anchor", "end")
									.text("Temperature(C)");
				// add a line where y = 0
				var zero_line = yAxis_add.append("line")
					.attr("id", "zero-line")
					.attr("y1", y(0))
				  	.attr("y2", y(0))
			  		.attr("x1", 0)
					.attr("stroke-dasharray", "10,10")

				// set up the data lines 
				var min_line_add = chart.append("path")
										.attr("class", "min_line");
				var max_line_add = chart.append("path")
										.attr("class", "max_line");

				// watch for changes to the div container 
				scope.$watch(function(){
					width = document.getElementById("graph").clientWidth,
					height = d3.max([window.innerHeight * 0.40, 300]);
					return width + height;
				}, resize);


				function resize() {
					chart_area.attr("width", width)
					    .attr("height", height)

					x.rangeBands([0, (width - hpadding)], 0.05)
					y.range([(height-vpadding), 0]);

					// add axis label
					xAxis_label.attr("x", (width+margin.right)/2)
					  	.attr("y", -margin.top *0.80)
					
					yAxis_label.attr("y", -margin.left * 0.95)
				  		.attr("x", -height/2 + margin.top)
				  		.attr("dy", ".71em");
				  	zero_line.attr("y1", y(0))
				  		.attr("y2", y(0))
				  		.attr("x2", width);
					updateGraph();
				};			

				scope.$watch('data', updateGraph);

				function updateGraph() {
					data = scope.data;
					if (!data) { return };
		    		// min y-axis value and x-axis values--have to reverse the list so data is displayed in the correct order
		    		var ymin = d3.min(data.map(function(d) { return d.min_temp; }).reverse());
		    		var xval = data.map(function(d) { return d.sol; }).reverse();
		    		
		    		// set values for x and y axis
					y.domain([ymin, 10]).nice();	
					x.domain(xval);

					xAxis_add.call(xAxis);
					yAxis_add.call(yAxis);

					var min_line = d3.svg.line()
								.x(function(d) { return x(d.sol); })
								.y(function(d) { return y(d.min_temp); });

					var max_line = d3.svg.line()
									.x(function(d) { return x(d.sol); })
									.y(function(d) { return y(d.max_temp); });

					// need to shift the lines to account for position of axes 
					min_line_add.attr("d", min_line(data))
						.attr("transform", "translate("+margin.left+")");

					max_line_add.attr("d", max_line(data))
						.attr("transform", "translate("+margin.left+")");
				};	
			}
		};
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

	app.controller("graphController", function($scope, $q, $window, APIService, dateService) {
		angular.element($window).on("resize", function() {$scope.$apply(); });

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
			$scope.agg_data = results
			return $scope.agg_data;
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

		// query the API every 10 min
		$interval(function(){
			//if ($scope.weather.connected) {
				getWeather();
				// for debugging purposes
				$scope.weather.report.sol = 'loading...';
				$scope.refresh++;
			//}
		},100000);

	});


}) ();
