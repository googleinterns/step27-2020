let service;
let map;

const MTV = new google.maps.LatLng(37.4220, 122.0841);

function findNearbyPlaces() {
    map = new google.maps.Map(document.getElementById('map'), {
        center: MTV,
        zoom: 15
    });

    let request = {
        location: MTV,
        radius: '5000',
        rankBy: google.maps.places.RankBy.PROMINENCE,
        type: ['restaurant']
    };

    service = new google.maps.places.PlaceServices(map);
    service.nearbySearch(request, callback);
}

function callback(results, status) {
    if(status == google.maps.places.PlaceServices.OK) {
        for(let i = 0; i < 5; i++) {
            console.log(results[i].name);
        }
    }
}