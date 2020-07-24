package com.google.sps.util;

import javax.servlet.http.HttpServletResponse;

import com.google.appengine.api.users.UserService;
import com.google.appengine.api.users.UserServiceFactory;

public class AuthChecker {

  /**
   * Gets the email of the user accessing a certain endpoint.
   * 
   * @param response the calling servlet's response object to be updated in the
   *                 case that the user is not authenticated
   * @return the user's email as a String, or if the user is not logged in then
   *         null.
   */
  public static String getUserEmail(HttpServletResponse response) {
    UserService userService = UserServiceFactory.getUserService();
    if (userService.isUserLoggedIn()) {
      return userService.getCurrentUser().getEmail();
    } else {
      response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
      return null;
    }
  }
}