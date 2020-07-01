package com.google.sps.data;

import com.google.auto.value.AutoValue;

/**
 * Value class for data pertaining to a user's auth status with a boolean
 * repesenting login status, email, and login url or logout url. If one of these
 * are not avaiable, the empty string is used.
 */

@AutoValue
abstract class AuthInfo {

  abstract boolean isLoggedIn();

  abstract String email();

  abstract String loginUrl();

  abstract String logoutUrl();

  static Builder builder() {
    return new AutoValue_AuthInfo.Builder()
                .setEmail("")
                .setLoginUrl("")
                .setLogoutUrl("");
  }

  @AutoValue.Builder
  abstract static class Builder {
    abstract Builder setIsLoggedIn(boolean value);

    abstract Builder setEmail(String value);

    abstract Builder setLoginUrl(String value);

    abstract Builder setLogoutUrl(String value);

    abstract AuthInfo build();
  }
}