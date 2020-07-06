/**
 * Function run on page load that runs auth checking and other functions
 */
function init() {
  authReload();
  findNearbyPlaces();
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
            <form>
              <div id="trip-locations-container">
                <div class="row">
                  <div class="input-field col s6">
                    <input id="location-1" type="text" />
                    <label for="location-1">Location 1</label>
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
                <div class="col s10">
                  <button
                    type="button"
                    onclick="saveTrip(); cancelTripCreation()"
                    class="btn-large waves-effect indigo darken-2"
                  >
                    Save
                  </button>
                </div>
                <div class="col s2">
                  <button 
                    type="button"
                    class="btn-floating btn-large waves-effect waves-light blue"
                    onclick="addLocation()"
                  >
                    <i class="material-icons">add</i>
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

let numTrips = 0;

/**
 * Saves the current trip the user is editing to My Trips
 */
function saveTrip() {
  numTrips++;
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
