/**
 * Function run on page load that runs auth checking and other functions
 */
function init() {
  authReload();
  findNearbyPlaces();
  fetchAndRenderTripsFromDB();
}

let numLocations = 1;

/**
 * Adds a trip editor interface to the DOM, which the user can use to add a trip.
 */
function openTripEditor() {
  numLocations = 1;
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
            <span class="card-title">New Trip</span>
            <form id="trip-editor-form">
              <div id="trip-locations-container">
                <div class="row">
                  <div class="input-field col s6">
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
                  <input
                    type="submit"
                    onclick="saveTrip(); cancelTripCreation()"
                    class="btn-large waves-effect indigo darken-2"
                  />
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
      <div class="input-field col s6">
        <input id="location-${numLocations}" type="text" />
        <label for="location-${numLocations}">Location ${numLocations}</label>
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
 * to the backend.
 */
function saveTrip() {
  // Build location and weight arrays
  const locationData = [];
  for (let i = 1; i <= numLocations; i++) {
    locationData.push({
      name: document.getElementById(`location-${i}`).value,
      weight: document.getElementById(`location-${i}-weight`).value,
    });
  }
  const requestBody = {
    title: "test",
    hotel: "hotel1234",
    rating: -1,
    description: "",
    locations: locationData,
  };

  fetch("/trip-data", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });
}

/**
 * Fetches trip data from the DB and renders each trip to the page.
 */
async function fetchAndRenderTripsFromDB() {
  const response = await fetch("/trip-data", {
    method: "GET",
  });
  const tripsData = await response.json();
  console.log(tripsData);
  document.getElementById("planned-trips-container").innerHTML += `
     <div class="row">
      <div class="col m8">
        <div class="card">
          <div class="card-content">
            <span class="card-title">Trip</span>
            <form>
              <div id="trip-${numTrips}-locations"></div>
            </form>
          </div>
        </div>
      </div>
    </div>
  `;
  for (let i = 1; i <= numLocations; i++) {
    document.getElementById(`trip-${numTrips}-locations`).innerHTML += `
      <div class="row">
        <div class="col s6">
          <span>${document.getElementById("location-" + i).value}</span>
        </div>
        <div class="col s6">
          <span>${
            document.getElementById("location-" + i + "-weight").value
          }</span>
        </div>
      </div>
    `;
  }
}
