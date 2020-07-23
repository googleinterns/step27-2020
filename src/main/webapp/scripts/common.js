// Copyright 2019 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// This file contains all the constant scripts to be loaded on each page.

renderNavbar();
renderFooter();

// Initialize Materialize JS elements when DOM content is fully loaded
document.addEventListener('DOMContentLoaded', () => {
  const sidenavElems = document.querySelectorAll('.sidenav');
  const sideNavInstances = M.Sidenav.init(sidenavElems, undefined);
  const modalElems = document.querySelectorAll('.modal');
  const modalInstances = M.Modal.init(modalElems, undefined);
  const formSelectElems = document.querySelectorAll('select');
  const formSelectInstances = M.FormSelect.init(formSelectElems, undefined);
});

/**
 * Renders the footer code shared across all pages to the div with id "footer-section"
 */
function renderFooter() {
  document.getElementById('footer-section').innerHTML = `
    <footer class="page-footer blue lighten-1">
      <div class="footer-copyright">
        <div class="container">
          Created by Peter Wu, Joshua Lewis, and Miguel Fabrigas
        </div>
      </div>
    </footer>
  `;
}

/**
 * Renders the footer code shared across all pages to the <nav> tag with id
 * "
 */
function renderNavbar() {
  document.getElementById('navbar-section').innerHTML = `
    <div class="nav-wrapper container">
      <a href="index.html" class="brand-logo">Overnightly</a>
      <a href="#" data-target="mobile-demo" class="sidenav-trigger">
        <i class="material-icons">menu</i>
      </a>
      <ul class="right hide-on-med-and-down" id="menu-links">
        <li id="index-link"><a href="index.html">Home</a></li>
        <li id="my-trips-link"><a href="my-trips.html">My Trips</a></li>
        <li id="plan-for-me-link"><a href="place-suggestions.html">Plan For Me</a></li>
        <li id="trips-network-link"><a href="trips-network.html">Trips Network</a></li>
        <li id="itinerary-link"><a href="itinerary-overview.html">Itinerary</a></li>
      </ul>
    </div>
  `;
  document.getElementById('mobile-demo').innerHTML = `
    <li id="index-link-m"><a href="index.html">Home</a></li>
    <li id="my-trips-link-m"><a href="my-trips.html">My Trips</a></li>
    <li id="plan-for-me-link-m"><a href="place-suggestions.html">Plan For Me</a></li>
    <li id="trips-network-link-m"><a href="trips-network.html">Trips Network</a></li>
    <li id="itinerary-link-m"><a href="itinerary-overview.html">Itinerary</a></li>
  `;
}

/**
 * Checks auth status of user and redirects to auth page if
 * they are not logged in. For use on auth-walled pages.
 */
function authReload() {
  fetch('/login')
    .then((response) => response.json())
    .then(({ isLoggedIn, loginUrl, logoutUrl }) => {
      if (isLoggedIn) {
        showLogoutButton(logoutUrl);
      } else {
        // redirect user to auth page
        window.location.replace(loginUrl);
      }
    });
}

const LOADING_ANIMATION_HTML = `
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

/**
 * Shows the logout button given a logout url string in
 * the main navbar and mobile sidenav.
 * Precondition: user should be logged in.
 * @param {string} logoutUrl
 */
function showLogoutButton(logoutUrl) {
  const mobileSidenav = document.getElementById('mobile-demo');
  const defaultNav = document.getElementById('menu-links');
  mobileSidenav.innerHTML += `
          <li>
            <a class="waves-effect btn white black-text" href="${logoutUrl}">Logout</a>
          </li>
        `;
  defaultNav.innerHTML += `
          <li>
            <a class="waves-effect btn white black-text" href="${logoutUrl}">Logout</a>
          </li>
        `;
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
