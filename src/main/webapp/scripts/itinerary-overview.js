var map;
function initMap() {
    map = new google.maps.Map(document.getElementById("map"), {
        center: { lat: 32.819595, lng: -96.945419},
        zoom: 10
    });
}