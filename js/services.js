(function() {
	var services = angular.module("appServices", []);

	// API Call service
	services.factory("APIService", function($http, $q) {
		var api_url;
		var data = {};
		data.getData = function(url) {
			
			return $http.jsonp(url);
		}
		return data; 
	});
		
	// Get current date and 2 months prior to current date
	services.factory("dateService", function() {
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

	// adjust x and y axis as screen width changes. 
	services.factory("responsiveD3", function() {
		var responsive = {};
		responsive.width = document.getElementById("graph").clientWidth;
		responsive.height = d3.max([width * 0.35, 170]);

		var width = responsive.width,
			height = responsive.height;

		responsive.margin = { top: 0.35*height, right: 0.05*width, 		
							  bottom: 0.05*height, left: 0.11*width }
		
		var margin = responsive.margin;

		responsive.scale = function(width, height, xAxis, yAxis) {	
			xAxis.selectAll("text")
						.attr("dx", "2em")
						.attr("dy", "1em")
						.attr("transform", function(d) { return "rotate(-90)" });
			xAxis.selectAll(".xAxis_label")
						.attr("transform", "rotate(0)");


			if (width >= 500) {
				xAxis.selectAll(".xAxis_label") 
					.attr("x", (width-margin.right) * 0.40)
					.attr("y", -margin.top)

				yAxis.selectAll(".yAxis_label")
					.attr("x", -(height-margin.top) * 0.15)
				  	.attr("y", -margin.left * 0.75);
			}
			else if (width >= 400) {	
				xAxis.selectAll(".xAxis_label") 
					.attr("x", (width - margin.right) * 0.40)
					.attr("y", -margin.top * 0.90)
					.attr("transform", "rotate(0)")

				yAxis.selectAll(".yAxis_label")
					.attr("x", -(height + margin.top)*0.05)
					.attr("y", -margin.left * 0.80)
			}
			else {		
				xAxis.selectAll(".xAxis_label")
					.attr("x", (width - margin.right) * 0.38)
					.attr("y", -margin.top * 0.90)

				yAxis.selectAll(".yAxis_label")
					.attr("x", -(height+margin.top)*0.05)
					.attr("y", -margin.left * 0.72)
		
			}
		};
		return responsive; 
	});

})();