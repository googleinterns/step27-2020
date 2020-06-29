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
        name: "Golden Gate Bridge",
      },
      {
        name: "Fisherman's Wharf",
      },
    ],
    owner: "HappyGuy",
    description: "Great trip. Not much else to say.",
    timestamp: 1583466733528,
    hotel: "Hotel Inn San Fransisco",
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
 * in card format.
 */
function loadSharedTripsData() {
  // Render loading animation while awaiting the backend fetch
  document.getElementById("shared-trips-section").innerHTML = `
    <div class="preloader-wrapper big active loading-animation">
      <div class="spinner-layer spinner-blue-only">
        <div class="circle-clipper left">
          <div class="circle"></div>
        </div><div class="gap-patch">
          <div class="circle"></div>
        </div><div class="circle-clipper right">
          <div class="circle"></div>
        </div>
      </div>
    </div>
  `;

  document.getElementById("shared-trips-section").innerHTML = "";
  // Currently using static data; currently data-driven but not based on backend
  SAMPLE_POSTS_DATA.forEach(
    ({ title, destinations, owner, description, timestamp, hotel, rating }) => {
      document.getElementById("shared-trips-section").innerHTML += `
        <div class="col m12 shared-trip-card">
          <div class="card">
            <div class="card-content">
              <span class="card-title"><strong>${title}</strong> · ${owner}</span>
              <div class="left-align">
                <h6>Rating: ${rating}</h6>
              </div>
              <div class="right-align">
                <h6>${new Date(timestamp).toLocaleDateString()}</h6>
              </div>
              ${description}
            </div>
          </div>
        </div>
      `;
    }
  );
}
