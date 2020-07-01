/**
 * Check if user is logged in
 */
function authUser() {
    fetch('/login')
      .then(response => response.json())
      .then(userAuthInfo => {
        const loginButton = document.getElementById('google-login-button');
        const loginButtonText = document.getElementById('google-login-button-text');

        if(userAuthInfo.isLoggedIn) {
          loginButton.setAttribute('href', userAuthInfo.logoutUrl);
          loginButtonText.innerText = 'Sign out with Google';
        } else {
          loginButton.setAttribute('href', userAuthInfo.loginUrl);
          loginButtonText.innerText = 'Sign in with Google';
        }
      });
} 