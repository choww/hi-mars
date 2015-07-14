(function() {
	var app = angular.module('marsWeather', ['ngRoute']);
	
	// enable CORS
	app.config(['$httpProvider', function($httpProvider) {
		$httpProvider.defaults.useXDomain = true;
		delete $httpProvider.defaults.headers.common['X-Requested-With'];
	}]);

	app.controller('weatherController', function($scope, $interval, $http, $timeout) {
		$scope.weather = [];
		$scope.test = 0;

		function getWeather() {
			var api_url = 'http://marsweather.ingenology.com/v1/latest/?format=jsonp&callback=JSON_CALLBACK'
			$http.jsonp(api_url).success(function(data) {
						$scope.weather = data;	
					}).error(function(data,status){ 
						console.log('http error'); })
		}
		getWeather();

		// query the API every 10s
		$interval(function(){
			getWeather();

			// for debugging purposes
			$scope.weather.report.sol = 'loading...';
			$scope.test++;
		},10000);

	});
})();
