/**
 * Fetches image and gets temp URL of image from Google Place Photos
 * @param {string} photoRef a Place Photos photo_reference
 * @returns {string} String containing object url of the resulting image

async function imageURLFromPhotoRef(photoRef) {
  const photoResponse = await fetch(
    `https://cors-anywhere.herokuapp.com/https://maps.googleapis.com/maps/api/place/photo?maxwidth=500&photoreference=${photoRef}&key=${GOOGLE_API_KEY}`
  );
  const blob = await photoResponse.blob();
  const photoUrl = await URL.createObjectURL(blob);
  return photoUrl;
}
*/

/**
 * Gets URL for photo of place or assigns it a default one if there are no photos available
 * @param {Array} photos array of photos from PlaceResult object
*/
async function imageInfoFromPhotosArray(photos) {
  const photoRef = 
    photos && Array.isArray(photos)
      ? photos[0].photo_reference
      : undefined;

  let photoInfo;
  if(photoRef) {
    const photoResponse = await fetch(
      `https://cors-anywhere.herokuapp.com/https://maps.googleapis.com/maps/api/place/photo?maxwidth=500&photoreference=${photoRef}&key=${GOOGLE_API_KEY}`
    );
    const blob = await photoResponse.blob();
    const photoUrl = await URL.createObjectURL(blob);
    photoInfo = {
      photoRef: photoRef,
      photoUrl: photoUrl,
    }
    return photoInfo;
  } else {
    photoInfo = {
      photoRef: '',
      photoUrl: DEFAULT_PLACE_IMAGE,
    }
    return photoInfo;
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
  return arr.map(({ geometry, weight }) => ({
    lat: geometry.location.lat,
    lng: geometry.location.lng,
    weight: weight,
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
 * Parses a serialized JSON string produced by Gson for a value class and
 * converts it to a JS object.
 * @param {string} json a JSON string in the form
 *                      "ClassName{field1=val, ..., fieldN=val}"
 * @returns {Object} JS object with the data stored in json.
 */
function parseSerializedJson(json) {
  const charArray = [...json];
  const startIndex = charArray.indexOf('{');

  // Build JS object by iterating through
  let obj = {};
  let isField = true;
  let [currField, currValue] = ['', ''];
  for (let i = startIndex + 1; i < charArray.length; i++) {
    const currChar = charArray[i];
    if (isField) {
      if (currChar === ' ') {
        continue;
      }
      if (currChar !== '=') {
        currField += currChar;
      } else {
        isField = false;
      }
    } else {
      if (currChar !== ',' && currChar !== '}') {
        currValue += currChar;
      } else {
        isField = true;
        // add field to obj and reset field and value strings
        obj[currField] = currValue;
        [currField, currValue] = ['', ''];
      }
    }
  }

  return obj;
}

/**
 * Converts Unix epoch time number to a string of the form MM/DD/YYYY.
 * Uses the client timezone to calculate the string; behavior can differ
 * on different devices.
 * @param {number} timestamp
 * @returns {string} date corresponding to timestamp in MM/DD/YYYY form.
 */
function unixTimestampToString(timestamp) {
  return new Date(timestamp).toLocaleDateString();
}