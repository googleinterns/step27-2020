package com.google.sps.data;

/** An object to hold authentication information*/
public final class AuthInfo {

    private final boolean isLoggedIn;
    private final String loginUrl;
    private final String logoutUrl;
  
    public AuthInfo(boolean isLoggedIn, String loginUrl, String logoutUrl) {
      this.isLoggedIn = isLoggedIn;
      this.loginUrl = loginUrl;
      this.logoutUrl = logoutUrl;
    }
  
    public static AuthInfo createLoggedInInfo(String url) {
      return new AuthInfo(true, "", url);
    }
  
    public static AuthInfo createLoggedOutInfo(String url) {
      return new AuthInfo(false, url, "");
    }
  }