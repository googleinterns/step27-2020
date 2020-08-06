package com.google.sps;

import static org.mockito.Mockito.*;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.PrintWriter;
import java.io.StringReader;
import java.io.StringWriter;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import com.google.appengine.api.datastore.DatastoreService;
import com.google.appengine.api.datastore.DatastoreServiceFactory;
import com.google.appengine.api.datastore.Entity;
import com.google.appengine.api.datastore.FetchOptions;
import com.google.appengine.api.datastore.Query;
import com.google.appengine.tools.development.testing.LocalDatastoreServiceTestConfig;
import com.google.appengine.tools.development.testing.LocalServiceTestHelper;
import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import com.google.sps.data.Trip;
import com.google.sps.data.TripLocation;
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
  private LocalServiceTestHelper helper = new LocalServiceTestHelper(new LocalDatastoreServiceTestConfig());
  private DatastoreService datastore = DatastoreServiceFactory.getDatastoreService();
  private TripsServlet servlet = new TripsServlet();
  private HttpServletRequest request = mock(HttpServletRequest.class);
  private HttpServletResponse response = mock(HttpServletResponse.class);
  private PrintWriter pw = new PrintWriter(new StringWriter());
  private static long timestamp = 1596490838000L;
  private TripLocation tripLocation1;
  private TripLocation tripLocation2;
  private JsonObject postRequestBody;
  private JsonObject putRequestBody;

  @Before
  public void setUp() throws IOException {
    helper.setEnvIsLoggedIn(true);
    helper.setEnvEmail("peter@google.com");
    helper.setEnvAuthDomain("localhost");
    helper.setUp();

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
    tripLocation1 = TripDataConverter.convertJsonObjectToTripLocation(location1, "peter@google.com");
    tripLocation2 = TripDataConverter.convertJsonObjectToTripLocation(location2, "peter@google.com");

    JsonArray locationArray = new JsonArray();
    locationArray.add(location1);
    locationArray.add(location2);
    postRequestBody.add("locations", locationArray);

    putRequestBody = postRequestBody.deepCopy();
    putRequestBody.addProperty("timestamp", timestamp);
    putRequestBody.addProperty("title", "My Trip, Updated");
  }

  @After
  public void tearDown() {
    helper.tearDown();
  }

  @Test
  public void testUnauthenticatedUserAllHttpMethods() throws IOException {
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
    servlet.doGet(request, response);
    verify(response).setContentType("application/json;");
    verify(response).getWriter();
    verify(response).setStatus(HttpServletResponse.SC_OK);
  }

  @Test
  public void testDoPost() throws IOException {
    Assert.assertEquals(0, datastore.prepare(new Query("trip")).countEntities(FetchOptions.Builder.withLimit(10)));
    Assert.assertEquals(0,
        datastore.prepare(new Query("trip-location")).countEntities(FetchOptions.Builder.withLimit(10)));
    when(request.getReader()).thenReturn(new BufferedReader(new StringReader(postRequestBody.toString())));
    servlet.doPost(request, response);
    Assert.assertEquals(1, datastore.prepare(new Query("trip")).countEntities(FetchOptions.Builder.withLimit(10)));
    Assert.assertEquals(2,
        datastore.prepare(new Query("trip-location")).countEntities(FetchOptions.Builder.withLimit(10)));
    verify(response).setStatus(HttpServletResponse.SC_CREATED);
  }

  @Test
  public void testDoPutTripExists() throws IOException {
    postPreexistingTrip();
    Entity initTrip = datastore.prepare(new Query("trip")).asSingleEntity();
    Assert.assertEquals(1, datastore.prepare(new Query("trip")).countEntities(FetchOptions.Builder.withLimit(10)));
    Assert.assertEquals(2,
        datastore.prepare(new Query("trip-location")).countEntities(FetchOptions.Builder.withLimit(10)));
    Assert.assertEquals("My Trip", initTrip.getProperty("title"));

    when(request.getReader()).thenReturn(new BufferedReader(new StringReader(putRequestBody.toString())));
    servlet.doPut(request, response);

    verify(response).setStatus(HttpServletResponse.SC_OK);
    Entity updatedTrip = datastore.prepare(new Query("trip")).asSingleEntity();
    Assert.assertEquals(1, datastore.prepare(new Query("trip")).countEntities(FetchOptions.Builder.withLimit(10)));
    Assert.assertEquals(2,
        datastore.prepare(new Query("trip-location")).countEntities(FetchOptions.Builder.withLimit(10)));
    Assert.assertEquals("My Trip, Updated", updatedTrip.getProperty("title"));
  }

  @Test
  public void testDoPutTripDoesNotExist() throws IOException {
    when(request.getReader()).thenReturn(new BufferedReader(new StringReader(putRequestBody.toString())));
    servlet.doPut(request, response);

    verify(response).setStatus(HttpServletResponse.SC_NOT_FOUND);
  }

  @Test
  public void testDoDeleteTripExists() throws IOException {
    postPreexistingTrip();
    Assert.assertEquals(1, datastore.prepare(new Query("trip")).countEntities(FetchOptions.Builder.withLimit(10)));
    Assert.assertEquals(2,
        datastore.prepare(new Query("trip-location")).countEntities(FetchOptions.Builder.withLimit(10)));

    when(request.getParameter("timestamp")).thenReturn(Long.toString(timestamp));
    servlet.doDelete(request, response);

    verify(response).setStatus(HttpServletResponse.SC_OK);
    Assert.assertEquals(0, datastore.prepare(new Query("trip")).countEntities(FetchOptions.Builder.withLimit(10)));
    Assert.assertEquals(0,
        datastore.prepare(new Query("trip-location")).countEntities(FetchOptions.Builder.withLimit(10)));
  }

  @Test
  public void testDoDeleteTripDoesNotExist() throws IOException {
    when(request.getParameter("timestamp")).thenReturn(Long.toString(timestamp));
    servlet.doDelete(request, response);

    verify(response).setStatus(HttpServletResponse.SC_NOT_FOUND);
  }

  /**
   * Sets the user as authenticated and logged in as peter@google.com, and inserts
   * the example trip modeled by postRequestBody to the Datastore.
   */
  public void postPreexistingTrip() {
    Trip trip = TripDataConverter.convertJsonObjectToTrip(postRequestBody, "peter@google.com", timestamp);
    Entity tripEntity = TripDataConverter.convertTripToEntity(trip);
    datastore.put(tripEntity);
    datastore.put(TripDataConverter.convertTripLocationToEntity(tripLocation1, tripEntity));
    datastore.put(TripDataConverter.convertTripLocationToEntity(tripLocation2, tripEntity));
  }
}