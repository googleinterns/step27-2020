/**
 * Function run on page load that runs auth checking and other functions
 */
function init() {
  document.getElementById('my-trips-link').classList.add('active');
  document.getElementById('my-trips-link-m').classList.add('active');
  authReload();
  fetchAndRenderTripsFromDB();
}

let numLocations;
let locationPlaceObjects;
let mapInitialized;
let markers;

/**
 * Adds a trip editor interface to the DOM, which the user can use to add a trip.
 * @param {string|null} timestamp timestamp string of the trip to be updated.
 *                                Null if this is a new trip.
 * @param {Array} locationData    Array containing location objects with
 *                                placeID, placeName, and weight fields.
 *                                Null if this is a new trip.
 * @param {string} title          The current title of the trip. Null
 *                                if this is a new trip.
 */
function openTripEditor(timestamp, locationData, title) {
  document.getElementById('open-close-button-area').innerHTML = `
    <button
      onclick="cancelTripCreation()"
      class="btn-large add-trip-button waves-effect red darken-1"
    >
      CANCEL
    </button>
  `;

  document.getElementById('trip-editor-container').innerHTML = `
    <div class="row">
      <div class="col s12 m8">
        <div class="card">
          <div class="card-content">
          <div class="card-title">
            <div class="row">
              <div class="col s12">
                <label for="trip-title">Trip Name</label>  
                <input id="trip-title" type="text" required />
              </div>
            </div>
          </div>
            <form id="trip-editor-form">
              <div id="trip-locations-container">
                <div class="row">
                  <div class="col s12 m6">
                    <label for="location-1">Location 1</label>
                    <input id="location-1" type="text" required />
                  </div>
                  <div class="col s9 m5">
                    <p class="range-field weight-slider">
                      <label 
                        for="location-1-weight"
                        class="tooltipped"
                        data-tooltip="Assign how close you want to be to this location"
                      >
                        Weight
                      </label>
                      <input
                        type="range"
                        name="location-1-weight"
                        id="location-1-weight"
                        min="1"
                        max="5"
                        step="1"
                      />
                    </p>
                  </div>
                   
                </div>
              </div>
              <div class="row">
                <div class="left">
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
                <div class="right">
                  <button
                    type="button"
                    onclick="findHotel()"
                    id="find-hotel-button"
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
  if (timestamp === null) {
    numLocations = 1;
    locationPlaceObjects = [''];
    mapInitialized = false;
    markers = [''];

    // add autocomplete through Places API for first location
    const location1 = document.getElementById('location-1');
    const autocomplete = new google.maps.places.Autocomplete(location1);
    createPlaceHandler(autocomplete, 1);
  } else {
    const findHotelButton = document.getElementById('find-hotel-button');
    findHotelButton.onclick = () => findHotel(timestamp);
    findHotelButton.innerText = 'Update';
    locationPlaceObjects = [];
    markers = [];
    numLocations = locationData.length;

    mapInitialized = false;
    // Populate frontend fields with existing data
    document.getElementById('trip-title').value = title;
    document.getElementById('location-1').value = locationData[0].placeName;
    document.getElementById('location-1-weight').value = locationData[0].weight;
    const location = document.getElementById('location-1');
    const autocomplete = new google.maps.places.Autocomplete(location);
    createPlaceHandler(autocomplete, 1);
    for (let i = 2; i <= numLocations; i++) {
      document.getElementById('trip-locations-container').insertAdjacentHTML(
        'beforeend',
        `<div class="row" id="location-${i}-container">
          <div class="col s12 m6">
            <label for="location-${i}" id="location-${i}-label">Location ${i}</label>
            <input 
              id="location-${i}" 
              type="text" 
              value="${locationData[i - 1].placeName}"
            />
          </div>
          <div class="col s9 m5">
            <p class="range-field weight-slider">
              <label 
                for="location-${i}-weight" 
                id="location-${i}-weight-label"
                class="tooltipped"
                data-tooltip="Assign how close you want to be to this location"
              >
                Weight
              </label>
              <input
                type="range"
                name="location-${i}-weight"
                id="location-${i}-weight"
                min="1"
                value="${locationData[i - 1].weight}"
                max="5"
                step="1"
              />
            </p>
          </div>
           <div class="col s3 m1">
            <a 
              id="location-${i}-delete"
              class="btn-floating indigo waves-effect tooltipped" 
              data-tooltip="Delete this location"
              onclick="deleteLocation(${i})"
            >
              <i class="material-icons">remove_circle</i>
            </a>
          </div>
        </div>
        `
      );
      // add autocomplete through Places API for new location
      const location = document.getElementById(`location-${i}`);
      const autocomplete = new google.maps.places.Autocomplete(location);
      createPlaceHandler(autocomplete, i);
    }
    // Use PlacesService to populate locationPlaceObjects and markers, adding them to the map
    const service = new google.maps.places.PlacesService(map);
    locationData.map(({ placeID, placeName }, index) => {
      service.getDetails({ placeId: placeID }, (place, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK) {
          const { geometry, name } = place;
          const { location, viewport } = geometry;
          if (!mapInitialized) {
            map = new google.maps.Map(document.getElementById('editor-map'), {
              center: location,
              zoom: 13,
            });
            mapInitialized = true;
          }
          const marker = new google.maps.Marker({
            map: map,
            position: location,
          });
          place.locationNum = index + 1;
          locationPlaceObjects.push(place);
          markers.push(marker);
          const infoWindow = new google.maps.InfoWindow({
            content: `<h5 class="infowindow-text">${name}</h5>
                <p class="infowindow-text">Location ${index + 1}</p>`,
          });
          google.maps.event.addListener(marker, 'click', () => {
            infoWindow.open(map, marker);
          });
          fitMapToMarkers(map, markers);
        } else {
          M.Toast.dismissAll();
          M.toast({
            html:
              'There was an error while loading one of your locations. Please try again.',
          });
        }
      });
    });
  }

  // initialize tooltip for Add Location button
  const tooltipElems = document.querySelectorAll('.tooltipped');
  const tooltipInstances = M.Tooltip.init(tooltipElems, undefined);

  // prevent page reload on form submit
  const form = document.getElementById('trip-editor-form');
  form.addEventListener('submit', (e) => e.preventDefault());
}

/**
 * Adds another location field and corresponding weight field to the editor
 * card so the user can input another location.
 */
function addLocation() {
  numLocations++;
  document.getElementById('trip-locations-container').insertAdjacentHTML(
    'beforeend',
    `<div class="row" id="location-${numLocations}-container">
      <div class="col s12 m6">
        <label for="location-${numLocations}" id="location-${numLocations}-label">Location ${numLocations}</label>
        <input id="location-${numLocations}" type="text" />
      </div>
      <div class="col s9 m5">
        <p class="range-field weight-slider">
          <label 
            for="location-${numLocations}-weight" 
            id="location-${numLocations}-weight-label"
            class="tooltipped"
            data-tooltip="Assign how close you want to be to this location"
          >
            Weight
          </label>
          <input
            type="range"
            name="location-${numLocations}-weight"
            id="location-${numLocations}-weight"
            min="1"
            max="5"
          />
        </p>
      </div>
      <div class="col s3 m1">
        <a 
          id="location-${numLocations}-delete"
          class="btn-floating indigo waves-effect tooltipped"
          data-tooltip="Delete this location" 
          onclick="deleteLocation(${numLocations})"
        >
          <i class="material-icons">remove_circle</i>
        </a>
      </div>
    </div>`
  );
  // add autocomplete through Places API for new location
  const location = document.getElementById(`location-${numLocations}`);
  const autocomplete = new google.maps.places.Autocomplete(location);

  // initialize tooltips for new locations
  const tooltipElems = document.querySelectorAll('.tooltipped');
  const tooltipInstances = M.Tooltip.init(tooltipElems, undefined);
  createPlaceHandler(autocomplete, numLocations);
  markers.push('');
  locationPlaceObjects.push('');
}

/**
 * Deletes a location in a certain trip open in the Trip Editor.
 * @param {number} locationNum number of location to be deleted
 * @throws Will throw an error if the locationNum is invalid.
 */
function deleteLocation(locationNum) {
  if (locationNum > markers.length || locationNum < 1) {
    throw new Error('Cannot delete invalid location');
  }
  const index = locationNum - 1;
  // Close current tooltip
  const currDeleteButton = document.getElementById(
    `location-${locationNum}-delete`
  );
  const instance = M.Tooltip.getInstance(currDeleteButton);
  instance.close();

  // Remove trip from DOM and shift following trip location nums down 1
  const elem = document.getElementById(`location-${locationNum}-container`);
  elem.parentElement.removeChild(elem);
  for (let i = locationNum + 1; i <= numLocations; i++) {
    const locationContainer = document.getElementById(
      `location-${i}-container`
    );
    const locationLabel = document.getElementById(`location-${i}-label`);
    const location = document.getElementById(`location-${i}`);
    const weightLabel = document.getElementById(`location-${i}-weight-label`);
    const weight = document.getElementById(`location-${i}-weight`);
    const deleteButton = document.getElementById(`location-${i}-delete`);
    const locationShift = `location-${i - 1}`;

    const autocomplete = new google.maps.places.Autocomplete(location);
    google.maps.event.clearInstanceListeners(autocomplete);
    createPlaceHandler(autocomplete, i - 1);
    locationContainer.id = `${locationShift}-container`;
    locationLabel.id = `${locationShift}-label`;
    location.id = `${locationShift}`;
    weight.id = `${locationShift}-weight`;

    weightLabel.id = `${locationShift}-weight-label`;
    weight.id = `${locationShift}-weight`;
    deleteButton.id = `${locationShift}-delete`;
    locationLabel.innerText = `Location ${i - 1}`;
    locationLabel.htmlFor = `${locationShift}`;
    deleteButton.onclick = () => deleteLocation(i - 1);
  }

  // Remove marker from map and also the array
  if (markers[index] !== '') {
    markers[index].setMap(null);
  }
  numLocations--;
  markers.splice(index, 1);
  fitMapToMarkers(map, markers);
  locationPlaceObjects.splice(index, 1);
}

/**
 * Cancels the opening of the trip editor, reverting the page to the default
 * view.
 */
function cancelTripCreation() {
  document.getElementById('trip-editor-container').innerHTML = '';
  document.getElementById('open-close-button-area').innerHTML = `
    <button
      onclick="openTripEditor(null, null, null)"
      class="btn-large add-trip-button waves-effect green darken-1"
    >
      ADD TRIP
    </button>
  `;
}

/**
 * Opens modal with results for user to confirm and save trip.
 * @param {string|null} timestamp timestamp string of the trip to be updated.
 *                                Null if this is a new trip.
 */
async function findHotel(timestamp) {
  if (numLocations !== getNumPlaceObjectsInArray(locationPlaceObjects)) {
    M.Toast.dismissAll();
    M.toast({
      html: 'Not all of your places are selected through autocomplete.',
    });
    return;
  }

  getPlaceWeights(locationPlaceObjects);
  convertLatLngFunctionsToValues(locationPlaceObjects, markers);
  fetchHotelResults(timestamp);
}

/**
 * Resets page to default following saving trip
 * @param {Object} response HTTP response after saving trip
 * @param {string|null} timestamp timestamp string of trip to be updates. Null if new trip
 * @param {string} tripTitle title of trip
 */
function resetPage(response, timestamp, tripTitle) {
  if (response.ok) {
    if (timestamp) {
      M.toast({
        html: `Successfully updated ${tripTitle}.`,
      });
    }
    cancelTripCreation();
    fetchAndRenderTripsFromDB();
  } else {
    M.toast({
      html: 'There was an error when saving your trip. Please try again.',
    });
  }
}

/**
 * Deletes a trip and its corresponding locations from the DB using
 * its timestamp as the identifier.
 * @param {string} timestamp The timestamp string for the trip to delete.
 */
async function deleteTrip(timestamp) {
  const response = await fetch(`/trip-data?timestamp=${timestamp}`, {
    method: 'DELETE',
    headers: {
      'content-type': 'application/json',
    },
  });
  if (response.ok) {
    M.toast({
      html: 'Trip successfully deleted.',
    });
    fetchAndRenderTripsFromDB();
  } else {
    M.toast({
      html:
        'There was a problem when attempting to delete your trip. Please try again.',
    });
  }
}

/**
 * Opens the delete confirmation modal and sets the onclick function
 * that gets called when the user confirms the deletion.
 * @param {string} timestamp The timestamp string for the trip to delete.
 */
function openDeleteModal(timestamp) {
  const deleteConfirmElem = document.getElementById('modal-delete-btn');
  deleteConfirmElem.onclick = () => deleteTrip(timestamp);
  const elem = document.getElementById('delete-modal');
  const instance = M.Modal.getInstance(elem);
  instance.open();
}

/**
 * Fetches trip data from the DB and renders each trip to the page.
 * Calls to this function are idempotent to the DOM.
 */
async function fetchAndRenderTripsFromDB() {
  const EMPTY_PLANNED_TRIPS_HTML = `
    <div class="row"><div class="col s12">
    <p class="placeholder-text">No planned trips to show. Let's go somewhere!</p>
    </div></div>
  `;
  const EMPTY_PAST_TRIPS_HTML = `
    <div class="row"><div class="col s12">
    <p class="placeholder-text">No past trips to show.</p>
    </div></div>
  `;

  const plannedTripsHTMLElement = document.getElementById(
    'planned-trips-container'
  );
  const pastTripsHTMLElement = document.getElementById('past-trips-container');
  plannedTripsHTMLElement.innerHTML = LOADING_ANIMATION_HTML;
  pastTripsHTMLElement.innerHTML = LOADING_ANIMATION_HTML;
  const response = await fetch('/trip-data', {
    method: 'GET',
  });
  const tripsData = await response.json();
  const keys = Object.keys(tripsData);
  if (keys.length === 0) {
    plannedTripsHTMLElement.innerHTML = EMPTY_PLANNED_TRIPS_HTML;
    pastTripsHTMLElement.innerHTML = EMPTY_PAST_TRIPS_HTML;
    return;
  }
  keys.sort(
    (a, b) =>
      parseSerializedJson(b).timestamp - parseSerializedJson(a).timestamp
  );
  plannedTripsHTMLElement.innerHTML = '';
  pastTripsHTMLElement.innerHTML = '';
  let isPlannedTripsEmpty = true;
  let isPastTripsEmpty = true;
  for (key of keys) {
    // Fields of tripsData are currently in string format.
    // Deserialize using parseSerializedJson.
    const {
      title,
      hotelName,
      hotelImage,
      isPastTrip,
      timestamp,
      isPublic,
    } = parseSerializedJson(key);
    const locations = tripsData[key];
    let HTMLElementToUpdate;
    if (isPastTrip === 'true') {
      isPastTripsEmpty = false;
      HTMLElementToUpdate = pastTripsHTMLElement;
    } else {
      isPlannedTripsEmpty = false;
      HTMLElementToUpdate = plannedTripsHTMLElement;
    }
    HTMLElementToUpdate.innerHTML +=
      `
      <div class="row">
        <div class="col s12 m8">
          <div class="card">
            <div class="card-content">
              <div class="row trip-title-section"> 
                <div class="left">
                  <span class="card-title" id="trip-${timestamp}-title">${title}</span>
                </div>
                <div class="right">
                  <button 
                    type="button"
                    onclick="openDeleteModal('${timestamp}')"
                    class="btn-floating btn-large indigo update-button waves-effect waves-light tooltipped"
                    data-tooltip="Delete trip"
                  >
                    <i class="large material-icons">delete</i>
                  </button>
                  <button 
                    type="button"
                    id="edit-button-${timestamp}"
                    class="btn-floating btn-large indigo update-button waves-effect waves-light tooltipped"
                    data-tooltip="Edit trip info"
                  >
                    <i class="large material-icons">mode_edit</i>
                  </button>
                </div>
              </div>
              <div id="trip-${timestamp}-locations"></div>
              <div id="trip-${timestamp}-map" class="trip-map"></div>
            </div>
          <div class="card-action center">` +
            (isPastTrip === 'false'
              ? `<a class="btn indigo waves-effect action-btn" onclick="setTripToPastOrPlanned('${timestamp}', 'true')">Mark Trip Completed</a>`
              : `<a class="btn indigo waves-effect action-btn" onclick="setTripToPastOrPlanned('${timestamp}', 'false')">Mark Trip Planned</a>`
              + (isPublic === 'true'
                    ? `<a class="btn indigo disabled action-btn" onclick="openTripsNetworkModal('${timestamp}')">Trip Posted</a>`
                    : `<a class="btn indigo waves-effect action-btn" onclick="openTripsNetworkModal('${timestamp}')">Post on Trips Network</a>`
                )
            ) + `   
          </div>
        </div>
        </div>
        <div class="col s12 m4" id="trip-${timestamp}-hotel-card">
          <div class="card large">
            <div class="card-image">
              <img src="${await imageURLFromPhotoRef(hotelImage)}">
            </div>
            <div class="card-content">
              <span class="card-title">${hotelName}</span>
              <div id="trip-${timestamp}-hotel-info"></div>
            </div>
          </div>
        </div>
      </div>
    `;
    // initialize tooltips for edit and delete trip buttons
    const tooltipElems = document.querySelectorAll('.tooltipped');
    const tooltipInstances = M.Tooltip.init(tooltipElems, undefined);
    document.getElementById(`trip-${timestamp}-locations`).innerHTML = locations
      .map(({ weight, placeName }, index) => {
        return `
          <div class="row">
            <div class="col s6">
              <span id="trip-${timestamp}-location-${index + 1}">
                <strong>${placeName}</strong>
              </span>
            </div>
            <div class="col s6">
              <span id="trip-${timestamp}-weight-${index + 1}">
                Weight: ${weight}
              </span>
            </div>
          </div>
        `;
      })
      .join('');
  }

  // Iterate through keys again to load the map for each trip and load edit button functionality
  for (key of keys) {
    const tripMarkers = [];
    const { timestamp, hotelID, title } = parseSerializedJson(key);
    // Get coords of all locations in this trip and the hotel to add to the Google map
    const tripMap = new google.maps.Map(
      document.getElementById(`trip-${timestamp}-map`),
      {
        zoom: 13,
      }
    );
    const service = new google.maps.places.PlacesService(tripMap);

    // Get hotel location and add it as a marker first
    service.getDetails({ placeId: hotelID }, (place, status) => {
      if (status === google.maps.places.PlacesServiceStatus.OK) {
        const { geometry, name, formatted_address, website } = place;
        const { location, viewport } = geometry;
        const marker = new google.maps.Marker({
          map: tripMap,
          position: location,
          label: {
            fontFamily: 'Material Icons',
            text: 'hotel',
          },
        });
        tripMarkers.push(marker);
        tripMap.setCenter(location);
        const infoWindow = new google.maps.InfoWindow({
          content: `<h5 class="infowindow-text">${name}</h5>
              <p class="infowindow-text">Hotel for Trip</p>`,
        });
        google.maps.event.addListener(marker, 'click', () => {
          infoWindow.open(tripMap, marker);
        });
        tripMap.fitBounds(viewport);
        document.getElementById(`trip-${timestamp}-hotel-info`).innerHTML =
          `
          <p>${formatted_address}</p>` +
          (website != undefined
            ? `<div class="card-action center"><a class="btn indigo waves-effect" href="${website}" target="_blank">Website</a></div>`
            : '');
      }
    });

    // Get location coords for each location in the trip and add to map
    const locations = tripsData[key];
    locations.forEach(({ placeID, placeName }) => {
      service.getDetails({ placeId: placeID }, (place, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK) {
          const { geometry, name } = place;
          const { location, viewport } = geometry;
          const placeMarker = new google.maps.Marker({
            map: tripMap,
            position: location,
          });
          tripMarkers.push(placeMarker);
          const infoWindow = new google.maps.InfoWindow({
            content: `<h5 class="infowindow-text">${placeName}</h5>`,
          });
          google.maps.event.addListener(placeMarker, 'click', () => {
            infoWindow.open(tripMap, placeMarker);
          });
          tripMap.fitBounds(viewport);
          fitMapToMarkers(tripMap, tripMarkers);
        }
      });
    });

    // Give edit buttons for each trip functionality
    document.getElementById(`edit-button-${timestamp}`).onclick = () => {
      openTripEditor(`${timestamp}`, locations, `${title}`);
      window.scrollTo(0, 0);
    };
  }

  if (isPastTripsEmpty) {
    pastTripsHTMLElement.innerHTML = EMPTY_PAST_TRIPS_HTML;
  }
  if (isPlannedTripsEmpty) {
    plannedTripsHTMLElement.innerHTML = EMPTY_PLANNED_TRIPS_HTML;
  }
}

/**
 * Adds a listener to the autocompleted field for location
 * locationNum.
 * @param {google.maps.places.Autocomplete} element current field
 * @param {number} locationNum the number identifying the field
 */
function createPlaceHandler(element, locationNum) {
  google.maps.event.addListener(element, 'place_changed', () => {
    const obj = element.getPlace();
    obj.locationNum = locationNum;

    const { geometry, name } = obj;
    const { location } = geometry;
    const { lat, lng } = location;
    const coords = {
      lat: lat(),
      lng: lng(),
    };
    if (!mapInitialized) {
      map = new google.maps.Map(document.getElementById('editor-map'), {
        center: coords,
        zoom: 13,
        disableDefaultUI: true,
      });
      mapInitialized = true;
    }
    if (markers[locationNum - 1] !== '') {
      const currMarkerForLocation = markers[locationNum - 1];
      if (currMarkerForLocation === undefined || locationNum > markers.length) {
        google.maps.event.clearInstanceListeners(element, 'place_changed');
        return;
      }
      currMarkerForLocation.setMap(null);
    }

    const marker = new google.maps.Marker({
      position: coords,
      map: map,
      title: name,
    });
    const infoWindow = new google.maps.InfoWindow({
      content: `<h5 class="infowindow-text">${obj.name}</h5>
          <p class="infowindow-text">Location ${locationNum}</p>`,
    });
    marker.addListener('click', () => infoWindow.open(map, marker));
    locationPlaceObjects[locationNum - 1] = obj;
    markers[locationNum - 1] = marker;

    if (markers.length !== 1) {
      fitMapToMarkers(map, markers);
      map.setZoom(map.getZoom() - 0.3);
    }
  });
}

/**
 * Uses the markers array to rerender the map and fit all the current locations.
 * @param {google.maps.Map} mapRef the map object to update
 * @param {Array} markers array of Marker objects
 */
function fitMapToMarkers(mapRef, markers) {
  const bounds = new google.maps.LatLngBounds(null);
  for (marker of markers) {
    if (marker !== '') {
      bounds.extend(marker.getPosition());
    }
  }
  mapRef.fitBounds(bounds);
  mapRef.panToBounds(bounds);
  mapRef.setCenter(bounds.getCenter());
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

/**
 * Sets a trip, identified by its timestamp, to a past trip.
 * @param {string} timestamp
 * @param {string} isPastTrip - 'true' if setting trip to past trip, 'false' otherwise
 */
async function setTripToPastOrPlanned(timestamp, isPastTrip) {
  const response = await fetch(
    `/trips-network?timestamp=${timestamp}&is_past_trip=${isPastTrip}`,
    {
      method: 'PUT',
      headers: {
        'content-type': 'application/json',
      },
    }
  );

  if (response.ok) {
    M.toast({
      html:
        'Successfully marked trip as ' +
        (isPastTrip === 'true' ? 'completed.' : 'planned'),
    });
    fetchAndRenderTripsFromDB();
  } else {
    M.toast({
      html:
        'There was an error while setting your trip to a past trip. Please try again.',
    });
  }
}

/**
 * Opens a modal for posting the trip, identified by its timestamp, to the Trips Network.
 * @param {string} timestamp
 */
function openTripsNetworkModal(timestamp) {
  const elem = document.getElementById('trips-network-modal');
  const instance = M.Modal.getInstance(elem);
  instance.open();
  const submitButton = document.getElementById('post-trip-button');
  submitButton.onclick = () => postTripToTripsNetwork(timestamp);

  // prevent page reload on form submit
  const form = document.getElementById('trips-network-form');
  form.addEventListener('submit', (e) => e.preventDefault());
}

/**
 * Gets description and rating values from DOM and posts corresponding trip to trips network
 * @param {string} timestamp
 */
async function postTripToTripsNetwork(timestamp) {
  const desc = document.getElementById('trip-description').value;
  const rating = document.getElementById('trip-rating').value;
  const response = await fetch('/trips-network', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      description: desc,
      rating: rating,
      timestamp: timestamp,
    }),
  });

  if (response.ok) {
    M.toast({
      html: 'Successfully posted trip to the Trips Network',
    });
    const elem = document.getElementById('trips-network-modal');
    const instance = M.Modal.getInstance(elem);
    instance.close();
  } else {
    M.toast({
      html:
        'There was an error while posting your trip to the Trips Network. Please try again.',
    });
  }
}

/**
 * Updates weights of place objects in array
 * @param {Array} arr an array of places
 */
function getPlaceWeights(arr) {
  for (let obj of arr) {
    obj.weight = document.getElementById(
      `location-${obj.locationNum}-weight`
    ).value;
  }
}

/**
 * Converts lat and lng properties in place and marker objects from their getter functions
 * to the values these functions return instead
 * @param {Array} locationPlaceObjects array of place objects
 * @param {Array} markers array of marker objects
 */
function convertLatLngFunctionsToValues(locationPlaceObjects, markers) {
  for (let location of locationPlaceObjects) {
    const { lat, lng } = location.geometry.location;
    if (typeof lat === 'function') {
      location.geometry.location.lat = lat();
    }
    if (typeof lng === 'function') {
      location.geometry.location.lng = lng();
    }
  }

  for (let marker of markers) {
    const { lat, lng } = marker.position;
    if (typeof lat === 'function') {
      marker.position.lat = lat();
    }
    if (typeof lng === 'function') {
      marker.position.lng = lng();
    }
  }
}
