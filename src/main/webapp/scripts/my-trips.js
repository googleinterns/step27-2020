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
/**
 * Adds a trip editor interface to the DOM, which the user can use to add a trip.
 */
function openTripEditor() {
  numLocations = 1;
  locationPlaceObjects = [""];
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
      <div class="col m8">
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
                    onclick="saveTrip(); cancelTripCreation()"
                    class="btn-large waves-effect indigo darken-2"
                  >
                    Save Trip
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
      <div class="col m4">
        <div class="card">
          <div class="card-content">
            <span class="card-title">Filters</span>
            <form>
              <div class="row">
                <div class="col s2">
                  <button class="btn-small">$</button>
                </div>
                <div class="col s2">
                  <button class="btn-small">$$</button>
                </div>
                <div class="col s2">
                  <button class="btn-small">$$$</button>
                </div>
              </div>
            </form>
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
 * Saves the current trip the user is editing to My Trips, through a POST request
 * to the backend. Then rerenders the trips based on DB data.
 */
async function saveTrip() {
  // Build location and weight arrays
  const locationData = [];
  for (let i = 1; i <= numLocations; i++) {
    locationData.push({
      name: document.getElementById(`location-${i}`).value,
      weight: document.getElementById(`location-${i}-weight`).value,
    });
  }
  // Get center point from which to start searching for hotels
  const coords = placesToCoordsWeightArray(locationPlaceObjects);
  console.log(coords);
  console.log(centerOfMass(coords));

  const requestBody = {
    title: document.getElementById("trip-title").value,
    hotel: "hotel1234",
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
  
  const keys = Object.keys(tripsData);
  if (keys.length === 0) {
    plannedTripsHTMLElement.innerHTML = `
      <div class="row"><div class="col s12">
      <p class="placeholder-text">No trips to show. Let's go somewhere!</p>
      </div></div>
    `
    return;
  }
  keys.sort(
    (a, b) => parseSerializedJson(b).timestamp - parseSerializedJson(a).timestamp
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
    document.getElementById(
      `trip-${timestamp}-locations`
    ).innerHTML = locations.map(
      ({ placeID, weight }, index) => `
        <div class="row">
          <div class="col s6">
            <span>Place ${index + 1} ID: ${placeID}</span>
          </div>
          <div class="col s6">
            <span>Weight: ${weight}</span>
          </div>
        </div>
      `
    ).join("");
  }
}

/**
 * Adds a listener to the autocompleted field for location
 * locationNum.
 * @param {google.maps.places.Autocomplete} element - current field
 * @param {number} locationNum - the number identifying the field
 */
function createPlaceHandler(element, locationNum) {
  google.maps.event.addListener(element, "place_changed", () => {
    const obj = element.getPlace();
    obj.locationNum = locationNum;
    locationPlaceObjects[locationNum - 1] = obj;
  });
}

/**
 * Computes a pair in the form [lat, lng] of the
 * center of "mass" given weights for an array
 * of coordinate pairs.
 * @param {Array} arr array of {lat, lng, weight}
 * @returns {Array} centerpoint given weights and coords.
 */
function centerOfMass(arr) {
  let totalWeight = 0;
  let totalXWeightedSum = 0;
  let totalYWeightedSum = 0;
  arr.forEach(({lat, lng, weight}) => {
    weight = (1 + 0.05 * weight);
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
