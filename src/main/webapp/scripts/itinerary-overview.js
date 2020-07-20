let start;
let waypoints;
let end;

document.addEventListener('DOMContentLoaded', function() {
    const elems = document.querySelectorAll('select');
    const instances = M.FormSelect.init(elems, undefined);
});


async function displayMap() {
     await getTripData();

    document.getElementById("mode").addEventListener("change", function() {
        displayRoute(start, waypoints, end);
    });

}

/**
 * Fetches that data from the TripsServlet and stores the hotel PlaceID and the locations PlaceID as variables to use
 * in the call for geocodePlaceID()
 */

async function getTripData(){
    const response = await fetch("/trip-data");
    const results = await response.json();
    console.log(results);
    const keys = Object.keys(results);

    let hotelID;
    let locationsArray;

    for (const key of keys){
        const{hotel} = parseSerializedJson(key);
        hotelID = hotel;
        locationsArray = (results[key]);
    }

    console.log("Hotel ID: " + hotelID);
    console.log("Locations A: " + locationsArray);

    for(let i = 0; i < locationsArray.length; i++){
        console.log("Place ID: " + JSON.stringify(locationsArray[i]));
    }

    geocodePlaceId(hotelID, locationsArray);
}

/**
 * Takes the hotel PlaceID and the locationsPlaceID Array from getTripData and works to convert them from placeID's to
 * addresses that will be used in calculateRoute()
 */
function geocodePlaceId(hotelID, placeIDArray) {
    console.log("Converting Place ID's to Address");
    let waypointsArray = [];
    let hotel = "";

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

    console.log("Done Converting Place ID's");
    calculateRoute(hotel, waypointsArray);
}

/**
 * Takes the locations and hotel addresses that were given by the geoCodingPlaceID() function
 * and organizes it into a start, waypoints which are placed into a Array in travel order and an end point
 * which are used for the displayRoute() function
 */

//Hard coded for test (Gonna make minor changes for final product)
async function calculateRoute(hotel, waypointsArray) {
    console.log("Calculating Optimal Route");

    start = "5902 N President George Bush Hwy, Garland, TX 75044, USA";

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

    end += rawWaypoints.pop(0);

    console.log("Done Calculating Optimal Route");

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
    console.log("Done displaying route");
}

/**
 * Takes a latitude and longitude pair as parameters and centers the map on that specific
 * Location
 */
function setCenter(coords) {
    map.setCenter(coords);
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