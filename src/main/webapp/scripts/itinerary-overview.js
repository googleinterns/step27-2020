document.addEventListener('DOMContentLoaded', function() {
    var elems = document.querySelectorAll('select');
    var instances = M.FormSelect.init(elems, undefined);
});


function initMap() {
    var directionsRenderer = new google.maps.DirectionsRenderer();
    var directionsService = new google.maps.DirectionsService();

    const heath = new google.maps.LatLng(32.8368128, -96.4820992);

    var map = new google.maps.Map(document.getElementById("map"), {
        zoom: 10,
        center: "25 Main Street, Belvedere Tiburon, CA"
    });
    directionsRenderer.setMap(map);

    calculateAndDisplayRoute(directionsService, directionsRenderer);
    document.getElementById("mode").addEventListener("change", function() {
        calculateAndDisplayRoute(directionsService, directionsRenderer);
        });
    }

function dropMarker(lat,lng) {
    const location = {lat: lat, lng: lng};
    const marker = new google.maps.Marker({
        map: map,
        position: location, //Default coords if geolocation fails
        animation: google.maps.Animation.DROP,

        });
    }

function calculateAndDisplayRoute(directionsService, directionsRenderer) {
    const heath = new google.maps.LatLng(32.8368128, -96.4820992);
    const summit = new google.maps.LatLng(33.0083762, -96.7793862);

    
    var selectedMode = document.getElementById("mode").value;
    directionsService.route(
        {
            origin: "25 Main Street, Belvedere Tiburon, CA",
            destination: "Union Square, Post Street, San Francisco, CA",
            // waypoints: waypoints,
            // optimizeWaypoints: true,
            travelMode: google.maps.TravelMode[selectedMode]
        },
        function(response, status) {
            if (status === "OK") {
                directionsRenderer.setDirections(response);
            } else {
                window.alert("Directions request failed due to " + status);
            }
        }
    );

    function markUserLocation() {
    navigator.geolocation.getCurrentPosition(function(position) {
        lat = position.coords.latitude;
        lng = position.coords.longitude;

        userPos = {
            lat: lat,
            lng: lng
        };

        setCenter(userPos);
        dropMarker(lat,lng);
    }, function() {
        handleLocationError(true, infoWindow, map.getCenter());
    });

    }

function handleLocationError(browserHasGeolocation, infoWindow, pos) {
    infoWindow.setPosition(pos);
    infoWindow.setContent(browserHasGeolocation ?
        'Error: The Geolocation service failed.' :
        'Error: Your browser doesn\'t support geolocation.');
    infoWindow.open(map);

    }

}

