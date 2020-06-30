function authUser() {
    fetch('/login')
      .then(response => response.json())
      .then(userAuthInfo => {
        if(userAuthInfo.isLoggedIn) {
          console.log("User is logged in");
          console.log("Please work git");
        } else {
          console.log("User is logged out");
        }
      });
} 