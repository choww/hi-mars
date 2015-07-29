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
	services.factory("scaleAxis", function() {
		var responsive = {};
		responsive.scale = function(width, height, xAxis, yAxis) { 
			var margin = {top: 0.28*height, right: 0.05*width, bottom: 0.05*height, left: 0.20*width}
			
			if (width > 900) { 
				xAxis.selectAll("text")
					.attr("dx", "0.25em")
					.attr("dy", "0.25em")
					.attr("transform", "rotate(0)");

				xAxis.selectAll(".xAxis_label") 
					.attr("x", width/2 - margin.right)
					.attr("y", -margin.top * 0.)

				yAxis.selectAll(".yAxis_label")
					.attr("x", -(height - margin.top) * 30)
				  	.attr("y", -margin.left * 0.25)
			}
			else if (width >= 500) {
				xAxis.selectAll("text")
					.attr("dx", "2.2em")
					.attr("dy", "1.5em")
					.attr("transform", function(d) { return "rotate(-90)" });

				xAxis.selectAll(".xAxis_label") 
					.attr("transform", "rotate(0)")
					.attr("x", (width-margin.right) * 0.4)
					.attr("y", -margin.top * 0.83)

				yAxis.selectAll(".yAxis_label")
					.attr("x", -(height-margin.top) * 0.30)
				  	.attr("y", -margin.left/3);
			}
			else if (width >= 370) {
				xAxis.selectAll("text")
					.attr("dx", "2.2em")
					.attr("dy", "1.5em")
					.attr("transform", function(d) { return "rotate(-90)"});

				xAxis.selectAll(".xAxis_label") 
					.attr("x", (width - margin.right) * 0.40)
					.attr("y", -margin.top * 0.88)
					.attr("transform", "rotate(0)")

				yAxis.selectAll(".yAxis_label")
					.attr("x", -(height + margin.top)*0.18)
					.attr("y", -margin.left/3)
			}
			else  {
				xAxis.selectAll("text")
					.attr("dx", "2.2em")
					.attr("dy", "1.3em")
					.attr("transform", function(d) {return "rotate(-90)"})

				xAxis.selectAll(".xAxis_label")
					.attr("x", (width - margin.right) * 0.40)
					.attr("y", -margin.top)
					.attr("transform", "rotate(0)");

				yAxis.selectAll(".yAxis_label")
					.attr("x", -(height+margin.top)*0.25)
					.attr("y", -margin.left/2)
		
			}
		};
		return responsive; 
	});

})();