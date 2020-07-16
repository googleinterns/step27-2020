let start;
let waypoints;
let end;

document.addEventListener('DOMContentLoaded', function() {
    const elems = document.querySelectorAll('select');
    const instances = M.FormSelect.init(elems, undefined);
});


function initMap() {
    const directionsRenderer = new google.maps.DirectionsRenderer();
    const directionsService = new google.maps.DirectionsService();
    const transitLayer = new google.maps.TransitLayer();

    const map = new google.maps.Map(document.getElementById("map"), {
        zoom: 10,
        center: start
    });

    transitLayer.setMap(map);
    directionsRenderer.setMap(map);

    calculateRoute()
    displayRoute(directionsService, directionsRenderer,start,waypoints,end);

    document.getElementById("mode").addEventListener("change", function() {
        calculateRoute()
        displayRoute(directionsService, directionsRenderer, start, waypoints, end);
    });

    // document.getElementById("waypoints").addEventListener("change", function() {
    //     displayRoute(directionsService, directionsRenderer);
    // });
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

/**
 * Takes the locations and hotel that was determined from the my trips class and organizes it into a start, midpoints
 * which are placed into a Array in travel order and an end point.
 */
//Hard coded for test
 function calculateRoute() {

    start = "5902 N President George Bush Hwy, Garland, TX 75044, USA"

    let rawWaypoints = ["525 Talbert Dr, Plano, TX 75093, USA",
        "2134 Zurek Ln, Heath, TX 75126, USA",
        "4234 Maple Ave #2403, Dallas, TX 75219, USA",]

     waypoints = [];
     end = "";

     let length = rawWaypoints.length;

    while(rawWaypoints.length > 1){
        // console.log("In Loop")
        for(let i = 0; i < rawWaypoints.length; i++){
            if(waypoints.length !== (length - 1)){
                // const response = await fetch(`https://maps.googleapis.com/maps/api/directions/json?' +
                // 'origin=${hotel}' +
                // '&destination=${rawMidpoints[i]}' +
                // '&key=AIzaSyDlLtx69Y4-65_dCK67ZX3lzKTYpyc5CWI&output=json`)
                console.log("Waypoint in If: " + rawWaypoints[0])
                waypoints.push(rawWaypoints[0])
                rawWaypoints.splice(0, 1)
                // const {results} = await response.json();
                // console.log(results)
                }
            }
        }
    console.log("Last Point: " + rawWaypoints[0])
    end += rawWaypoints.pop(0)

    console.log("Start: " + start)
    console.log("Waypoints: " + waypoints)
    console.log("End: " + end)
 }

/**
 * Takes the calculation done from the calculateRoutes function and display's the route onto the map
 * @param directionsService - the google maps directions Service constructor "google.maps.DirectionsService()"
 * @param directionsRenderer - the google maps directions Render constructor "google.maps.DirectionsRenderer()"
 * @param waypoints - the points that are in between the start(hotel) and the end of the route in an Array (Strings)
 * @param start - the origin of the trip which should be the hotel that the user is staying in.
 * @param end - the "destination" or the last point in the users route.
 */
function displayRoute(directionsService, directionsRenderer, start, waypoints, end) {
    // console.log("Starting to Display Route")

    const waypointArray = [];
    // const checkboxArray = document.getElementById("waypoints");
    // for (let i = 0; i < checkboxArray.length; i++) {
    //     if (checkboxArray.options[i].selected) {
    //         waypointArray.push({
    //             location: checkboxArray[i].value,
    //             stopover: true
    //         });
    //     }
    // }

    for(let i = 0; i < waypoints.length; i++){
        console.log("Dis Waypoint: " + waypoints[i])
        waypointArray.push({
            location: waypoints[i],
            stopover: true
        })
    }

    console.log("Done making waypoints locations")

    const selectedMode = document.getElementById("mode").value;
    directionsService.route(
        {
            origin: start,  //"25 Main Street, Belvedere Tiburon, CA",
            destination: end, //"Union Square, Post Street, San Francisco, CA",
            waypoints: waypointArray,
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
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;

            const userPos = {
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
