/**
 * Adds a trip editor interface to the DOM, which the user can use to add a trip.
 */
function openTripEditor() {
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
                <div class="col s12">
                  <button
                    onclick="saveTrip()"
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
