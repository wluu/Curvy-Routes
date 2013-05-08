// This file will help generate curvy and smooth routes using Google's directions API
var cr = {};
module.exports = cr; 

/*
 * Parameters
 * 	start : Modules.Map.Annotation
 * 		- The start point of type Modules.Map.Annotation
 *  
 * 	dest : Modules.Map.Annotation
 * 		- The destination point of type Module.Map.Annotation
 *  
 * 	waypoints : [Modules.Map.Annotation]
 * 		- An array of points (of type Module.Map.Annotation) to pass through to get to dest
 * 
 * Returns (by reference)
 * 	routePoints : [{latitude:number,longitude:number}]
 * 		- An array of objects which is made up of latitude and longitude coordinates
 * 
 */
cr.getRoutePoints = function(start, dest, waypoints, routePoints) {
	
	var wp = '';
	for(var i = 0; i < waypoints.length; i++) {
		wp += '|' + waypoints[i].latitude + ',' + waypoints[i].longitude;
	}
	var s = start.latitude + ',' + start.longitude;
	var d = dest.latitude + ',' + dest.longitude;
	
	// https://developers.google.com/maps/documentation/directions/#DirectionsRequests
	var url = 'http://maps.googleapis.com/maps/api/directions/json?origin=' + s + '&destination=' + d + '&sensor=true&waypoints=optimize:true' + wp;
	 
	var client = Ti.Network.createHTTPClient({

		onload : function(e) {

			var directionData = JSON.parse(this.responseText);

			// Repsonse elements from Google: https://developers.google.com/maps/documentation/directions/#DirectionsResponseElements
			var legs = directionData.routes[0].legs;

			for (var i = 0; i < legs.length; i++) {

				var steps = legs[i].steps;

				for (var j = 0; j < steps.length; j++) {

					var startPoint = {
						latitude : 0,
						longitude : 0
					};
					var endPoint = {
						latitude : 0,
						longitude : 0
					};

					startPoint.latitude = steps[j].start_location.lat;
					startPoint.longitude = steps[j].start_location.lng;
					routePoints.push(startPoint);

					decodePolylinePoints(steps[j].polyline.points, routePoints);

					endPoint.latitude = steps[j].end_location.lat;
					endPoint.longitude = steps[j].end_location.lng;
					routePoints.push(endPoint);
				}
			}
		},

		onerror : function(e) {
			Ti.API.debug(e.error);
			alert('error');
		},

		timeout : 5000 // in milliseconds
	});

	client.open("GET", url);
	client.send(); 
};

// decoding polyline points: http://stackoverflow.com/questions/6708408/map-view-draw-directions-using-google-directions-api-decoding-polylines
// Google's polyline utility: https://developers.google.com/maps/documentation/utilities/polylineutility
function decodePolylinePoints(encodedPoints, routePoints) {
	var index = 0,
		lat = 0,
		lng = 0;
	
	while(index < encodedPoints.length) {
		var shift = 0,
			result = 0;
	
		while(true) {
			// ? = 63
			var b = encodedPoints.charCodeAt(index++) - 63;
			result |= ((b & 31) << shift);
			shift += 5;
			if(b < 32) break; 
		}
		lat += ((result & 1) != 0 ? ~(result >> 1) : result >> 1);
		
		shift = 0;
		result = 0;
		while (true) {
		    var b = encodedPoints.charCodeAt(index++) - 63;
		    result |= ((b & 31) << shift);
		    shift += 5;
		    if (b < 32) break;
		}
		lng += ((result & 1) != 0 ? ~(result >> 1) : result >> 1);
		
		var polyPoint = {
			latitude: 0,
			longitude: 0
	    };
	    polyPoint.latitude = (lat/1e5);
	    polyPoint.longitude = (lng/1e5);
	    routePoints.push(polyPoint);
	}
};
