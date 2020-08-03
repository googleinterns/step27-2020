package com.google.sps;

import static org.mockito.Mockito.*;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.PrintWriter;
import java.io.StringReader;
import java.io.StringWriter;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import com.google.appengine.api.datastore.Entity;
import com.google.appengine.api.datastore.dev.LocalDatastoreService;
import com.google.appengine.tools.development.testing.LocalDatastoreServiceTestConfig;
import com.google.appengine.tools.development.testing.LocalServiceTestHelper;
import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
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
  private HttpServletRequest request;
  private HttpServletResponse response;
  private PrintWriter pw;
  private JsonObject postRequestBody;
  private JsonObject putRequestBody;
  private TripsServlet servlet;

  @Before
  public void setUp() throws IOException {
    helper = new LocalServiceTestHelper(new LocalDatastoreServiceTestConfig());
    LocalDatastoreService dsService = (LocalDatastoreService) helper.getLocalService(LocalDatastoreService.PACKAGE);
    dsService.setNoStorage(false);
    request = mock(HttpServletRequest.class);
    response = mock(HttpServletResponse.class);
    servlet = new TripsServlet();
    pw = new PrintWriter(new StringWriter());
    when(response.getWriter()).thenReturn(pw);

    postRequestBody = new JsonObject();
    postRequestBody.addProperty("title", "My Trip");
    postRequestBody.addProperty("hotel_id", "aBc123");
    postRequestBody.addProperty("hotel_name", "Google Hotel");
    postRequestBody.addProperty("hotel_img", "pHoTo");
    postRequestBody.addProperty("rating", -1);

    JsonObject location1 = new JsonObject();
    location1.addProperty("id", "g00g13");
    location1.addProperty("name", "Googleplex");
    location1.addProperty("weight", 5);
    JsonObject location2 = new JsonObject();
    location2.addProperty("id", "c0mput3r");
    location2.addProperty("name", "Computer History Museum");
    location2.addProperty("weight", 3);
    JsonArray locationArray = new JsonArray();
    locationArray.add(location1);
    locationArray.add(location2);
    postRequestBody.add("locations", locationArray);

    putRequestBody = postRequestBody.deepCopy();
    putRequestBody.addProperty("timestamp", 1596490838000L);

  }

  @After
  public void tearDown() {
    helper.tearDown();
  }

  @Test
  public void testUnauthenticatedUser() throws IOException {
    helper.setEnvIsLoggedIn(false);
    helper.setUp();

    servlet.doGet(request, response);
    servlet.doPost(request, response);
    servlet.doPut(request, response);
    servlet.doDelete(request, response);
    verify(response, times(4)).setStatus(HttpServletResponse.SC_UNAUTHORIZED);
  }

  @Test
  public void testDoGet() throws IOException {
    setUserAuthenticated();
    servlet.doGet(request, response);
    verify(response).setContentType("application/json;");
    verify(response).getWriter();
    verify(response).setStatus(HttpServletResponse.SC_OK);
  }

  @Test
  public void testDoPostAndPut() throws IOException {
    setUserAuthenticated();
    when(request.getReader()).thenReturn(new BufferedReader(new StringReader(postRequestBody.toString())));
    servlet.doPost(request, response);

    verify(response).setStatus(HttpServletResponse.SC_CREATED);
    when(request.getReader()).thenReturn(new BufferedReader(new StringReader(putRequestBody.toString())));
    servlet.doPut(request, response);

    verify(response).setStatus(HttpServletResponse.SC_OK);
  }

  /**
   * Sets the LocalServiceTestHelper member of this class to be authenticated with
   * email peter@google.com.
   */
  private void setUserAuthenticated() {
    helper.setEnvIsLoggedIn(true);
    helper.setEnvEmail("peter@google.com");
    helper.setEnvAuthDomain("google.com");
    helper.setUp();
  }
}