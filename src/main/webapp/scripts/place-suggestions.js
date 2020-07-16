let map;
let service;

/**
 * Inits filter selection element
 */
document.addEventListener('DOMContentLoaded', function() {
    var elems = document.querySelectorAll('select');
    var instances = M.FormSelect.init(elems, undefined);
});

function init() {
  authReload();
  findNearbyPlaces();
}

/**
 * Inits map and calls a nearby search of prominent restaurants in 5000m 
 * radius of city inputted by user
 */
function findNearbyPlaces() {
  const cityInputField = document.getElementById('city-input');
  const autocomplete = new google.maps.places.Autocomplete(cityInputField);
  let userCity;

  google.maps.event.addListener(autocomplete, 'place_changed', () => {
    userCity = autocomplete.getPlace();
    console.log(userCity);
    const coords = {
      lat: userCity.geometry.location.lat(),
      lng: userCity.geometry.location.lng()
    };

    map = new google.maps.Map(document.getElementById('map'), {
      center: coords,
      zoom: 15
    });

    let request = {
      location: coords,
      radius: '5000',
      type: ['restaurant']
    };

    service = new google.maps.places.PlacesService(map);
    service.nearbySearch(request, renderPlaceCards);
  });
}

/**
 * Renders card containing place info to DOM
 * @param {Object} results array of PlaceResults objects
 * @param {Object} status status of Places API call
 */
function renderPlaceCards(results, status) {
  if (status === google.maps.places.PlacesServiceStatus.OK) {
    const placeCardsContainer = document.getElementById('place-cards-container');
    placeCardsContainer.innerHTML = '';

    for(let i = 0; i < results.length; i++) {
      console.log(results[i]);
    }

    placeCardsContainer.innerHTML = results.map(
      ({name, photos,rating}) => `
        <div class="col s12 m6">
          <div class="card">
            <div class="card-image">
              <img src="${photos[0].getUrl()}">
              <span class="card-title">${name}</span>
              <a class="btn-floating halfway-fab waves-effect waves-light blue"><i class="material-icons">add</i></a>
            </div>
            <div class="card-content">
              <p>Rating: ${rating}</p>
            </div>
          </div>
        </div>
      `
    ).join("");
  }
}