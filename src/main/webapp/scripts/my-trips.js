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
    `https://cors-anywhere.herokuapp.com/https://maps.googleapis.com/maps/api/place/textsearch/json?type=lodging&location=${lat},${lng}&radius=10000&key=${GOOGLE_API_KEY}&output=json`
  );
  const { results } = await response.json();
  parseAndRenderHotelResults(results, { lat: lat, lng: lng });
}

/**
 * Parses response from Places API lodging query to render list of
 * cards to the hotel results modal.
 * @param {Object} json the resulting JS object from calling the
 *                      Places API for the centerpoint.
 */
async function parseAndRenderHotelResults(json, centerPoint) {
  const modalContent = document.getElementById("hotel-results");
  const hotelsMapElem = document.getElementById("hotels-map");
  if (!json || json.length === 0) {
    modalContent.innerText =
      "We couldn't find any hotels nearby. Sorry about that.";
    hotelsMapElem.innerHTML = "";
  } else {
    json = json.slice(0, 10);
    const hotelMap = new google.maps.Map(
      document.getElementById("hotels-map"),
      {
        center: centerPoint,
        zoom: 12,
      }
    );
    // Add existing locations to the map
    markers.forEach((obj) => {
      const { position } = obj;
      const { lat, lng } = position;
      const marker = new google.maps.Marker({
        position: { lat: lat(), lng: lng() },
        map: hotelMap,
        title: obj.title,
      });
    });
    // Add distance_center and photo_url fields to each object in
    // json.results
    json = json.map(async (obj) => {
      const { geometry } = obj;
      const { location } = geometry;
      const marker = new google.maps.Marker({
        position: location,
        map: hotelMap,
        title: obj.name,
        label: {
          fontFamily: "Material Icons",
          text: "hotel",
        },
      });
      const infoWindow = new google.maps.InfoWindow({
        content: `<h5 class="infowindow-text">${obj.name}</h5>`,
      });
      marker.addListener("click", () => infoWindow.open(hotelMap, marker));
      obj.distance_center = distanceBetween(location, centerPoint);
      const photoRef =
        obj.photos && Array.isArray(obj.photos)
          ? obj.photos[0].photo_reference
          : undefined;
      if (photoRef) {
        const photoResponse = await fetch(
          `https://cors-anywhere.herokuapp.com/https://maps.googleapis.com/maps/api/place/photo?maxwidth=500&photoreference=${photoRef}&key=${GOOGLE_API_KEY}`
        );
        const blob = await photoResponse.blob();
        const photoUrl = await URL.createObjectURL(blob);
        obj.photo_url = photoUrl;
      } else {
        obj.photo_url = undefined;
      }
      return await obj;
    });
    json = await Promise.all(json);
    json.sort((a, b) => a.distance_center - b.distance_center);

    hotelsMapElem.style.width = "100%";
    hotelsMapElem.style.height = "400px";
    hotelsMapElem.style.marginBottom = "2em";
    modalContent.innerHTML = json
      .map(
        ({ name, formatted_address, rating, place_id, photo_url }) =>
          `
          <div class="row">
            <div class="col s12 m6">
              <div class="card large white">` +
          (photo_url
            ? `
                <div class="card-image">
                  <img src="${photo_url}" alt="photo of ${name} from Google" loading="lazy" />
                </div> `
            : "") +
          `
                <div class="card-content black-text">
                  <span class="card-title"><strong>${name}</strong></span>
                  <p>${formatted_address}</p>
                </div>
                <div class="card-action center">
                  <button 
                    class="btn indigo" 
                    onClick="saveTrip('${place_id}', '${photo_url}', '${name}')"
                  >
                    CHOOSE
                  </button>
                </div>
              </div>
            </div>
            <div class="col s12 m6">
              <div class="card large white">
                <div class="card-content black-text">
                  <span class="card-title"><i class="material-icons">info</i>Info</span>
                  <p>Rating: ${rating}</p>
                  <p class="placeholder-text">More coming soon!</p>
                </div>            
              </div>
            </div>
          </div>
        `
      )
      .join("");
  }
}

/**
 * Implementation of the Haversine formula, recommended by NASA to calculate
 * distances between two coordinate pairs based on Latitude and Longitude
 * (source: https://andrew.hedges.name/experiments/haversine/)
 * @param {Object} p1 a coordinate pair with fields lat and lng
 * @param {Object} p2 a coordinate pair with fields lat and lng
 * @returns {number} the distance between the two in km
 */
function distanceBetween(p1, p2) {
  // Earth mean radius - 6371 km by Google
  const lngDelta = degToRad(p2.lng - p1.lng);
  const latDelta = degToRad(p2.lat - p1.lat);
  const a =
    Math.sin(latDelta / 2) ** 2 +
    Math.cos(degToRad(p1.lat)) *
      Math.cos(degToRad(p2.lat)) *
      Math.sin(lngDelta / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return 6371 * c;
}

/**
 * Converts a certain angle in degrees to radians.
 * @param {number} angle
 * @returns {number} the angle param in radians.
 */
function degToRad(angle) {
  return (angle * Math.PI) / 180;
}

/**
 * Saves the current trip the user is editing to My Trips, through a POST request
 * to the backend. Then rerenders the trips based on DB data.
 */
async function saveTrip(hotelID, hotelImg, hotelName) {
  const elem = document.getElementById("hotel-modal");
  const instance = M.Modal.getInstance(elem);
  instance.close();

  // Build location and weight arrays
  const locationData = [];

  for (let i = 1; i <= numLocations; i++) {
    locationData.push({
      id: locationPlaceObjects[i - 1].place_id,
      name: locationPlaceObjects[i - 1].name,
      weight: document.getElementById(`location-${i}-weight`).value,
    });
  }

  const requestBody = {
    title: document.getElementById("trip-title").value,
    hotel_id: hotelID,
    hotel_img: hotelImg,
    hotel_name: hotelName,
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
    "planned-trips-container"
  );
  const pastTripsHTMLElement = document.getElementById("past-trips-container");
  plannedTripsHTMLElement.innerHTML = LOADING_ANIMATION_HTML;
  pastTripsHTMLElement.innerHTML = LOADING_ANIMATION_HTML;
  const response = await fetch("/trip-data", {
    method: "GET",
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
  plannedTripsHTMLElement.innerHTML = "";
  pastTripsHTMLElement.innerHTML = "";
  console.log(tripsData);
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
      hotelID,
      isPublic
    } = parseSerializedJson(key);
    const locations = tripsData[key];
    let HTMLElementToUpdate;
    if (isPastTrip === "true") {
      isPastTripsEmpty = false;
      HTMLElementToUpdate = pastTripsHTMLElement;
    } else {
      isPlannedTripsEmpty = false;
      HTMLElementToUpdate = plannedTripsHTMLElement;
    }
    HTMLElementToUpdate.innerHTML += `
      <div class="row">
        <div class="col m8">
          <div class="card">
            <div class="card-content">
              <span class="card-title">${title}</span>
              <div id="trip-${timestamp}-locations"></div>
              <div id="trip-${timestamp}-map" class="trip-map"></div>
            </div>
          </div>
        </div>
        <div class="col m4">
          <div class="card medium">
            <div class="card-image">
              <img src="${hotelImage}">
            </div>
            <div class="card-content">
              <span class="card-title">${hotelName}</span>
              <div id="trip-${timestamp}-locations"></div>
            </div>
          </div>
        </div>
      </div>
    `;
    // Get coords of all locations in this trip and the hotel to add to the Google map
    const tripMap = new google.maps.Map(document.getElementById(`trip-${timestamp}-map`), undefined);
    const service = new google.maps.places.PlacesService(tripMap);

    const coords = [];
    coords.
    
    document.getElementById(`trip-${timestamp}-locations`).innerHTML = locations
      .map(({ weight, placeName }) => {
        return `
          <div class="row">
            <div class="col s6">
              <span><strong>${placeName}</strong></span>
            </div>
            <div class="col s6">
              <span>Weight: ${weight}</span>
            </div>
          </div>
        `;
      })
      .join("");
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
  google.maps.event.addListener(element, "place_changed", () => {
    const obj = element.getPlace();
    obj.locationNum = locationNum;
    locationPlaceObjects[locationNum - 1] = obj;
    const coords = {
      lat: obj.geometry.location.lat(),
      lng: obj.geometry.location.lng(),
    };
    if (!mapInitialized || locationNum === 1) {
      map = new google.maps.Map(document.getElementById("editor-map"), {
        center: coords,
        zoom: 13,
      });
      mapInitialized = true;
    }
    if (markers[locationNum - 1] !== "") {
      const currMarkerForLocation = markers[locationNum - 1];
      currMarkerForLocation.setMap(null);
    }

    const marker = new google.maps.Marker({
      position: coords,
      map: map,
      title: obj.name,
    });
    const infoWindow = new google.maps.InfoWindow({
      content: `<h5 class="infowindow-text">${obj.name}</h5>
          <p class="infowindow-text">Location ${locationNum}</p>`,
    });
    marker.addListener("click", () => infoWindow.open(map, marker));
    markers[locationNum - 1] = marker;
    if (locationNum !== 1) {
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
    if (marker !== "") {
      bounds.extend(marker.getPosition());
    }
  }
  mapRef.fitBounds(bounds);
  mapRef.panToBounds(bounds);
  mapRef.setCenter(bounds.getCenter());
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
