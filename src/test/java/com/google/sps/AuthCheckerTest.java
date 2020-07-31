package com.google.sps;

import javax.servlet.http.HttpServletResponse;

import com.google.appengine.api.users.User;
import com.google.appengine.api.users.UserService;
import com.google.sps.util.AuthChecker;

import org.junit.Assert;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.junit.runners.JUnit4;
import static org.mockito.Mockito.*;

import java.io.IOException;

@RunWith(JUnit4.class)
public class AuthCheckerTest {
  private HttpServletResponse response;
  private UserService userServiceNotLoggedIn;
  private UserService userServiceLoggedIn;

  @Before
  public void setUp() throws IOException {
    response = mock(HttpServletResponse.class);
    userServiceNotLoggedIn = mock(UserService.class);
    userServiceLoggedIn = mock(UserService.class);

    when(userServiceNotLoggedIn.isUserLoggedIn()).thenReturn(false);
    when(userServiceLoggedIn.isUserLoggedIn()).thenReturn(true);
    when(userServiceLoggedIn.getCurrentUser()).thenReturn(new User("peter@google.com", "overnightly.com"));
  }

  @Test
  public void testUnauthenticatedUser() {
    String email = AuthChecker.getUserEmail(response, userServiceNotLoggedIn);
    Assert.assertEquals(null, email);
    verify(response).setStatus(HttpServletResponse.SC_UNAUTHORIZED);
  }

  @Test
  public void testAuthenticatedUser() {
    String email = AuthChecker.getUserEmail(response, userServiceLoggedIn);
    Assert.assertEquals("peter@google.com", email);
  }
}