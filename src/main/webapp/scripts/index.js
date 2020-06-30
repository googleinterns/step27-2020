/**
 * Check if user is logged in
 */
function authUser() {
    fetch('/login')
      .then(response => response.json())
      .then(userAuthInfo => {
        if(userAuthInfo.isLoggedIn) {
          console.log("User is logged in");
        } else {
          console.log("User is logged out");
        }
      });
} 