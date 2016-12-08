(function() {
    'use strict';

    angular
        .module('app')
        .factory('GeolocationFactory', GeolocationFactory);

    GeolocationFactory.$inject = ['$sessionStorage', '$q'];

    /* @ngInject */
    function GeolocationFactory($sessionStorage, $q) {
        var service = {
            getCurrentLocation: getCurrentLocation,
            getIsEventInArea: getIsEventInArea
        };
        return service;

        ////////////////

        function success(pos) {
            // console.log('Your current position is:');
            // console.log('latitude: ' + crd.latitude);	
            // console.log('longitude: ' + crd.longitude);

        }

        function getCurrentLocation() {
           
            var defer = $q.defer();

            navigator.geolocation.getCurrentPosition(
            	function(pos) {
                  
            		var crd = pos.coords;
	            	
		        
                    defer.resolve([crd.latitude, crd.longitude]);


                 

	            }, 
	            function(err) {
	            	console.warn('ERROR(' + err.code + '): ' + err.message);
                    defer.reject(err);
	            }, 
	            {
					enableHighAccuracy: true,
					timeout: 5000,
					maximumAge: 0
	            }
	        )



	        return defer.promise;
        }

        // point1, point2, ref, desiredDistance
   function getIsEventInArea(userLocation, eventLocation, searchRadius) {

      if(searchRadius === undefined) {
        searchRadius = 5;
      }
    
       var isEventInArea = false;
       var example = [-78.3, 105.6];


       if (eventLocation === undefined || userLocation === undefined) {
           return false;
       }

       var distance = GeoFire.distance(userLocation, eventLocation);
       console.log(distance);

       if (distance < searchRadius) {
           isEventInArea = true;
           
       } 

       return isEventInArea;
   }
}
})();
