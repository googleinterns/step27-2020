/**
 * Check if user is logged in and performs respective behavior to the DOM of the homepage:
 * if user logged in, show navbar options for auth-walled pages and hide sign-in button
 * if user logged out, hide navbar options for auth-walled pages and show sign-in button
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

      if (isLoggedIn) {
        loginButton.style.display = "none";
        showLogoutButton(logoutUrl);
      } else {
        loginButton.setAttribute("href", loginUrl);
        const authRequiredLinks = document.getElementsByClassName(
          "auth-required"
        );
        Array.from(authRequiredLinks).forEach((element) => (element.style.display = "none"));
      }
    });
}
