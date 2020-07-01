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
        loginButton.style.display = "none";
        menu.innerHTML += `
          <li>
            <a class="waves-effect btn white black-text" href="${logoutUrl}">Logout</a>
          </li>
        `;
      } else {
        loginButton.setAttribute("href", loginUrl);
        const authRequiredLinks = document.getElementsByClassName(
          "auth-required"
        );
        Array.from(authRequiredLinks).forEach((element) => (element.href = loginUrl));
      }
    });
}
