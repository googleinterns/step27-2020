package com.google.sps;

import static org.mockito.Mockito.*;

import java.io.IOException;
import java.io.PrintWriter;
import java.io.StringWriter;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import com.google.appengine.tools.development.testing.LocalDatastoreServiceTestConfig;
import com.google.appengine.tools.development.testing.LocalServiceTestHelper;
import com.google.sps.servlets.AuthServlet;

import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.junit.runners.JUnit4;

@RunWith(JUnit4.class)
public class AuthServletTest {

  public LocalServiceTestHelper helper;

  @Before
  public void setUp() {
    helper = new LocalServiceTestHelper(new LocalDatastoreServiceTestConfig());
  }

  @After
  public void tearDown() {
    helper.tearDown();
  }

  @Test
  public void testDoGetIsAuthenticated() throws IOException {
    helper.setEnvIsLoggedIn(true);
    helper.setEnvEmail("peter@google.com");
    helper.setEnvAuthDomain("google.com");
    helper.setUp();
    HttpServletRequest request = mock(HttpServletRequest.class);
    HttpServletResponse response = mock(HttpServletResponse.class);

    PrintWriter pw = new PrintWriter(new StringWriter());
    when(response.getWriter()).thenReturn(pw);

    new AuthServlet().doGet(request, response);
    verify(response).setContentType("application/json");
    verify(response).getWriter();
  }

  @Test
  public void testDoGetNotAuthenticated() throws IOException {
    helper.setEnvIsLoggedIn(false);
    helper.setUp();
    HttpServletRequest request = mock(HttpServletRequest.class);
    HttpServletResponse response = mock(HttpServletResponse.class);

    PrintWriter pw = new PrintWriter(new StringWriter());
    when(response.getWriter()).thenReturn(pw);

    new AuthServlet().doGet(request, response);
    verify(response).setContentType("application/json");
    verify(response).getWriter();
  }
}