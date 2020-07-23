let city;
let filter;

function init() {
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
  
  const { geometry } = city;
  const { location } = geometry;
  const { lat, lng } = location;
  const placesResponse = await fetch(
    `https://cors-anywhere.herokuapp.com/https://maps.googleapis.com/maps/api/place/textsearch/json?type=${filter}&location=${lat()},${lng()}&radius=10000&key=${GOOGLE_API_KEY}&output=json`
  )
  const { results } = await placesResponse.json();
  getPlaceCardInformation(results);
}

async function getPlaceCardInformation(places) {
  let placeDetailsArr;
  for(let i = 0; i < places.length; i++) {
    const { place_id } = places[i];
    const placeDetails = getPlaceDetails(place_id);
  }
}

function renderPlaceCards(places) {
}

async function getPlaceDetails(placeId) {
  const detailsResponse = await fetch(
    `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${GOOGLE_API_KEY}`
  )
  const { result } = await detailsResponse.json();
  const { international_phone_number, name, photos, price_level, rating, vicinity, website } = result;
  const photoUrl = imageURLFromPhotos(photos);
  
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
      `https://cors-anywhere.herokuapp.com/https://maps.googleapis.com/maps/api/place/photo?maxwidth=500&photoreference=${photoRef}&key=${GOOGLE_API_KEY}`
    );
    const blob = await photoResponse.blob();
    const photoUrl = await URL.createObjectURL(blob);
    return photoUrl;
  } else {
    return '';
  }
}



