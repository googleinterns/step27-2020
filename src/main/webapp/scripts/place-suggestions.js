let city;
let filter;

function init() {
  authReload();
  addCityAutocomplete();
  addFilterHandler();
}

function addCityAutocomplete() {
  const cityInputField = document.getElementById('city-input')
  const autocomplete = new google.maps.places.Autocomplete(cityInputField);
  google.maps.event.addListener(autocomplete, 'place_changed', () => {
    city = autocomplete.getPlace();
    if(typeof filter !== 'undefined') {
      findPlacesInCity(city, filter);
    }
  });
}

function addFilterHandler() {
  const filterForm = document.getElementById('filters');
  filterForm.addEventListener('change', () => {
    filter = filterForm.value;
    if(typeof city !== 'undefined') {
      findPlacesInCity(city, filter);
    }
  });
}

function findPlacesInCity(city, filter) {
  if (city.hasOwnProperty('place_id') === false) {
    M.Toast.dismissAll();
    M.toast({
      html: "Your city wasn't selected with autocomplete",
    });
    return;
  }
  
  console.log(city);
  console.log(filter);
} 




