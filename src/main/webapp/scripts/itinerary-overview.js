let start;
let waypoints;
let end;

let hotel;
let waypointsArray;

document.addEventListener('DOMContentLoaded', function() {
    const elems = document.querySelectorAll('select');
    const instances = M.FormSelect.init(elems, undefined);
});


function displayMap() {
    getTripData().then()

    document.getElementById("mode").addEventListener("change", function() {
        displayRoute(start, waypoints, end);
    });

}


async function getTripData(){
    const response = await fetch("/trip-data");
    const results = await response.json();
    console.log(results);
    const keys = Object.keys(results)

    for (let key of keys){
        const{title, hotel} = parseSerializedJson(key);
        console.log("Trip Title: " + title)
        console.log("Hotel Place ID:" + hotel)
        console.log("Locations: " + JSON.stringify(results[key]))
    }
    calculateRoute()
}

function geocodePlaceId(hotelID, placeIDArray) {
    console.log("Converting Place ID's to Address")
     waypointsArray = [];
     hotel = "";

    const geocoder = new google.maps.Geocoder();
    for(let place of placeIDArray){
        geocoder.geocode({placeId: place}, function(results, status) {
            if (status === "OK") {
                if (results[0]) {
                    waypointsArray.push(results[0].geometry.location);
                } else {
                    window.alert("No results found");
                }
            } else {
                window.alert("Geocoder failed due to: " + status);
            }
        });
    }

    geocoder.geocode({placeId: hotelID}, function(results, status) {
        if (status === "OK") {
            if (results[0]) {
                hotel += (results[0].geometry.location);
            } else {
                window.alert("No results found");
            }
        } else {
            window.alert("Geocoder failed due to: " + status);
        }
    });

    console.log("Done Converting Place ID's")
    calculateRoute(hotel, waypointsArray)
}

/**
 * Takes the locations and hotel that was determined from the my trips class and organizes it into a start, midpoints
 * which are placed into a Array in travel order and an end point.
 */
//Hard coded for test
async function calculateRoute(hotel, waypointsArray) {
    console.log("Calculating Optimal Route")

    start = "5902 N President George Bush Hwy, Garland, TX 75044, USA"

    let rawWaypoints = ["525 Talbert Dr, Plano, TX 75093, USA",
        "2134 Zurek Ln, Heath, TX 75126, USA",
        "4234 Maple Ave #2403, Dallas, TX 75219, USA",]

    waypoints = [];
    end = "";

    let length = rawWaypoints.length;

    while(rawWaypoints.length > 1){
        for(let i = 0; i < rawWaypoints.length; i++){
            if(waypoints.length !== (length - 1)){
                waypoints.push(rawWaypoints[0])
                rawWaypoints.splice(0, 1)
            }
        }
    }

    end += rawWaypoints.pop(0)

    console.log("Done Calculating Optimal Route")

    displayRoute(start,waypoints,end);
}

/**
 * Takes the calculation done from the calculateRoutes function and display's the route onto the map
 * @param waypoints - the points that are in between the start(hotel) and the end of the route in an Array (Strings)
 * @param start - the origin of the trip which should be the hotel that the user is staying in.
 * @param end - the "destination" or the last point in the users route.
 */
function displayRoute(start, waypoints, end) {
    console.log("Starting to Display Route")

    const directionsRenderer = new google.maps.DirectionsRenderer();
    const directionsService = new google.maps.DirectionsService();
    const transitLayer = new google.maps.TransitLayer();

    const map = new google.maps.Map(document.getElementById("map"), {
        zoom: 10,
        center: start
    });

    transitLayer.setMap(map);
    directionsRenderer.setMap(map);

    const waypointArray = [];

    for(let i = 0; i < waypoints.length; i++){
        console.log("Dis Waypoint: " + waypoints[i])
        waypointArray.push({
            location: waypoints[i],
            stopover: true
        })
    }

    const selectedMode = document.getElementById("mode").value;
    directionsService.route(
        {
            origin: start,
            destination: end,
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
    console.log("Done displaying route")
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