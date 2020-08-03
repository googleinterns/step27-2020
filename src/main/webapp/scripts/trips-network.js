/**
 * Function run on page load that runs auth checking and other functions
 */
function init() {
  document.getElementById('trips-network-link').classList.add('active');
  document.getElementById('trips-network-link-m').classList.add('active');
  authReload();
  loadSharedTripsData();
}

/**
 * Fetches shared trips data from /trips-network endpoint and renders it to the page
 * in card format.
 */
async function loadSharedTripsData() {
  // Render loading animation while awaiting the backend fetch.
  document.getElementById(
    'shared-trips-section'
  ).innerHTML = LOADING_ANIMATION_HTML;

  const response = await fetch('/trips-network', {
    method: 'GET',
  });
  const tripsData = await response.json();
  const keys = Object.keys(tripsData);
  if (keys.length === 0) {
    document.getElementById('shared-trips-section').innerHTML = `
      <div class="row"><div class="col s12">
      <p class="placeholder-text">No posts to show. Be the first one to post!</p>
      </div></div>
    `;
    return;
  }
  keys.sort(
    (a, b) =>
      parseSerializedJson(b).timestamp - parseSerializedJson(a).timestamp
  );

  const posts = [];
  for (key of keys) {
    const {
      title,
      hotelName,
      hotelImage,
      owner,
      description,
      rating,
    } = parseSerializedJson(key);

    const locations = tripsData[key];
    const currData = {
      title: title,
      destinations: locations,
      owner: owner,
      description: description,
      hotel: hotelName,
      hotelImage: hotelImage,
      rating: rating,
    };
    posts.push(currData);
  }
  // Once data is loaded, render them into cards that display the data readably
  document.getElementById('shared-trips-section').innerHTML = posts
    .map(
      ({
        title,
        destinations,
        owner,
        description,
        hotel,
        hotelImage,
        rating,
      }) => `
        <div class="col m12 shared-trip-card">
          <div class="card">
            <div class="card-content">
              <span class="card-title"><strong>${title}</strong> · ${owner}</span>
              <div class="left-align">
                <h6>Rating: ${rating}</h6>
              </div>
              <p>${description}</p>
              <div class="col s12">
                <ul class="collection with-header">
                  <li class="collection-header"><h5>Hotel: ${hotel}</h5></li>
                  ${destinations
                    .map(
                      ({ placeName }) => `
                        <li class="collection-item">
                          <div>
                            <i class="material-icons left indigo-text">place</i>
                            ${placeName}
                          </div>
                        </li>
                      `
                    )
                    .join('')}
                </ul>
              </div>
            </div>
          </div>
        </div>
      `
    )
    .join('');
}
