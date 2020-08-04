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
import com.google.appengine.tools.development.testing.LocalDatastoreServiceTestConfig;
import com.google.appengine.tools.development.testing.LocalServiceTestHelper;
import com.google.gson.JsonObject;
import com.google.sps.data.Trip;
import com.google.sps.data.TripLocation;
import com.google.sps.servlets.TripsNetworkServlet;
import com.google.sps.util.TripDataConverter;

import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.junit.runners.JUnit4;

@RunWith(JUnit4.class)
public class TripsNetworkServletTest {
  private LocalServiceTestHelper helper = new LocalServiceTestHelper(new LocalDatastoreServiceTestConfig());
  private DatastoreService datastore = DatastoreServiceFactory.getDatastoreService();
  private TripsNetworkServlet servlet = new TripsNetworkServlet();
  private HttpServletRequest request = mock(HttpServletRequest.class);
  private HttpServletResponse response = mock(HttpServletResponse.class);
  private PrintWriter pw = new PrintWriter(new StringWriter());
  private static long publicTripTimestamp = 1596490838000L;
  private static long plannedTripTimestamp = 1596491833000L;
  private static long badTimestamp = 123123123123L;
  private Trip trip1Public;
  private Trip trip2Planned;

  @Before
  public void setUp() throws IOException {
    when(response.getWriter()).thenReturn(pw);
    helper.setEnvIsLoggedIn(true);
    helper.setEnvEmail("peter@google.com");
    helper.setEnvAuthDomain("localhost");
    helper.setUp();

    // Put one public trip and one non-past, non-public trip in the Datastore.
    trip1Public = Trip.builder()
                    .setTitle("A publicized trip")
                    .setDescription("Lorem ipsum dolor, sit, amet.")
                    .setHotelID("h0t3l_iD")
                    .setHotelImage("iMg")
                    .setHotelName("Publicized Hotel")
                    .setIsPastTrip(true)
                    .setIsPublic(true)
                    .setOwner("peter@google.com")
                    .setRating(4.5)
                    .setTimestamp(publicTripTimestamp)
                    .build();
    TripLocation trip1Location1 = TripLocation.create("abc", "Googleplex", 1, "peter@google.com");
    trip2Planned = Trip.builder()
                    .setTitle("A planned trip")
                    .setHotelID("pl4nn3d")
                    .setHotelImage("xYz")
                    .setHotelName("Planned Hotel")
                    .setIsPastTrip(false)
                    .setOwner("josh@google.com")
                    .setTimestamp(plannedTripTimestamp)
                    .build();
    TripLocation trip2Location1 = TripLocation.create("def", "Google NYC", 2, "josh@google.com");

    Entity trip1Entity = TripDataConverter.convertTripToEntity(trip1Public);
    Entity trip2Entity = TripDataConverter.convertTripToEntity(trip2Planned);
    datastore.put(trip1Entity);
    datastore.put(TripDataConverter.convertTripLocationToEntity(trip1Location1, trip1Entity));
    datastore.put(trip2Entity);
    datastore.put(TripDataConverter.convertTripLocationToEntity(trip2Location1, trip2Entity));
  }

  @Test
  public void testUnauthenticatedUser() throws IOException {
    helper.setEnvIsLoggedIn(false);

    servlet.doGet(request, response);
    servlet.doPost(request, response);
    servlet.doPut(request, response);
    verify(response, times(3)).setStatus(HttpServletResponse.SC_UNAUTHORIZED);
  }

  @Test
  public void testDoGet() throws IOException {
    servlet.doGet(request, response);
    verify(response).setContentType("application/json");
    verify(response).getWriter();
    verify(response).setStatus(HttpServletResponse.SC_OK);
  }

  @Test
  public void testDoPutExists() throws IOException {
    when(request.getParameter("timestamp")).thenReturn(Long.toString(plannedTripTimestamp));

    servlet.doPut(request, response);
    verify(response).setStatus(HttpServletResponse.SC_OK);
  }

  @Test
  public void testDoPutDoesNotExist() throws IOException {
    when(request.getParameter("timestamp")).thenReturn(Long.toString(badTimestamp));

    servlet.doPut(request, response);
    verify(response).setStatus(HttpServletResponse.SC_NOT_FOUND);
  }

  @Test
  public void testDoPostExists() throws IOException {
    testDoPutExists();
    JsonObject requestBody = new JsonObject();
    requestBody.addProperty("timestamp", plannedTripTimestamp);
    requestBody.addProperty("rating", 3);
    requestBody.addProperty("description", "This trip is now a past trip and being posted/made public");
    when(request.getReader()).thenReturn(new BufferedReader(new StringReader(requestBody.toString())));
    servlet.doPost(request, response);
    verify(response, times(2)).setStatus(HttpServletResponse.SC_OK);
  }

  @Test
  public void testDoPostDoesNotExist() throws IOException {
    JsonObject requestBody = new JsonObject();
    requestBody.addProperty("timestamp", badTimestamp);
    requestBody.addProperty("rating", 3);
    requestBody.addProperty("description", "This trip was okay, but it DNE");
    when(request.getReader()).thenReturn(new BufferedReader(new StringReader(requestBody.toString())));
    servlet.doPost(request, response);
    verify(response).setStatus(HttpServletResponse.SC_NOT_FOUND);
  }

  @Test
  public void testDoPostPreconditionFailed() throws IOException {
    JsonObject requestBody = new JsonObject();
    requestBody.addProperty("timestamp", plannedTripTimestamp);
    requestBody.addProperty("rating", 3);
    requestBody.addProperty("description", "This trip is still planned, so we can't post it to the network");
    when(request.getReader()).thenReturn(new BufferedReader(new StringReader(requestBody.toString())));
    servlet.doPost(request, response);
    verify(response).setStatus(HttpServletResponse.SC_PRECONDITION_FAILED);
  }

  @After
  public void tearDown() {
    helper.tearDown();
  }
}