let map;
let service;

const MTV = new google.maps.LatLng(37.3861,122.0839);

/**
 * Inits map and calls a nearby search of prominent restaurants in 5000m 
 * radius of MTV
 */
function findNearbyPlaces() {
  map = new google.maps.Map(document.getElementById('map'), {
      center: MTV,
      zoom: 15
    });

  let request = {
    location: MTV,
    radius: '5000',
    type: ['restaurant']
  };

  service = new google.maps.places.PlacesService(map);
  service.nearbySearch(request, callback);
}

/**
 * Logs the name of each place returned by nearby search in findNearbyPlaces()
 * to browser console
 * @param {Object} results array of PlaceResults objects
 * @param {Object} status status of Places API call
 */
function callback(results, status) {
  if (status === google.maps.places.PlacesServiceStatus.OK) {
    for (let i = 0; i < results.length; i++) {
      console.log(results[i].name);
    }
  }
}