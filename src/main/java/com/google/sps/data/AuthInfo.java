package com.google.sps.data;

import com.google.auto.value.AutoValue;

/**
 * Value class for data pertaining to a user's auth status with a boolean
 * repesenting login status, email, and login url or logout url. If one of these
 * are not avaiable, the empty string is used.
 */
@AutoValue
public abstract class AuthInfo {

  public abstract boolean isLoggedIn();

  public abstract String email();

  public abstract String loginUrl();

  public abstract String logoutUrl();

  public static Builder builder() {
    return new AutoValue_AuthInfo.Builder()
                .setEmail("")
                .setLoginUrl("")
                .setLogoutUrl("");
  }

  @AutoValue.Builder
  public abstract static class Builder {
    public abstract Builder setIsLoggedIn(boolean value);

    public abstract Builder setEmail(String value);

    public abstract Builder setLoginUrl(String value);

    public abstract Builder setLogoutUrl(String value);

    public abstract AuthInfo build();
  }
}