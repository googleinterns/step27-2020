/**
 * Function run on page load that runs auth checking and other functions
 */
function init() {
  authReload();
  loadSharedTripsData();
}

const SAMPLE_POSTS_DATA = [
  {
    title: "Amazing SF Trip",
    destinations: [
      {
        name: "Golden Gate Bridge",
      },
      {
        name: "Fisherman's Wharf",
      },
    ],
    owner: "CoolGuy123",
    description:
      "Great trip in SF, had a lot of fun. Lorem ipsum dolor sit amet.",
    timestamp: 1593466864528,
    hotel: "Hotel Inn San Fransisco",
    rating: 4.5,
  },
  {
    title: "Very Very Good Trip",
    destinations: [
      {
        name: "Empire State Building",
      },
      {
        name: "SoHo",
      },
      {
        name: "High Line",
      },
    ],
    owner: "HappyGuy",
    description: "Great trip. Not much else to say.",
    timestamp: 1583466733528,
    hotel: "Luxury Hotel New York",
    rating: 5,
  },
  {
    title: "Don't Go Here",
    destinations: [
      {
        name: "Bad Place #1",
      },
      {
        name: "Bad Place #2",
      },
      {
        name: "Bad Place #3",
      },
    ],
    owner: "BadGuy123",
    description: "Don't do this. I had a horrible time.",
    timestamp: 1592466864528,
    hotel: "Bad Hotel",
    rating: 1,
  },
];

/**
 * Fetches shared trips data from constant object data and renders it to the page
 * in card format. Currently using static data; currently data-driven but not
 * based on backend
 */
function loadSharedTripsData() {
  // Render loading animation while awaiting the backend fetch. Since the
  // function is not yet async, this part of the code is not visible since
  // the loading is negligible with constant preloaded data
  document.getElementById(
    "shared-trips-section"
  ).innerHTML = LOADING_ANIMATION_HTML;

  // Sort posts with newest first
  SAMPLE_POSTS_DATA.sort((a, b) => b.timestamp - a.timestamp);

  // Once data is loaded, render them into cards that display the data readably
  document.getElementById(
    "shared-trips-section"
  ).innerHTML = SAMPLE_POSTS_DATA.map(
    ({ title, destinations, owner, description, timestamp, hotel, rating }) => `
        <div class="col m12 shared-trip-card">
          <div class="card">
            <div class="card-content">
              <span class="card-title"><strong>${title}</strong> · ${owner}</span>
              <div class="left-align">
                <h6>Rating: ${rating}</h6>
              </div>
              <div class="right-align">
                <h6>${unixTimestampToString(timestamp)}</h6>
              </div>
              <p>${description}</p>
              <ul class="collection with-header">
                <li class="collection-header"><h5>Hotel: ${hotel}</h5></li>
                ${destinations
                  .map(
                    ({ name }, index) => `
                      <li class="collection-item">
                        <div>
                          ${index + 1}. ${name}
                          <a href="#" class="secondary-content">
                          <i class="material-icons indigo-text">place</i>
                          </a>
                        </div>
                      </li>
                    `
                  )
                  .join(" ")}
                </ul>
            </div>
          </div>
        </div>
      `
  ).join(" ");
}

/**
 * Converts Unix epoch time number to a string of the form MM/DD/YYYY.
 * Uses the client timezone to calculate the string; behavior can differ
 * on different devices.
 * @param {number} timestamp
 */
function unixTimestampToString(timestamp) {
  return new Date(timestamp).toLocaleDateString();
}
