/**
 * Function run on page load for index.html.
 */
function init() {
  document.getElementById('index-link').classList.add('active');
  document.getElementById('index-link-m').classList.add('active');
  authUser();
}

/**
 * Check if user is logged in and performs respective behavior to the DOM of the homepage:
 * if user logged in, show navbar options for auth-walled pages and hide sign-in button
 * if user logged out, hide navbar options for auth-walled pages and show sign-in button
 */
function authUser() {
  fetch('/login')
    .then((response) => response.json())
    .then((userAuthInfo) => {
      const { loginUrl, logoutUrl, isLoggedIn } = userAuthInfo;
      const loginButton = document.getElementById('google-login-button');
      const loginButtonText = document.getElementById(
        'google-login-button-text'
      );

      if (isLoggedIn) {
        showLogoutButton(logoutUrl);
        document.getElementById('cta-area').innerHTML = `
          <a class="waves-effect white btn-large black-text" id="get-started-button" href="my-trips.html">Get Started</a>
        `;
      } else {
        loginButton.setAttribute('href', loginUrl);
        const authRequiredLinks = document.getElementsByClassName(
          'auth-required'
        );
        Array.from(authRequiredLinks).forEach(
          (element) => (element.style.display = 'none')
        );
      }
    });
}
