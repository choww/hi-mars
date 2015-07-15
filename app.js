(function() {
	var app = angular.module('marsWeather', ['ngRoute']);
	
	// enable CORS
	app.config(['$httpProvider', function($httpProvider) {
		$httpProvider.defaults.useXDomain = true;
		delete $httpProvider.defaults.headers.common['X-Requested-With'];
	}]);


	// weather data display
	app.directive('weatherData', function() {
		return {
			restrict: 'E',
			templateUrl: 'weather-data.html'
		}
	});
	app.directive('tempUnits', function(){
		return {
			restrict: 'E',
			templateUrl: 'temp-units.html'
		}
	});

	// controllers
	app.controller('tempController', function($scope) {
		$scope.unit="celsius";
		$scope.chooseUnit = function(unit) {
			$scope.unit = unit;
		};
		$scope.showUnit = function(unit) {
			return $scope.unit === unit;
		};
	});

	app.controller('weatherController', function($scope, $interval, $http) {
		$scope.weather = {};
		$scope.test = 0;

		function getWeather() {
			var api_url = 'http://marsweather.ingenology.com/v1/latest/?format=jsonp&callback=JSON_CALLBACK'
			$http.jsonp(api_url).success(function(data) {
						$scope.weather = data;
						// only load data when API query successful 
						$scope.weather.loaded = true;
					}).error(function(data,status){  
						$scope.weather.loadError = true; 
						console.log('http error', status);})
		}
		getWeather();

		// query the API every min
		$interval(function(){
			getWeather();
			// for debugging purposes
			$scope.weather.report.sol = 'loading...';
			$scope.test++;
		},60000);

	});
})();
