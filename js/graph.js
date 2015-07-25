(function() {
	var graph = angular.module("weatherGraph", ['appServices', 'marsWeather']);

	// d3 graph directive
	graph.directive ('weatherGraph', function(scaleAxis) {
		return {
			restrict: 'E',
			scope: {
				data: '=data'
			},
			link: function(scope, element, attrs) {
				var width = document.getElementById("graph").clientWidth,
					height = d3.max([window.innerHeight * 0.40, 300]);
				var margin = {top: 0.25*height, right: 0.05*width, bottom: 0.05*height, left: 0.06*width}, 
					hpadding = margin.right + margin.left,
					vpadding = margin.top + margin.bottom;

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
					  	.call(xAxis)
				var yAxis_add = chart.append("g")
								  	.attr("class", "y axis")
								  	
				// axis labels & zero line 
				var xAxis_label = xAxis_add.append("text")
									.text("Sol")
									.attr("class", "xAxis_label")
									.attr("x", width/2)
									.attr("y", -margin.top * 0.90);
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
					height = d3.max([window.innerHeight/2, 300]);
					return width + height;
				}, resize);


				function resize() {
					chart_area.attr("width", width)
					    .attr("height", height)

					x.rangeBands([0, (width - hpadding)], 0.05)
					y.range([(height-vpadding), 0]);

					scaleAxis.scale(width, height, xAxis_add);

					// add axis label
					xAxis_label.attr("x", (width+margin.right)/2)
					  	.attr("y", -margin.top *0.80)
					
					yAxis_label.attr("y", -margin.left * 0.95)
				  		.attr("x", -height/2 + margin.top)
				  		.attr("dy", ".71em");
				  	zero_line.attr("y1", y(0))
				  		.attr("y2", y(0))
				  		.attr("x2", width - hpadding);
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

					scaleAxis.scale(width, height, xAxis_add);

					var min_line = d3.svg.line()
								.x(function(d) { return x(d.sol); })
								.y(function(d) { return y(d.min_temp); });

					var max_line = d3.svg.line()
									.x(function(d) { return x(d.sol); })
									.y(function(d) { return y(d.max_temp); });

					// shift the lines horizontally so they line up with x-axis ticks
					min_line_add.attr("d", min_line(data))
						.attr("transform", "translate("+margin.left/6+")");
					max_line_add.attr("d", max_line(data))
						.attr("transform", "translate("+margin.left/6+")");
				};	
			}
		};
	});

	graph.controller("graphController", function($scope, $q, $window, APIService, dateService) {
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
})();