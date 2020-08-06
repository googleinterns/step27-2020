let city;
let filter;
let placeDetailsMap = new Map();

//util functions rely on these specific variable names
//kinda crappy...too bad! 
let locationPlaceObjects = [];
let markers = [];
let numLocations = 0;

const DEFAULT_WEIGHT = 3;
const PLACE_CARDS_CONTAINER = document.getElementById('place-cards-container');
const DEFAULT_PLACE_IMAGE = '../assets/img/jason-dent-blue.jpg'

function init() {
  document.getElementById('plan-for-me-link').classList.add('active');
  document.getElementById('plan-for-me-link-m').classList.add('active');
  authReload();
  addCityAutocomplete();
  addFilterHandler();
}

function addCityAutocomplete() {
  const cityInputField = document.getElementById('city-input')
  const options = {
    types: ['(cities)'],
  }
  const autocomplete = new google.maps.places.Autocomplete(cityInputField, options);
  google.maps.event.addListener(autocomplete, 'place_changed', () => {
    city = autocomplete.getPlace();
    if(filter) {
      findPlacesInCity(city, filter);
    }
  });
}

function addFilterHandler() {
  const filterForm = document.getElementById('filters');
  filterForm.addEventListener('change', () => {
    filter = filterForm.value;
    if(city) {
      findPlacesInCity(city, filter);
    }
  });
}

/**
 * Fetches locations according to filter within 10000m radius of selected city
 * @param {Object} city PlaceResult object with city information returned from autocomplete that user selected
 * @param {String} filter types of locations to look for e.g. amusement park
 */
async function findPlacesInCity(city, filter) {
  if (!city.hasOwnProperty('place_id')) {
    M.Toast.dismissAll();
    M.toast({
      html: "Your city wasn't selected with autocomplete",
    });
    return;
  }
  
  PLACE_CARDS_CONTAINER.innerHTML = LOADING_ANIMATION_HTML;
  const { geometry } = city;
  const { location } = geometry;
  const { lat, lng } = location;
  const placesResponse = await fetch(
    `https://cors-anywhere.herokuapp.com/https://maps.googleapis.com/maps/api/place/textsearch/json?type=${filter}&location=${lat()},${lng()}&radius=10000&key=${GOOGLE_API_KEY}&output=json`
  )
  const { results } = await placesResponse.json();
  getPlaceCardInformation(results);
}

/**
 * Gets details and photos for every place returned from Places API
 * @param {Array} places array of PlaceResult objects returned from Places API
 */
async function getPlaceCardInformation(places) {
  placeDetailsMap.clear();
  places = places.slice(0, 5);
  for(let i = 0; i < places.length; i++) {
    const { place_id } = places[i];
    const placeDetails = await getPlaceDetails(place_id);
    placeDetails.place_id = place_id;
    placeDetailsMap.set(place_id, placeDetails);
  }

  renderPlaceCards(placeDetailsMap);
}

/**
 * Renders information cards to DOM for each place suggestion
 * @param {Array} places array of objects containing information and photo URLs about each place
 */
function renderPlaceCards(placeDetailsMap) {
  let placeCards = [];
  for(let [placeId, placeDetails] of placeDetailsMap.entries()) {   
    const { phoneNumber, name, photoUrl, priceLevel, rating, address, website } = placeDetails;

    placeCards.push(
      `
        <div class="col s12 m6">
          <div class="card large">
            <div class="card-image">
              <img class="responsive-img" src="${photoUrl}" alt="${name}" loading="lazy">
              <span class="card-title"><strong>${name}</strong></span>
            </div>
            <div class="card-fab">
              <a 
                class="btn-floating halfway-fab waves-effect waves-light blue" 
                onclick="addPlaceToTrip('${placeId}');"
                data-position="bottom"
                data-tooltip="Add to current trip"
              >
                <i class="material-icons">add</i>
              </a>
            </div>
            <div class="card-content"> 
            ` +
              (address
                ? `<p>${address}</p>`
                : '') +
              (phoneNumber
                ? `<p>${phoneNumber}</p>`
                : '') +
              (rating
                ? `<p>Rating: ${rating}</p>`
                : '') +
              (priceLevel
                ? `<p>Price Level: ${priceLevel}</p>`
                : '') +
            `
            </div>
            ` +
              (website
                ? `<div class="card-action">
                    <a href="${website}">Website</a>
                  </div>`
                : '') +
            `
          </div>
        </div>
      `
    )
  }
  PLACE_CARDS_CONTAINER.innerHTML = placeCards.join('');
}

function addPlaceToTrip(placeId) {
  const placeDetails = placeDetailsMap.get(placeId);
  locationPlaceObjects.push(placeDetails);

  const { geometry, name } = placeDetails;
  const { location } = geometry;
  const marker = {
    title: name,
    position: location,
  }
  markers.push(marker);

  numLocations++;
}

function openCurrentTrip() {
  const currTripStatus = document.getElementById('current-trip-status');
  const currTripPlacesCollection = document.getElementById('current-trip-places');
  const currTripModalElem = document.getElementById('current-trip-modal');
  const currTripModalInstance = M.Modal.getInstance(currTripModalElem);

  if(locationPlaceObjects.length <= 0 || !locationPlaceObjects) {
    currTripStatus.innerHTML = "<p>It's lonely in here, add some places!</p>";
    currTripModalInstance.open();
    return;
  }

  currTripStatus.innerHTML = '';
  currTripStatus.innerHTML = LOADING_ANIMATION_HTML;
  currTripModalInstance.open();

  currTripPlacesCollection.innerHTML = '';
  let currTripPlaceCards = []
  for(let location of locationPlaceObjects) {
    const { name } = location;
    currTripPlaceCards.push(
      `
        <li class="collection-item">
          <div>${name}
            <a onclick="deletePlaceFromTrip();" class="secondary-content">
              <i class="material-icons">delete</i>
            </a>
          </div>
        </li>
      `
    )
    currTripStatus.innerHTML = '';
    currTripPlacesCollection.innerHTML = currTripPlaceCards.join('');
  }
}

function resetPage(response) {

}
/*
function findHotel() {
  if(locationData.length <= 0 || !locationData) {
    M.Toast.dismissAll();
    M.toast({
      html: 'Select some places first!',
    });
    return;
  }
}
*/
/**
 * Fetches more details about place such as phone number and website and puts it all into an object
 * @param {String} placeId place ID of place to get details about 
 */
async function getPlaceDetails(placeId) {
  const detailsResponse = await fetch(
    `https://cors-anywhere.herokuapp.com/https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${GOOGLE_API_KEY}`
  )
  const { result } = await detailsResponse.json();
  const { geometry, international_phone_number, name, photos, price_level, rating, vicinity, website } = result;
  const { photoUrl } = await imageInfoFromPhotosArray(photos);
  
  const placeDetails = {
    geometry: geometry,
    phoneNumber: international_phone_number,
    name: name,
    photoUrl: photoUrl,
    priceLevel: price_level,
    rating: rating,
    address: vicinity,
    website: website,
    weight: DEFAULT_WEIGHT,
  }

  return placeDetails;
}

