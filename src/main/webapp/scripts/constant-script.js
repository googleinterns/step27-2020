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

// Initialize mobile sidenav when DOM content is fully loaded
document.addEventListener("DOMContentLoaded", () => {
  const elems = document.querySelectorAll(".sidenav");
  const instances = M.Sidenav.init(elems, undefined);
});

/**
 * Checks auth status of user and redirects to auth page if
 * they are not logged in. For use on auth-walled pages.
 */
function authReload() {
  fetch("/login")
    .then((response) => response.json())
    .then(({isLoggedIn, loginUrl, logoutUrl}) => {
      if(isLoggedIn) {
        showLogoutButton(logoutUrl);
      } else {        
        // redirect user to auth page
        window.location.replace(loginUrl);
      }
    });
}

/**
 * Shows the logout button given a logout url string in
 * the main navbar and mobile sidenav.
 * Precondition: user should be logged in.
 * @param {string} logoutUrl
 */
function showLogoutButton(logoutUrl) {
  const mobileSidenav = document.getElementById("mobile-demo");
  const defaultNav = document.getElementById("menu-links");
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
