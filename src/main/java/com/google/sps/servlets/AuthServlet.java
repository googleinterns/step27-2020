package com.google.sps.servlets;

import com.google.appengine.api.users.UserService;
import com.google.appengine.api.users.UserServiceFactory;
import com.google.gson.Gson;
import com.google.sps.data.AuthInfo;
import java.io.IOException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

@WebServlet("/login")
public class AuthServlet extends HttpServlet {

  @Override
  public void doGet(HttpServletRequest request, HttpServletResponse response) throws IOException {
    response.setContentType("application/json");
    Gson gson = new Gson();

    UserService userService = UserServiceFactory.getUserService();
    if (userService.isUserLoggedIn()) {
      String redirectAfterLogout = "/";
      String logoutURL = userService.createLogoutURL(redirectAfterLogout);

      AuthInfo userLoginStatus = AuthInfo.builder()
                                  .setIsLoggedIn(true)
                                  .setLogoutUrl(logoutURL)
                                  .build();
      response.getWriter().println(gson.toJson(userLoginStatus));
    } else {
      String redirectAfterLogin = "/my-trips.html";
      String loginURL = userService.createLoginURL(redirectAfterLogin);

      AuthInfo userLoginStatus = AuthInfo.builder()
                                  .setIsLoggedIn(false)
                                  .setLoginUrl(loginURL)
                                  .build();
      response.getWriter().println(gson.toJson(userLoginStatus));
    }
  }
}