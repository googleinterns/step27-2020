var map;
var service;

const MTV = new google.maps.LatLng(37.3861,122.0839);

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

function callback(results, status) {
  if (status == google.maps.places.PlacesServiceStatus.OK) {
    for (var i = 0; i < results.length; i++) {
      console.log(results[i].name);
    }
  }
}