document.addEventListener('DOMContentLoaded', function() {
    const tooltipElems = document.querySelectorAll('.tooltipped');
    M.Tooltip.init(tooltipElems, undefined);
});

let start;
let waypoints;
let end;

let hotel_name = "";
let hotel_ID = "";
let hotelAddress = "";


let waypointNames = [];
let waypointIDs = [];
let waypointAddresses = [];

let placeDetailsArray = [];

let waypointsLength = 0;
let addressLength = 0;

let currentMode = "DRIVING";

const DRIVING = "DRIVING";
const WALKING = "WALKING";
const BICYCLING = "BICYCLING";
const TRANSIT = "TRANSIT";

const PLACE_CARDS_CONTAINER = document.getElementById('place-cards-container');
const DEFAULT_PLACE_IMAGE = '../assets/img/Building.jpg';

function init() {
    document.getElementById('itinerary-link').classList.add('active');

    document.getElementById('itinerary-link-m').classList.add('active');
}

async function displayInfo() {
    await getTripData();
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

    //Locations
    let waypointArray;

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
        waypointArray = locations;
    }

    for(let object of Object.values(waypointArray)){
        for (let key of Object.keys(object)){
            if(key === "placeID"){
                waypointIDs.push(object[key]);
            }else if(key === "placeName"){
                waypointNames.push(object[key]);
            }
        }
    }

    for(let waypoint in waypointIDs){
        waypointsLength++;
    }

    await getPlaceDetails(waypointIDs)
    geocodePlaceId(hotel_ID, waypointIDs);
}

/**
 * Takes the hotel PlaceID and the waypoints PlaceID Array from getTripData and works to convert them from placeID's to
 * addresses that will be used in calculateRoute()
 * @param hotelID - The hotel placeID that was obtained from getTripData()
 * @param waypointIDs - The waypoint placeID's that are obtained from getTripData()
 */
function geocodePlaceId(hotelID, waypointIDs) {

    const geocoder = new google.maps.Geocoder();

    for(let placeId of waypointIDs){
        geocoder.geocode({ placeId: placeId }, (results, status) => {
            if (status === "OK") {
                if (results[0]) {
                    storeWaypointsAddress(results[0].formatted_address)
                } else {
                    M.toast({html:"No results found"});
                }
            } else {
                M.toast({html:"Geocoder failed due to: " + status});
            }
        });
    }

    geocoder.geocode({ placeId: hotelID }, (results, status) => {
        if (status === "OK") {
            if (results[0]) {
                storeHotelAddress(results[0].formatted_address)
            } else {
                M.toast({html:"No results found"});
            }
        } else {
            M.toast({html:"Geocoder failed due to: " + status});
        }
    });
}

/**
 * Used to store the waypoint addresses given from geocodePlaceID()  in an Array to avoid from unordered execution
 * within the geocode function. Calls isReadyRoutes() to test if the Array is set up to be used in calculateRoute() .
 * @param waypointAddress - The address of the waypoint being converted in geocodePlaceID()
 */
function storeWaypointsAddress(waypointAddress){
    waypointAddresses.push(waypointAddress);
    addressLength++;
    isReadyRoutes();
}

/**
 * Used to store the hotel address given from geocodePlaceID() in the global string to avoid from unordered execution
 * within the geocode function. Calls isReadyRoutes() to test if the string is set up to be used in calculateRoute().
 * @param address - The hotel address from geocodePlaceID()
 */
function storeHotelAddress(address) {
    hotelAddress = address;
    isReadyRoutes();
}

/**
 * This functions purpose is the make sure the both the waypoints Array and hotel Address have the expected amount of
 * values in them to be used in route calculation to prevent from unexpected actions.
 */
function isReadyRoutes(){
    if(waypointsLength === addressLength && hotelAddress !== ""){
        calculateRoute(hotelAddress, waypointAddresses);
    }
}

/**
 * Takes the locations and hotel addresses that were given by the geoCodingPlaceID() function
 * and organizes it into a start, waypoints which are placed into a Array in travel order and an end point
 * which are used for the displayRoute() function
 * @param hotel - The address of the hotel received from geocodePlaceID()
 * @param waypointsArray - The addresses of the waypoints/locations of the users trip received from geocodePlaceID()
 */
function calculateRoute(hotel, waypointsArray) {
    start = hotel;
    waypoints = [];
    end = "";

    let length = waypointsArray.length;

    while(waypointsArray.length > 1){
        for(let i = 0; i < waypointsArray.length; i++){
            if(waypoints.length !== (length - 1)){
                waypoints.push(waypointsArray[0]);
                waypointsArray.splice(0, 1);
            }
        }
    }

    end += waypointsArray.pop(0);


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

    directionsService.route(
        {
            origin: start,
            destination: end,
            waypoints: waypointArray,
            optimizeWaypoints: true,
            travelMode: google.maps.TravelMode[currentMode]
        },
        function(response, status) {
            if (status === "OK") {
                directionsRenderer.setDirections(response);
            } else {
                M.toast({html:"Directions request failed due to " + status});
            }
        }
    );
}

/**
 * Method that changes the travel mode that the user will be using on their trip.
 * @param travelMode{String} one of the accepted modes of travel by displayRoute() (DRIVING,WALKING,BICYCLING,TRANSIT)
 */
function changeTravelMode(travelMode){
    currentMode = travelMode;
    displayRoute(start, waypoints, end);
}

/**
 * Gets URL for photo of place or assigns it a default one if there are no photos available
 * @param {Array} photos array of photos from PlaceResult object
 */
async function imageURLFromPhotos(photos) {
    const photoRef =
        photos && Array.isArray(photos)
            ? photos[0].photo_reference
            : undefined;

    if(photoRef) {
        const photoResponse = await fetch(
            `https://cors-anywhere.herokuapp.com/https://maps.googleapis.com/maps/api/place/photo?maxheight=300&photoreference=${photoRef}&key=${GOOGLE_API_KEY}`
        );
        const blob = await photoResponse.blob();
        return URL.createObjectURL(blob);
    } else {
        return DEFAULT_PLACE_IMAGE;
    }
}

/**
 * Fetches more details about place such as phone number and website and puts it all into an object
 * @param {Array} placeIDArray place ID of place to get details about
 */
async function getPlaceDetails(placeIDArray) {

    const detailsResponse = await fetch(
        `https://cors-anywhere.herokuapp.com/https://maps.googleapis.com/maps/api/place/details/json?place_id=${hotel_ID}&key=${GOOGLE_API_KEY}`
    )
    const { result } = await detailsResponse.json();
    const { international_phone_number, name, photos, vicinity, website } = result;
    const photoUrl = await imageURLFromPhotos(photos);


    const placeDetails = {
        phoneNumber: international_phone_number,
        name: name,
        photoUrl: photoUrl,
        address: vicinity,
        website: website
    }
    storePlaceCardDetails(placeDetails);

    for(let placeID of placeIDArray){
        const detailsResponse = await fetch(
            `https://cors-anywhere.herokuapp.com/https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeID}&key=${GOOGLE_API_KEY}`
        )
        const { result } = await detailsResponse.json();
        const { international_phone_number, name, photos, vicinity, website } = result;
        const photoUrl = await imageURLFromPhotos(photos);

        const placeDetails = {
            phoneNumber: international_phone_number,
            name: name,
            photoUrl: photoUrl,
            address: vicinity,
            website: website
        }
        storePlaceCardDetails(placeDetails);
    }
}

function storePlaceCardDetails(placeDetails){
    placeDetailsArray.push(placeDetails);
    isReadyPlaces();
}

function isReadyPlaces(){
    if(placeDetailsArray.length === (waypointIDs.length + 1)){
        renderPlaceCards(placeDetailsArray);
    }
}

/**
 * Renders information cards to DOM for each place suggestion
 * @param {Array} places array of objects containing information and photo URLs about each place
 */
function renderPlaceCards(places) {
    let placeCards = [];
    for(let i = 0; i < places.length; i++) {
        const { phoneNumber, name, photoUrl, address, website } = places[i];

        placeCards.push(
            `
        <div class="col s12">
            <div class="card horizontal">
        <div class="card-stacked">
            <div class="card-content">
            ` +
            (name
                ? `<h5 style="font-size: large;">${name}</h5>`
                : '') +
            (photoUrl
                ?`<img src="${photoUrl}" style="width: 50px;height: 50px; float: right; border-radius: 8px;" alt="${name}">`
                : '')+
            (address
                ? `<h6 style="font-size: medium;">${address}</h6>`
                : '') +
            (phoneNumber
                ? `<h6 style="font-size: medium;">${phoneNumber}</h6>`
                : '') +
            (website
                ? `<h6 style="font-size: medium;"><a href="${website}">Website</a></h6>`
                : '') +
            `            
            </div>
        </div>
        </div>
    </div>
      `
        )
    }
    PLACE_CARDS_CONTAINER.innerHTML = placeCards.join('');
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
    new google.maps.Marker({
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