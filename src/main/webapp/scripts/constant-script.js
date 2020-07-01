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
        const menu = document.getElementById("menu-links");
        menu.innerHTML += `
          <li>
            <a class="waves-effect btn white black-text" href="${logoutUrl}">Logout</a>
          </li>
        `;
      } else {        
        window.location.replace(loginUrl);
      }
    });
}