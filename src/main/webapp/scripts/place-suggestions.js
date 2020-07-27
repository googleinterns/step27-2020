let city;
let filter;
const placeCardsContainer = document.getElementById('place-cards-container');
const defaultPlaceImage = '../assets/img/jason-dent-blue.jpg'

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

async function findPlacesInCity(city, filter) {
  if (!city.hasOwnProperty('place_id')) {
    M.Toast.dismissAll();
    M.toast({
      html: "Your city wasn't selected with autocomplete",
    });
    return;
  }
  
  placeCardsContainer.innerHTML = LOADING_ANIMATION_HTML;
  const { geometry } = city;
  const { location } = geometry;
  const { lat, lng } = location;
  const placesResponse = await fetch(
    `https://cors-anywhere.herokuapp.com/https://maps.googleapis.com/maps/api/place/textsearch/json?type=${filter}&location=${lat()},${lng()}&radius=10000&key=${GOOGLE_API_KEY}&output=json`
  )
  const { results } = await placesResponse.json();
  console.log(results); //DELETE
  getPlaceCardInformation(results);
}

async function getPlaceCardInformation(places) {
  let placeDetailsArr = [];
  for(let i = 0; i < places.length; i++) {
    const { place_id } = places[i];
    const placeDetails = await getPlaceDetails(place_id);
    console.log(placeDetails); //DELETE
    placeDetailsArr.push(placeDetails);
  }

  renderPlaceCards(placeDetailsArr);
}

function renderPlaceCards(places) {
  let placeCards = [];
  for(obj in places) {
    const { phoneNumber, name, photoUrl, priceLevel, rating, address, website } = obj;
    const addressClass = address ? '' : undefined;
    const phoneNumberClass = phoneNumber ? '' : 'undefined';
    const ratingClass = rating ? '' : 'undefined';
    const priceLevelClass = priceLevel ? '' : 'undefined';
    const websiteClass = website ? '' : 'undefined';

    placeCards.push(
      `
        <div class="col s12 m6">
          <div class="card medium">
            <div class="card-image">
              <img class="responsive-img" src="${photoUrl}" alt="${name}" loading="lazy">
              <span class="card-title"><strong>${name}</strong></span>
            </div>
            <div class="card-fab">
              <a class="btn-floating halfway-fab waves-effect waves-light blue">
                <i class="material-icons">add</i>
              </a>
            </div>
            <div class="card-content">
              <p class=${addressClass}>${address}</p>
              <p class=${phoneNumberClass}>${phoneNumber}</p>
              <p class=${ratingClass}>Rating: ${rating}</p>
              <p class=${priceLevelClass}>Price Level: ${priceLevel}</p>
            </div>
            <div class="${websiteClass} card-action">
              <a href="${website}">Website</a>
            </div>
          </div>
        </div>
      `
    )
  }
  placeCardsContainer.innerHTML = placeCards.join('');

  const undefElements = document.querySelectorAll('.undefined');
  for(let i = 0; i < undefElements.length; i++) {
    undefElements[i].remove();
  }
}

async function getPlaceDetails(placeId) {
  const detailsResponse = await fetch(
    `https://cors-anywhere.herokuapp.com/https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${GOOGLE_API_KEY}`
  )
  const { result } = await detailsResponse.json();
  const { international_phone_number, name, photos, price_level, rating, vicinity, website } = result;
  const photoUrl = await imageURLFromPhotos(photos);
  
  const placeDetails = {
    phoneNumber: international_phone_number,
    name: name,
    photoUrl: photoUrl,
    priceLevel: price_level,
    rating: rating,
    address: vicinity,
    website: website
  }

  return placeDetails;
}


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
    const photoUrl = await URL.createObjectURL(blob);
    return photoUrl;
  } else {
    return defaultPlaceImage;
  }
}