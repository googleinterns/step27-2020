async function findHotel(timestamp) {
  document.getElementById('hotel-results').innerHTML = LOADING_ANIMATION_HTML;
  if (numLocations !== getNumPlaceObjectsInArray(locationPlaceObjects)) {
    M.Toast.dismissAll();
    M.toast({
      html: 'Not all of your places are selected through autocomplete.',
    });
    return;
  }
  const elem = document.getElementById('hotel-modal');
  const instance = M.Modal.getInstance(elem);
  instance.open();

  // Get center point from which to start searching for hotels
  const coords = placesToCoordsWeightArray(locationPlaceObjects);
  const [lat, lng] = centerOfMass(coords);
  document.getElementById('hotels-map').innerHTML = '';
  document.getElementById('hotels-map').style.display = 'none';

  const response = await fetch(
    `https://cors-anywhere.herokuapp.com/https://maps.googleapis.com/maps/api/place/textsearch/json?type=lodging&location=${lat},${lng}&radius=10000&key=${GOOGLE_API_KEY}&output=json`
  );
  const { results } = await response.json();
  parseAndRenderHotelResults(results, { lat: lat, lng: lng }, timestamp);
}

async function parseAndRenderHotelResults(json, centerPoint, timestamp) {
  const modalContent = document.getElementById('hotel-results');
  const hotelsMapElem = document.getElementById('hotels-map');
  hotelsMapElem.style.height = '';

  if (!json || json.length === 0) {
    modalContent.innerText =
      "We couldn't find any hotels nearby. Sorry about that.";
  } else {
    json = json.slice(0, 10);
    const hotelMap = new google.maps.Map(
      document.getElementById('hotels-map'),
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
          fontFamily: 'Material Icons',
          text: 'hotel',
        },
      });
      const infoWindow = new google.maps.InfoWindow({
        content: `<h5 class="infowindow-text">${obj.name}</h5>`,
      });
      marker.addListener('click', () => infoWindow.open(hotelMap, marker));
      obj.distance_center = distanceBetween(location, centerPoint);
      const photoRef =
        obj.photos && Array.isArray(obj.photos)
          ? obj.photos[0].photo_reference
          : undefined;
      if (photoRef) {
        const photoUrl = await imageURLFromPhotoRef(photoRef);
        obj.photo_url = photoUrl;
        obj.photo_ref = photoRef;
      } else {
        obj.photo_url = undefined;
        obj.photo_ref = '';
      }
      return await obj;
    });
    json = await Promise.all(json);
    json.sort((a, b) => a.distance_center - b.distance_center);

    hotelsMapElem.style.display = 'block';
    hotelsMapElem.style.width = '100%';
    hotelsMapElem.style.height = '400px';
    hotelsMapElem.style.marginBottom = '2em';
    modalContent.innerHTML = json
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

async function saveTrip(hotelID, hotelRef, hotelName, timestamp) {
  const elem = document.getElementById('hotel-modal');
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

  const tripTitle = document.getElementById('trip-title').value;
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