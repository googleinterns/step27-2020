package com.google.sps;

import static org.mockito.Mockito.*;

import java.io.IOException;
import java.io.PrintWriter;
import java.io.StringWriter;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import com.google.appengine.api.datastore.Entity;
import com.google.appengine.tools.development.testing.LocalDatastoreServiceTestConfig;
import com.google.appengine.tools.development.testing.LocalServiceTestHelper;
import com.google.sps.data.Trip;
import com.google.sps.servlets.TripsServlet;
import com.google.sps.util.TripDataConverter;

import org.junit.After;
import org.junit.Assert;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.junit.runners.JUnit4;

@RunWith(JUnit4.class)
public class TripsServletTest {
  private LocalServiceTestHelper helper;

  @Before
  public void setUp() {
    helper = new LocalServiceTestHelper(new LocalDatastoreServiceTestConfig());
  }

  @After
  public void tearDown() {
    helper.tearDown();
  }

  @Test
  public void testUnauthenticatedUser() throws IOException {
    helper.setEnvIsLoggedIn(false);
    helper.setUp();

    HttpServletRequest request = mock(HttpServletRequest.class);
    HttpServletResponse response = mock(HttpServletResponse.class);
    PrintWriter pw = new PrintWriter(new StringWriter());
    when(response.getWriter()).thenReturn(pw);

    TripsServlet servlet = new TripsServlet();
    servlet.doGet(request, response);
    servlet.doPost(request, response);
    servlet.doPut(request, response);
    servlet.doDelete(request, response);
    verify(response, times(4)).setStatus(HttpServletResponse.SC_UNAUTHORIZED);
  }

  @Test
  public void testDoGet() {
    helper.setEnvIsLoggedIn(true);
    helper.setEnvEmail("peter@google.com");
    helper.setEnvAuthDomain("google.com");
    helper.setUp();
  }
}