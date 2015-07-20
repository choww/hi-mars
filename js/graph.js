(function() {
	var graph = angular.module('d3Graph', ['marsWeather']);

	graph.directive('lineGraph', function(APIService) {
		return {
			restrict: 'EA',
			scope: {
				data: '='
			},
			link: function(scope, element, attrs)  {
				var margin = {top: 40, right: 10, bottom: 10, left: 50},
					width = 500 - margin.left - margin.right;
				    height = 300 - margin.top - margin.bottom;

				// make the graph responsive 
				var svg = d3.select(element[0])
								.append("svg")
								.style("width", "100%");
				window.onresize = function() {
					scope.$apply();
				};

				scope.$watch('data', function(newVals, oldVals) {
					return scope.render(newVals);
				}, true);

				scope.render = function(data) {

				}
						// set values for x and y axis
						var y = d3.scale.linear()
									.domain([d3.min(scope.graph.map(function(d) { return d.min_temp; }).reverse()), 0])
				   					.range([height, 0])
				   					.nice();

						var x = d3.scale.ordinal()
									.domain(scope.graph.map(function(d) { return d.sol; }).reverse())
									.rangeRoundBands([0,width], .05);
						// Axes
						var xAxis = d3.svg.axis()
										.scale(x)
										.orient("top");

						var yAxis = d3.svg.axis()
										.scale(y)
										.orient("left");	  				

		  				// create the graph area 
						var chart = d3.select(".chart2")
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

						chart.append("g")
						  	.attr("class", "y axis")
						  	.call(yAxis)
						  	.append("text")
						  		.attr("transform", "rotate(-90)")
						  		.attr("y", -margin.left * 0.95)
						  		.attr("x", -height/2 + margin.top)
						  		.attr("dy", ".71em")
						  		.style("text-anchor", "end")
						  		.text("Min temp (C)");

						var min_line = d3.svg.line()
									.x(function(d) { return x(d.sol); })
									.y(function(d) { return y(d.min_temp); })

						var max_line = d3.svg.line()
										.x(function(d) { return x(d.sol); })
										.y(function(d) { return y(d.max_temp); })

						chart.append("path")
							.attr("class", "min_line")
							.attr("d", min_line($scope.graphData));

						chart.append("path")
							.attr("class", "max_line")
							.attr("d", max_line($scope.graphData));		
					});
				};
				grabData();
				}
			}

		});

	graph.controller ('graphCtrl'), function($scope, APIService) {
		var results = [];
		$scope.data = {};
		for (var num = 1; num <= 3; num++) {
			var url = "http://marsweather.ingenology.com/v1/archive/?page="+num+"&terrestrial_date_end="+today+"&terrestrial_date_start="+one_yr_earlier+"&format=jsonp&callback=JSON_CALLBACK";
			APIService.setURL(url);
			APIService.getData().then(function(data, status) {
				results.push(data.results);
				angular.forEach(results, function(page) {
					return page.
				})
			});
		};
	});
	

})();