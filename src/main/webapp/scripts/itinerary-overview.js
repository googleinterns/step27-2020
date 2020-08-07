document.addEventListener('DOMContentLoaded', function() {
    const tooltipElems = document.querySelectorAll('.tooltipped');
    M.Tooltip.init(tooltipElems, undefined);
});

let hotel_ID = "";
let hotelAddress = "";

let waypointIDs = [];
let waypointAddresses = [];

let destinationID = "";
let destinationAddress = "";

let placeDetailsArray = [];

let waypointsLength = 0;
let addressLength = 0;

let currentMode = "DRIVING";
let lastMode = "";
let invalidCount = 0;
let INVALID_TOLERANCE = 2;

const DRIVING = "DRIVING";
const WALKING = "WALKING";
const BICYCLING = "BICYCLING";
const TRANSIT = "TRANSIT";

const PLACE_CARDS_CONTAINER = document.getElementById('place-cards-container');
const DEFAULT_PLACE_IMAGE = '../assets/img/Building.jpg';

/**
 * Shows all the information for the itinerary page
 */
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
        } = parseSerializedJson(key);
        const locations = tripsData[key];

        hotel_ID = hotelID;
        waypointArray = locations;
    }

    for(let object of Object.values(waypointArray)){
        for (let key of Object.keys(object)){
            if(key === "placeID"){
                waypointIDs.push(object[key]);
            }
        }
    }

    for(let waypoint in waypointIDs){
        waypointsLength++;
    }

    await getTravelTimes(hotel_ID,waypointIDs);
}

//<------ Map Section ------>
/**
 * This function takes the waypointID's from getTripData and runs them through a directions API fetch to see which one
 * of the waypoints is this furthest away from the hotel. This waypoint is then set is the destination(end) of the route
 * Then the function calls the geocoding and place details functions.
 */
async function getTravelTimes(){
    let longestDuration = 0;
    let longestDurationWaypointID = "";

    for(let waypointID of waypointIDs){

        const directionsResponse = await fetch(
            `https://cors-anywhere.herokuapp.com/https://maps.googleapis.com/maps/api/directions/json?origin=place_id:${hotel_ID}&destination=place_id:${waypointID}&key=${GOOGLE_API_KEY}`
        )

        const { routes } = await directionsResponse.json();

        for (const key in routes) {
            if (routes.hasOwnProperty(key)) {
                let tripDuration = (routes[key]["legs"][0]["duration"]["value"]); //In Seconds
                if(tripDuration > longestDuration){
                    longestDuration = tripDuration;
                    longestDurationWaypointID = waypointID;
                }
            }
        }
    }

    const index = waypointIDs.indexOf(longestDurationWaypointID)
    if (index > -1){
        destinationID += waypointIDs.splice(index, 1);
        waypointsLength--;
    }

    //Map Calls
    geocodeHotelID(hotel_ID);
    geocodeWaypointIDs(waypointIDs);
    geocodeDestinationID(destinationID);

    //Place Card Calls
    await getHotelDetails(hotel_ID);
    await getWaypointDetails(waypointIDs);
    await getDestinationDetails(destinationID);
}

/**
 * Takes the Hotel PlaceID Array from getTripData and works to convert it from placeID's to
 * addresses that will be used in calculateRoute()
 * @param hotelID - The hotel placeID that was obtained from getTripData()
 */
function geocodeHotelID(hotelID){
    const geocoder = new google.maps.Geocoder();

    geocoder.geocode({ placeId: hotelID }, (results, status) => {
        if (status === "OK") {
            if (results[0]) {
                storeHotelAddress(results[0].formatted_address);
            } else {
                M.toast({html:"No results found"});
            }
        } else {
            M.toast({html:"Geocoder failed due to: " + status});
        }
    });
}

/**
 * Takes the waypoints PlaceID Array from getTripData and works to convert them from placeID's to
 * addresses that will be used in calculateRoute()
 * @param waypointIDs - The waypoint placeID's that are obtained from getTripData()
 */
function geocodeWaypointIDs(waypointIDs) {

    const geocoder = new google.maps.Geocoder();

    for(let placeId of waypointIDs){
        geocoder.geocode({ placeId: placeId }, (results, status) => {
            if (status === "OK") {
                if (results[0]) {
                    storeWaypointsAddress(results[0].formatted_address);
                } else {
                    M.toast({html:"No results found"});
                }
            } else {
                M.toast({html:"Geocoder failed due to: " + status});
            }
        });
    }
}

/**
 * Takes the Destination PlaceID Array from getTripData and works to convert it from placeID's to
 * addresses that will be used in calculateRoute()
 * @param destinationID - The end location for the users trip obtained from getTravelTimes()
 */
function geocodeDestinationID(destinationID){
    const geocoder = new google.maps.Geocoder();

    geocoder.geocode({ placeId: destinationID }, (results, status) => {
        if (status === "OK") {
            if (results[0]) {
                storeDestinationAddress(results[0].formatted_address);
            } else {
                M.toast({html:"No results found"});
            }
        } else {
            M.toast({html:"Geocoder failed due to: " + status});
        }
    });
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
 * Used to store the destination address given from geocodePlaceID() in the global string to avoid from unordered execution
 * within the geocode function. Calls isReadyRoutes() to test if the string is set up to be used in calculateRoute().
 * @param address - The hotel address from geocodePlaceID()
 */
function storeDestinationAddress(address){
    destinationAddress = address;
    isReadyRoutes();
}

/**
 * This functions purpose is the make sure the both the waypoints Array and hotel Address have the expected amount of
 * values in them to be used in route calculation to prevent from unexpected actions.
 */
function isReadyRoutes(){
    if(waypointsLength === addressLength && hotelAddress !== "" && destinationAddress !== ""){
        displayRoute(hotelAddress, waypointAddresses, destinationAddress);
    }
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
                invalidCount++
                if(invalidCount < INVALID_TOLERANCE){
                    M.toast({html:"Request failed because this mode of travel is not available on this trip " +
                            "your mode was changed back to: " + lastMode});
                    changeTravelMode(lastMode)
                }else {
                    M.toast({html:"Request failed because this mode of travel is not available on this trip " +
                            "your mode was changed back to: DRIVING"});
                    changeTravelMode(DRIVING)
                }
            }
        }
    );
}

/**
 * Method that changes the travel mode that the user will be using on their trip.
 * @param travelMode{String} one of the accepted modes of travel by displayRoute() (DRIVING,WALKING,BICYCLING,TRANSIT)
 */
function changeTravelMode(travelMode){
    lastMode = currentMode;
    currentMode = travelMode;
    displayRoute(hotelAddress, waypointAddresses, destinationAddress);
}

//<------ Place Card Section ------>
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
 * Fetches more details about the hotel such as phone number and website and puts it all into an object
 * @param {String} hotelID place ID of place to get details about
 */
async function getHotelDetails(hotelID){
    const detailsResponse = await fetch(
        `https://cors-anywhere.herokuapp.com/https://maps.googleapis.com/maps/api/place/details/json?place_id=${hotelID}&key=${GOOGLE_API_KEY}`
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

/**
 * Fetches more details about the waypoints such as phone number and website and puts it all into an object
 * @param {Array} placeIDArray place ID of place to get details about
 */
async function getWaypointDetails(placeIDArray) {
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

/**
 * Fetches more details about the destination such as phone number and website and puts it all into an object
 * @param {String} destinationID place ID of place to get details about
 */
async function getDestinationDetails(destinationID){
    const detailsResponse = await fetch(
        `https://cors-anywhere.herokuapp.com/https://maps.googleapis.com/maps/api/place/details/json?place_id=${destinationID}&key=${GOOGLE_API_KEY}`
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

/**
 * Stores the locations place card info into an array.
 */
function storePlaceCardDetails(placeDetails){
    placeDetailsArray.push(placeDetails);
    isReadyPlaces();
}

/**
 * Checks if the place cards are ready to be displayed
 */
function isReadyPlaces(){
    if(placeDetailsArray.length === (waypointIDs.length + 2)){ //+2 For Hotel and Destination
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
                ? `<h5 class="place-large-text">${name}</h5>`
                : '') +
            (photoUrl
                ?`<img src="${photoUrl}" class="place-photo" alt="${name}">`
                : '')+
            (address
                ? `<h6 class="place-medium-text" >${address}</h6>`
                : '') +
            (phoneNumber
                ? `<h6 class="place-medium-text">${phoneNumber}</h6>`
                : '') +
            (website
                ? `<h6 class="place-medium-text"><a href="${website}">Website</a></h6>`
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

/**
 * Centers and makers the users location on a map.
 */
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

/**
 * The error handler for markUserLocation() if the users geolocation is not available.
 * @param browserHasGeolocation
 * @param infoWindow
 * @param pos
 */
function handleLocationError(browserHasGeolocation, infoWindow, pos) {
    infoWindow.setPosition(pos);
    infoWindow.setContent(browserHasGeolocation ?
        'Error: The Geolocation service failed.' :
        'Error: Your browser doesn\'t support geolocation.');
    infoWindow.open(map);
}