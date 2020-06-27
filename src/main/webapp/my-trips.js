/**
 * Adds a trip editor interface to the DOM, which the user can use to add a trip.
 */
function openTripEditor() {
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
              <div class="row">
                <div class="input-field col s6">
                  <input id="location-2" type="text" />
                  <label for="location-2">Location 2</label>
                </div>
                <div class="col s6">
                  <p class="range-field weight-slider">
                    <label for="location-2-weight">Weight</label>
                    <input
                      type="range"
                      name="location-2-weight"
                      id="location-2-weight"
                      min="1"
                      max="5"
                    />
                  </p>
                </div>
              </div>
              <div class="row">
                <div class="col s12">
                  <button
                    onclick="saveTrip(); cancelTripCreation()"
                    class="btn-large waves-effect indigo darken-2"
                  >
                    Save
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
 * Saves the current trip the user is editing to My Trips
 */
function saveTrip() {
  document.getElementById("planned-trips-container").innerHTML += `
     <div class="row">
      <div class="col m8">
        <div class="card">
          <div class="card-content">
            <span class="card-title">Trip</span>
            <form>
              <div class="row">
                <div class="col s6">
                  <span>${document.getElementById("location-1").value}</span>
                </div>
                <div class="col s6">
                  <span>${
                    document.getElementById("location-1-weight").value
                  }</span>
                </div>
              </div>
              <div class="row">
                <div class="col s6">
                  <span>${document.getElementById("location-2").value}</span>
                </div>
                <div class="col s6">
                  <span>${
                    document.getElementById("location-2-weight").value
                  }</span>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  `;
}
