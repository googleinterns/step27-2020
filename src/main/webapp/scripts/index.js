/**
 * Check if user is logged in and performs respective behavior to the DOM of the homepage
 */
function authUser() {
  fetch("/login")
    .then((response) => response.json())
    .then((userAuthInfo) => {
      const { loginUrl, logoutUrl, isLoggedIn } = userAuthInfo;
      const loginButton = document.getElementById("google-login-button");
      const loginButtonText = document.getElementById(
        "google-login-button-text"
      );
      const menu = document.getElementById("menu-links");

      if (isLoggedIn) {
        loginButton.setAttribute("href", logoutUrl);
        loginButtonText.innerText = "Sign out with Google";
        menu.innerHTML += `
          <li>
            <a class="waves-effect waves-light btn white black-text">Logout</a>
          </li>
        `;
      } else {
        loginButton.setAttribute("href", loginUrl);
        const authRequiredLinks = document.getElementsByClassName(
          "auth-required"
        );
        authRequiredLinks.forEach((tag) => (tag.href = loginUrl));
      }
    });
}
