package com.google.sps;

import com.google.sps.data.AuthInfo;

import org.junit.Assert;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.junit.runners.JUnit4;

@RunWith(JUnit4.class)
public final class AuthInfoTest {

  @Test
  public void testDefaultBuilderValues() {
    AuthInfo uninitializedAuthInfo = AuthInfo.builder().setIsLoggedIn(false).build();
    Assert.assertEquals("", uninitializedAuthInfo.email());
    Assert.assertEquals("", uninitializedAuthInfo.loginUrl());
    Assert.assertEquals("", uninitializedAuthInfo.logoutUrl());
  }

  @Test
  public void testBuilderLoggedInFields() {
    AuthInfo loggedInAuthInfo = AuthInfo.builder()
                                  .setIsLoggedIn(true)
                                  .setEmail("test@gmail.com")
                                  .setLogoutUrl("https://google.com")
                                  .build();
    Assert.assertEquals(true, loggedInAuthInfo.isLoggedIn());
    Assert.assertEquals("test@gmail.com", loggedInAuthInfo.email());
    Assert.assertEquals("https://google.com", loggedInAuthInfo.logoutUrl());
    Assert.assertEquals("", loggedInAuthInfo.loginUrl());
  }
}