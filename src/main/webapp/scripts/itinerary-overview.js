let map;
let latitude;
let longitude;

function initMap() {
    getUserLocation()

    map = new google.maps.Map(document.getElementById("map"), {
        center: { lat: 32, lng: -96.4820992},
        zoom: 10
    });

    marker = new google.maps.Marker({
        map:map,
        position: { lat: 32, lng: -96.4820992},
        animation: google.maps.Animation.DROP,

    });
}

function getUserLocation() {
    const options = {timeout: 60000};
    navigator.geolocation.getCurrentPosition(retrieveUserLatLng, errorHandler, options);
}

function retrieveUserLatLng(position) {

    latitude = Number(position.coords.latitude)
    longitude = Number(position.coords.longitude)
    const coords = [latitude, longitude];

    alert("Lat: " + coords[0] + " Lng: " + coords[1])

    return(coords)
}

function errorHandler(err) {
    if(err.code === 1) {
        alert("Error: Access is denied!");
    } else if( err.code === 2) {
        alert("Error: Position is unavailable!");
    }
}

function getLatitude() {
    return(Number(latitude));
}

function getLongitude() {
    return(Number(longitude));
}



