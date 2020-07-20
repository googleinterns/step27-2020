const CITY_INPUT_FORM = `
  <div id="city-input-area" class="row">
    <h5 id="city-input-title" class="col s12 m7">
      What city do you want to visit?
    </h5>
    <div id="city-input-field" class="input-field col s12 m5">
      <input placeholder="Enter a city" id="city-input" type="text">
    </div>
  </div>
`

function init() {
  authReload();
  addFilterListener();
}

function addFilterListener() {
  const filterElem = document.getElementById('filter');
  filterElem.addEventListener('change', () => {
    const filter = filterElem.value;
    addCityAutocomplete(filter);
  });
}

function addCityAutocomplete(filter) {
  const inputElem = document.getElementById('input-container');
  const cityInputElem = inputElem.querySelector('#city-input-area');
  if(cityInputElem !== null) {
    cityInputElem.innerHTML = '';
    cityInputElem.remove();
  }
  inputElem.insertAdjacentHTML('beforeend', CITY_INPUT_FORM);

  const cityInputField = document.getElementById('city-input')
  const autocomplete = new google.maps.places.Autocomplete(cityInputField);
  google.maps.event.addListener(autocomplete, 'place_changed', () => {
    city = autocomplete.getPlace();
    findNearbyPlaces(city, filter);
  });
}

function findNearbyPlaces(city, filter) {
  console.log(city);
  console.log(filter);
} 





