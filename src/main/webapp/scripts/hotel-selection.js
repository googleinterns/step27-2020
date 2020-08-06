//const DOM elements for components of shared hotel modal
const HOTEL_MAP_ELEM = document.getElementById('hotel-map');
const HOTEL_RESULTS = document.getElementById('hotel-results');

/**
 * Opens modal with results for user to confirm and save trip.
 * @param {string|null} timestamp timestamp string of the trip to be updated.
 *                                Null if this is a new trip.
 */
async function fetchHotelResults(timestamp) {
  HOTEL_RESULTS.innerHTML = LOADING_ANIMATION_HTML;
  HOTEL_MAP_ELEM.innerHTML = '';
  HOTEL_MAP_ELEM.style.display = 'none';
  openHotelModal();

  // Get center point from which to start searching for hotels
  const coords = placesToCoordsWeightArray(locationPlaceObjects);
  const [lat, lng] = centerOfMass(coords);

  const response = await fetch(
    `https://cors-anywhere.herokuapp.com/https://maps.googleapis.com/maps/api/place/textsearch/json?type=lodging&location=${lat},${lng}&radius=10000&key=${GOOGLE_API_KEY}&output=json`
  );
  const { results } = await response.json();
  parseAndRenderHotelResults(results, { lat: lat, lng: lng }, timestamp);
}

/**
 * Parses response from Places API lodging query to render list of
 * cards to the hotel results modal.
 * @param {Object} json the resulting JS object from calling the
 *                      Places API for the centerpoint.
 * @param {string|null} timestamp timestamp string of the trip to be updated.
 *                                Null if this is a new trip.
 */
async function parseAndRenderHotelResults(json, centerPoint, timestamp) {
  HOTEL_MAP_ELEM.style.height = '';

  if (!json || json.length === 0) {
    HOTEL_RESULTS.innerText =
      "We couldn't find any hotels nearby. Sorry about that.";
  } else {
    json = json.slice(0, 10);
    const hotelMap = new google.maps.Map(
      HOTEL_MAP_ELEM,
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
        position: { lat: lat, lng: lng },
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
          fontFamily: 'Material Icons',
          text: 'hotel',
        },
      });

      const infoWindow = new google.maps.InfoWindow({
        content: `<h5 class="infowindow-text">${obj.name}</h5>`,
      });
      marker.addListener('click', () => infoWindow.open(hotelMap, marker));

      obj.distance_center = distanceBetween(location, centerPoint);
      
      const photoInfo = await imageInfoFromPhotosArray(obj.photos);
      const { photoRef, photoUrl } = photoInfo;
      obj.photo_url = photoUrl;
      obj.photo_ref = photoRef;

      return await obj;
    });
    json = await Promise.all(json);
    json.sort((a, b) => a.distance_center - b.distance_center);

    HOTEL_MAP_ELEM.style.display = 'block';
    HOTEL_MAP_ELEM.style.width = '100%';
    HOTEL_MAP_ELEM.style.height = '400px';
    HOTEL_MAP_ELEM.style.marginBottom = '2em';
    HOTEL_RESULTS.innerHTML = json
      .map(
        ({ name, formatted_address, rating, place_id, photo_url, photo_ref }) =>
          `
          <div class="row">
            <div class="col s12 m6">
              <div class="card large white">` +
          (photo_url
            ? `
                <div class="card-image">
                  <img src="${photo_url}" alt="photo of ${name} from Google" loading="lazy" />
                </div> `
            : '') +
          `
                <div class="card-content black-text">
                  <span class="card-title"><strong>${name}</strong></span>
                  <p>${formatted_address}</p>
                </div>
                <div class="card-action center">
                  <button
                    class="btn indigo" 
                    onClick="saveTrip('${place_id}', 
                                      '${photo_ref}', 
                                      '${name.replace(/'/g, "\\'")}',
                                       ${timestamp})"
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
      .join('');
  }
}

/**
 * Saves the current trip the user is editing to My Trips, through a POST request
 * to the backend. Then rerenders the trips based on DB data.
 * @param {string} hotelID  the Place ID for the hotel
 * @param {string} hotelRef the photo reference in Google Place Photos for the hotel.
 * @param {string} hotelName the name of the hotel
 * @param {string|null|undefined} timestamp timestamp string of the trip to be updated.
 *                                          Null/undefined if this is a new trip.
 */
async function saveTrip(hotelID, hotelRef, hotelName, timestamp) {
  closeHotelModal();

  // Build location and weight arrays
  const locationData = [];
  for (let i = 1; i <= numLocations; i++) {
    locationData.push({
      id: locationPlaceObjects[i - 1].place_id,
      name: locationPlaceObjects[i - 1].name,
      weight: locationPlaceObjects[i - 1].weight,
    });
  }

  const tripTitleElem = document.getElementById('trip-title');
  const tripTitle = tripTitleElem ? tripTitleElem.value : 'Plan For Me Trip';
  const requestBody = {
    title: tripTitle,
    hotel_id: hotelID,
    hotel_img: hotelRef,
    hotel_name: hotelName,
    rating: -1,
    locations: locationData,
  };

  if (timestamp) {
    requestBody.timestamp = timestamp;
  }

  const response = await fetch('/trip-data', {
    method: timestamp ? 'PUT' : 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  resetPage(response, timestamp, tripTitle);
}

function openHotelModal() {
  const HOTEL_MODAL_ELEM = document.getElementById('hotel-modal');
  const HOTEL_MODAL_INSTANCE = M.Modal.getInstance(HOTEL_MODAL_ELEM);
  HOTEL_MODAL_INSTANCE.open();
}

function closeHotelModal() {
  const HOTEL_MODAL_ELEM = document.getElementById('hotel-modal');
  const HOTEL_MODAL_INSTANCE = M.Modal.getInstance(HOTEL_MODAL_ELEM);
  HOTEL_MODAL_INSTANCE.close();
}





