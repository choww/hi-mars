(function() {
	var graph = angular.module("weatherGraph", ['appServices', 'marsWeather']);

	// d3 graph directive
	graph.directive ('weatherGraph', function(responsiveD3) {
		return {
			restrict: 'E',
      controller: 'graphController',
			scope: {
				data: '=data'
			},
			link: function(scope, element, attrs) {
				var width = responsiveD3.width,
					height = responsiveD3.height;
				var margin = responsiveD3.margin, 
					hpadding = margin.right + margin.left,
					vpadding = margin.top + margin.bottom;

				// create the graph area 
				var chart_area = d3.select(element[0])
								.append("svg")
								.attr("class", "chart_area")
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
				xAxis_add.append("text")
					.text("Sol")
					.attr("class", "xAxis_label")
				yAxis_add.append("text")
					.attr("class", "yAxis_label")
					.attr("transform", "rotate(-90)")
					.text("Temperature(C)");

				// add a line where y = 0
				var zero_line = yAxis_add.append("line")
					.attr("id", "zero-line")
			  		.attr("x1", 0)
					.attr("stroke-dasharray", "8,8")

				// set up the data lines 
				var min_line_add = chart.append("path")
										.attr("class", "min_line");
				var max_line_add = chart.append("path")
										.attr("class", "max_line");
				// legend
				var legend = chart.append("g")
								  .attr("class", "legend");
		
				var max_label = legend.append("text")
								  .attr("class", "max_label")
								  .text("max temp");
				var min_label = legend.append("text")
								  .attr("class", "min_label")
								  .text("min temp");
				
				// watch for changes to the div container 
				scope.$watch(function(){
					// get new width & height
					width = document.getElementById("graph").clientWidth,
					height = d3.max([width * 0.35, 170]);
					return width + height;
				}, resize);

				function resize() {
					chart_area.attr("width", width)
					    .attr("height", height)

					x.rangeBands([0, (width - hpadding)], 0.05)
					y.range([height - vpadding, 0]);

					// from appServices
					responsiveD3.scale(width, height, xAxis_add, yAxis_add, [max_label, min_label]);

				  	zero_line.attr("y1", y(-1))
				  		.attr("y2", y(-1))
				  		.attr("x2", width - hpadding);
					updateGraph();
				}

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

					responsiveD3.scale(width, height, xAxis_add, yAxis_add, [max_label, min_label]);

					var max_line = d3.svg.line()
									.x(function(d) { return x(d.sol); })
									.y(function(d) { return y(d.max_temp); })
					var min_line = d3.svg.line()
								.x(function(d) { return x(d.sol); })
								.y(function(d) { return y(d.min_temp); });

					// shift the lines horizontally so they line up with x-axis ticks
					max_line_add.attr("d", max_line(data))
						.attr("transform", "translate("+margin.left/6+")");
					min_line_add.attr("d", min_line(data))
						.attr("transform", "translate("+margin.left/6+")");
					
					// vertical position of legend text					 
					max_label.attr("y", height/3)
					min_label.attr("y", height/2 + margin.bottom);
				}	
			}
		}
	});

	graph.controller("graphController", function($scope, $q, $window, APIService, dateService) {
		angular.element($window).on("resize", function() {$scope.$apply(); });

		$scope.agg_data = {};
		$scope.loaded = 0;

    // graph temperature in celsius or fahrenheit
    $scope.graphTempUnit = function(unit) {
     // ymin & yAxis label
     // max_line & min_line 
      console.log($scope.agg_data);
      if (unit === 'fahrenheit') {
        $scope.agg_data.forEach(function(data) {
          // but how to change it back?
          data.min_temp = data.min_temp_f;
          data.max_temp = data.max_temp_f;
        });
        return $scope.agg_data;
      } 
      else {
        $scope.agg_data.forEach(function(data) {
          
        });
      }
    }

		// combine data from multiple API calls into one aggregate data set.
		var calls = [];
		for (var num = 1; num <= 3; num++) {
			var api_url = "http://marsweather.ingenology.com/v1/archive/?page="+num+"&terrestrial_date_end="+dateService.today+"&terrestrial_date_start="+dateService.two_mnths_earlier+"&format=jsonp&callback=JSON_CALLBACK";
			calls.push(APIService.getData(api_url));
			$scope.loaded = 1;
		};

		$q.all(calls).then(function(result) {
			var results = [];
			angular.forEach(result, function(rrr) {
				angular.forEach(rrr, function(rr) {
					angular.forEach(rr.results, function(r) {
              
						results.push({
              sol: r.sol, min_temp: r.min_temp, max_temp: r.max_temp,
              min_temp_f: r.min_temp_fahrenheit, max_temp_f: r.max_temp_fahrenheit});
					})
				})
			});
			$scope.agg_data = results
			return $scope.agg_data;
		});
	});
})();
