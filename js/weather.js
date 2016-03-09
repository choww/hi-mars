(function() {
	var app = angular.module('marsWeather', ['ngRoute', 'appServices', 'weatherGraph']);
	
//	// enable CORS
//	app.config(['$httpProvider', function($httpProvider) {
//		$httpProvider.defaults.useXDomain = true;
//		delete $httpProvider.defaults.headers.common['X-Requested-With'];
//	}]);

	// weather data display
	app.directive('weatherData', function() {
		return {
			restrict: 'E',
			templateUrl: 'templates/weather-data.html'
		};
	});
	// celsius-fahrenheit temperature display
	app.directive('tempUnits', function() {
		return {
			restrict: 'E',
			templateUrl: 'templates/temp-units.html'
		};
	});
	// displays season in the north/south based on Ls
	app.directive('season', function() {
		return {
			restrict: 'E',
			templateUrl: 'templates/season.html'
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

	app.controller('weatherController', function($scope, $interval, APIService) {
		$scope.weather = {};
		// keep track of whether API data loaded or not
		$scope.weather.loaded = 0;

		var api_url = 'http://marsweather.ingenology.com/v1/latest/?format=jsonp&callback=JSON_CALLBACK';

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
			//}
		},100000);

	});


}) ();
