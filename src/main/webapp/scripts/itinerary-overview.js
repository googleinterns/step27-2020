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

    const response = await fetch('/trip-data', {
        method: 'GET',
    });
    const tripsData = await response.json();
    const keys = Object.keys(tripsData);

    //Hotel
    let hotel_ID;
    let hotel_name;

    //Locations
    let locationArray;
    let waypointNames = [];
    let waypointIDs = [];

    for (let key of keys) {
        // Fields of tripsData are currently in string format.
        // Deserialize using parseSerializedJson.
        const {
            hotelID,
            hotelName,
        } = parseSerializedJson(key);
        const locations = tripsData[key];

        hotel_ID = hotelID;
        hotel_name = hotelName;
        locationArray = locations;
    }

    for(let object of Object.values(locationArray)){
        for (let key of Object.keys(object)){
            if(key === "placeID"){
                waypointIDs.push(object[key]);
            }else if(key === "placeName"){
                waypointNames.push(object[key]);
            }
        }
    }

    console.log("Names: " + waypointNames);
    console.log("ID's: " + waypointIDs);

    calculateRoute(hotel_name,waypointNames)
    geocodePlaceId(hotel_ID, waypointIDs);
}

/**
 * Takes the hotel PlaceID and the locationsPlaceID Array from getTripData and works to convert them from placeID's to
 * addresses that will be used in calculateRoute()
 */
function geocodePlaceId(hotelID, waypointIDs) {

}

/**
 * Takes the locations and hotel addresses that were given by the geoCodingPlaceID() function
 * and organizes it into a start, waypoints which are placed into a Array in travel order and an end point
 * which are used for the displayRoute() function
 */

//Hard coded for test (Gonna make minor changes for final product)
async function calculateRoute(hotel, waypointsArray) {
    start = "5902 N President George Bush Hwy, Garland, TX 75044, USA";

    let rawWaypoints = ["525 Talbert Dr, Plano, TX 75093, USA",
        "2134 Zurek Ln, Heath, TX 75126, USA",
        "4234 Maple Ave #2403, Dallas, TX 75219, USA",
        "1904 Oates Dr, Mesquite, TX 75150"];

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

    displayRoute(start,waypoints,end);
}

/**
 * Takes the calculation done from the calculateRoutes function and display's the route onto the map
 * @param waypoints - the points that are in between the start(hotel) and the end of the route in an Array (Strings)
 * @param start - the origin of the trip which should be the hotel that the user is staying in.
 * @param end - the "destination" or the last point in the users route.
 */
function displayRoute(start, waypoints, end) {

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