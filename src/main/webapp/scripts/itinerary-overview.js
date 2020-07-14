document.addEventListener('DOMContentLoaded', function() {
    const elems = document.querySelectorAll('select');
    const instances = M.FormSelect.init(elems, undefined);
});


function initMap() {
    const directionsRenderer = new google.maps.DirectionsRenderer();
    const directionsService = new google.maps.DirectionsService();

    const map = new google.maps.Map(document.getElementById("map"), {
        zoom: 10,
        center: "25 Main Street, Belvedere Tiburon, CA"
    });
    directionsRenderer.setMap(map);

    calculateAndDisplayRoute(directionsService, directionsRenderer);
    document.getElementById("mode").addEventListener("change", function() {
        calculateAndDisplayRoute(directionsService, directionsRenderer);
    });

    document.getElementById("waypoints").addEventListener("change", function() {
        calculateAndDisplayRoute(directionsService, directionsRenderer);
    });
}


/**
 * Takes a latitude and longitude pair as parameters and centers the map on that specific
 * Location
 */
function setCenter(LatLng) {
    map.setCenter(LatLng)
}


/**
 * Takes a latitude and longitude value as parameters and drops a maker on that specific
 * Location
 */
function dropMarker(lat,lng) {
    const location = {lat: lat, lng: lng};
    const marker = new google.maps.Marker({
        map: map,
        position: location, //Default coords if geolocation fails
        animation: google.maps.Animation.DROP,

    });
}

function calculateAndDisplayRoute(directionsService, directionsRenderer) {
    var waypoints = [];
    var checkboxArray = document.getElementById("waypoints");
    for (var i = 0; i < checkboxArray.length; i++) {
        if (checkboxArray.options[i].selected) {
            waypoints.push({
                location: checkboxArray[i].value,
                stopover: true
            });
        }
    }

    const selectedMode = document.getElementById("mode").value;
    directionsService.route(
        {
            origin: "25 Main Street, Belvedere Tiburon, CA",
            destination: "Union Square, Post Street, San Francisco, CA",
            waypoints: waypoints,
            optimizeWaypoints: true,
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
            let lat = position.coords.latitude;
            let lng = position.coords.longitude;

            let userPos = {
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
