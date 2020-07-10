/**
 * Function run on page load that runs auth checking and other functions
 */
function init() {
  authReload();
  findNearbyPlaces();
  fetchAndRenderTripsFromDB();
}

let numLocations;
let locationPlaceObjects;
let mapInitialized;
let markers;
/**
 * Adds a trip editor interface to the DOM, which the user can use to add a trip.
 */
function openTripEditor() {
  numLocations = 1;
  locationPlaceObjects = [""];
  mapInitialized = false;
  markers = [""];
  document.getElementById("open-close-button-area").innerHTML = `
    <button
      onclick="cancelTripCreation()"
      class="btn-large add-trip-button waves-effect red darken-1"
    >
      CANCEL
    </button>
  `;
  document.getElementById("trip-editor-container").innerHTML = `
    <div class="row">
      <div class="col s12 m8">
        <div class="card">
          <div class="card-content">
          <div class="card-title">
            <div class="row">
              <div class="input-field col s12">
                <label for="trip-title">Trip Name</label>  
                <input id="trip-title" type="text" required />
              </div>
            </div>
          </div>
            <form id="trip-editor-form">
              <div id="trip-locations-container">
                <div class="row">
                  <div class="col s6">
                    <label for="location-1">Location 1</label>
                    <input id="location-1" type="text" required />
                  </div>
                  <div class="col s6">
                    <p class="range-field weight-slider">
                      <label for="location-1-weight">Weight</label>
                      <input
                        type="range"
                        name="location-1-weight"
                        id="location-1-weight"
                        min="1"
                        max="5"
                      />
                    </p>
                  </div>
                </div>
              </div>
              <div class="row">
                <div class="col m10">
                <button 
                  type="button"
                  class="btn-floating btn-large waves-effect waves-light blue tooltipped"
                  onclick="addLocation()"
                  data-position="bottom" 
                  data-tooltip="Add another location"
                >
                  <i class="material-icons">add</i>
                </button>
                </div>
                <div class="col m2">
                  <button
                    type="button"
                    onclick="findHotel()"
                    class="btn-large waves-effect indigo darken-2"
                  >
                    Next
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
      <div class="col s12 m4">
        <div class="card">
          <div class="card-content">
            <span class="card-title">Map</span>
            <div id="editor-map">
              <p class="placeholder-text">Enter some destinations!</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
  // initialize tooltip for Add Location button
  const tooltipElems = document.querySelectorAll(".tooltipped");
  const tooltipInstances = M.Tooltip.init(tooltipElems, undefined);

  // prevent page reload on form submit
  const form = document.getElementById("trip-editor-form");
  form.addEventListener("submit", (e) => e.preventDefault());

  // add autocomplete through Places API for first location
  const location1 = document.getElementById("location-1");
  const autocomplete = new google.maps.places.Autocomplete(location1);
  createPlaceHandler(autocomplete, 1);
}

/**
 * Adds another location field and corresponding weight field to the editor
 * card so the user can input another location.
 */
function addLocation() {
  numLocations++;
  document.getElementById("trip-locations-container").insertAdjacentHTML(
    "beforeend",
    `<div class="row">
      <div class="col s6">
        <label for="location-${numLocations}">Location ${numLocations}</label>
        <input id="location-${numLocations}" type="text" />
      </div>
      <div class="col s6">
        <p class="range-field weight-slider">
          <label for="location-${numLocations}-weight">Weight</label>
          <input
            type="range"
            name="location-${numLocations}-weight"
            id="location-${numLocations}-weight"
            min="1"
            max="5"
          />
        </p>
      </div>
    </div>`
  );
  // add autocomplete through Places API for new location
  const location = document.getElementById(`location-${numLocations}`);
  const autocomplete = new google.maps.places.Autocomplete(location);
  createPlaceHandler(autocomplete, numLocations);
  markers.push("");
  locationPlaceObjects.push("");
}

/**
 * Cancels the opening of the trip editor, reverting the page to the default
 * view.
 */
function cancelTripCreation() {
  document.getElementById("trip-editor-container").innerHTML = "";
  document.getElementById("open-close-button-area").innerHTML = `
    <button
      onclick="openTripEditor()"
      class="btn-large add-trip-button waves-effect green darken-1"
    >
      ADD TRIP
    </button>
  `;
}

/**
 * Opens modal with results for user to confirm and save trip.
 */
async function findHotel() {
  document.getElementById("hotel-results").innerHTML = LOADING_ANIMATION_HTML;
  if (numLocations !== getNumPlaceObjectsInArray(locationPlaceObjects)) {
    M.Toast.dismissAll();
    M.toast({
      html: "Not all of your places are selected through autocomplete.",
    });
    return;
  }
  const elem = document.getElementById("hotel-modal");
  const instance = M.Modal.getInstance(elem);
  instance.open();

  // Get center point from which to start searching for hotels
  const coords = placesToCoordsWeightArray(locationPlaceObjects);
  const [lat, lng] = centerOfMass(coords);
  const response = await fetch(
    `https://cors-anywhere.herokuapp.com/https://maps.googleapis.com/maps/api/place/textsearch/json?query=lodging&location=${lat},${lng}&radius=10000&key=${GOOGLE_API_KEY}&output=json`
  );
  const results = await response.json();
  parseAndRenderHotelResults(results);
}

/**
 * Parses response from Places API lodging query to render list of
 * cards to the hotel results modal.
 * @param {Object} json the resulting JS object from calling the
 *                      Places API for the centerpoint.
 */
function parseAndRenderHotelResults(json) {
  const modalContent = document.getElementById("hotel-results");
  if (!json.results) {
    modalContent.innerText = "No hotels nearby. Sorry.";
  } else {
    json.results = json.results.slice(0, 4);
    modalContent.innerHTML = json.results
      .map(
        ({ name, formatted_address, rating, place_id }) => `
          <div class="col s6">
            <div class="card white">
              <div class="card-content black-text">
                <span class="card-title"><strong>${name}</strong> | Rating: ${rating}</span>
                <p>${formatted_address}</p>
              </div>
              <div class="card-action">
                <button id="${place_id}" class="btn indigo" onClick="saveTrip(this.id)">CHOOSE</button>
              </div>
            </div>
          </div>
        `
      )
      .join("");
  }
}

/**
 * Saves the current trip the user is editing to My Trips, through a POST request
 * to the backend. Then rerenders the trips based on DB data.
 */
async function saveTrip(hotelID) {
  const elem = document.getElementById("hotel-modal");
  const instance = M.Modal.getInstance(elem);
  instance.close();

  // Build location and weight arrays
  const locationData = [];

  for (let i = 1; i <= numLocations; i++) {
    locationData.push({
      id: locationPlaceObjects[i - 1].place_id,
      weight: document.getElementById(`location-${i}-weight`).value,
    });
  }

  const requestBody = {
    title: document.getElementById("trip-title").value,
    hotel: hotelID,
    rating: -1,
    locations: locationData,
  };

  await fetch("/trip-data", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });
  cancelTripCreation();
  fetchAndRenderTripsFromDB();
}

/**
 * Fetches trip data from the DB and renders each trip to the page.
 */
async function fetchAndRenderTripsFromDB() {
  const plannedTripsHTMLElement = document.getElementById(
    "planned-trips-container"
  );
  plannedTripsHTMLElement.innerHTML = LOADING_ANIMATION_HTML;
  const response = await fetch("/trip-data", {
    method: "GET",
  });
  const tripsData = await response.json();
  const geocoder = new google.maps.Geocoder();
  const keys = Object.keys(tripsData);
  if (keys.length === 0) {
    plannedTripsHTMLElement.innerHTML = `
      <div class="row"><div class="col s12">
      <p class="placeholder-text">No trips to show. Let's go somewhere!</p>
      </div></div>
    `;
    return;
  }
  keys.sort(
    (a, b) =>
      parseSerializedJson(b).timestamp - parseSerializedJson(a).timestamp
  );
  plannedTripsHTMLElement.innerHTML = "";
  for (key of keys) {
    // Fields of tripsData are currently in string format.
    // Deserialize using parseSerializedJson.
    const { title, hotel, timestamp } = parseSerializedJson(key);
    const locations = tripsData[key];
    plannedTripsHTMLElement.innerHTML += `
      <div class="row">
        <div class="col m8">
          <div class="card">
            <div class="card-content">
              <span class="card-title">${title}</span>
              <p>Hotel Place ID: ${hotel}</p>
              <form>
                <div id="trip-${timestamp}-locations"></div>
              </form>
            </div>
          </div>
        </div>
      </div>
    `;
    document.getElementById(`trip-${timestamp}-locations`).innerHTML = locations
      .map(({ weight }, index) => {
        return `
          <div class="row">
            <div class="col s6">
              <span id="location-${timestamp}-${index}"></span>
            </div>
            <div class="col s6">
              <span>Weight: ${weight}</span>
            </div>
          </div>
        `;
      })
      .join("");

    locations.forEach(({ placeID }, index) => {
      geocoder.geocode({ placeId: placeID }, (results, status) => {
        if (status === "OK") {
          if (results[0]) {
            placeName = results[0].formatted_address;
            document.getElementById(
              `location-${timestamp}-${index}`
            ).innerText = placeName;
          }
        }
      });
    });
  }
}

/**
 * Adds a listener to the autocompleted field for location
 * locationNum.
 * @param {google.maps.places.Autocomplete} element current field
 * @param {number} locationNum the number identifying the field
 */
function createPlaceHandler(element, locationNum) {
  google.maps.event.addListener(element, "place_changed", () => {
    const obj = element.getPlace();
    console.log(obj);
    obj.locationNum = locationNum;
    locationPlaceObjects[locationNum - 1] = obj;
    const coords = { lat: obj.geometry.location.lat(), lng: obj.geometry.location.lng() };
    if(!mapInitialized) {
      map = new google.maps.Map(document.getElementById("editor-map"), {
        center: coords,
        zoom: 6,
      });
      mapInitialized = true;
    }
    const marker = new google.maps.Marker({
      position: coords,
      map: map,
      title: obj.name,
    });
    markers[locationNum - 1] = marker;
    if (locationNum !== 1) {
      fitMapToMarkers();
      map.setZoom(map.getZoom() - 1);
    }
  });
}

/**
 * Uses the markers array to rerender the map and fit all the current locations.
 */
function fitMapToMarkers() {
  const bounds = new google.maps.LatLngBounds();
  for (marker of markers) {
    if(marker !== "") {
      bounds.extend({ lat: marker.position.lat(), lng: marker.position.lng() });
    }
  }
  map.fitBounds(bounds);
}

/**
 * Computes a pair in the form [lat, lng] of the
 * center of "mass" given weights for an array
 * of coordinate pairs. Weights at a factor of 0.05 added to one.
 * @param {Array} arr array of {lat, lng, weight}
 * @returns {Array} centerpoint given weights and coords.
 */
function centerOfMass(arr) {
  let totalWeight = 0;
  let totalXWeightedSum = 0;
  let totalYWeightedSum = 0;
  arr.forEach(({ lat, lng, weight }) => {
    weight = 1 + 0.05 * weight;
    totalWeight += weight;
    totalXWeightedSum += weight * lng;
    totalYWeightedSum += weight * lat;
  });

  return [totalYWeightedSum / totalWeight, totalXWeightedSum / totalWeight];
}

/**
 * Reduces an array of Google Places objects to their
 * latitude/longitude pairs and a weight object array.
 * @param {Array} arr an array of Places
 * @returns {Array} array of {lat, lng weight} objects
 */
function placesToCoordsWeightArray(arr) {
  // Build array containing {lat, lng, weight} objects
  return arr.map(({ geometry, locationNum }) => ({
    lat: geometry.location.lat(),
    lng: geometry.location.lng(),
    weight: document.getElementById(`location-${locationNum}-weight`).value,
  }));
}

/**
 * Helper function to determine the # of
 * Google Place objects in a certain array.
 * @param {Array} arr an array of Places or empty strings
 * @returns {number} # of Place objects in said array
 */
function getNumPlaceObjectsInArray(arr) {
  return arr.reduce(
    (acc, curr) => acc + (curr.place_id == undefined ? 0 : 1),
    0
  );
}
