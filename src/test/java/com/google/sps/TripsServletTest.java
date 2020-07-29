package com.google.sps;

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
  public final LocalServiceTestHelper helper = new LocalServiceTestHelper(new LocalDatastoreServiceTestConfig());

  @Before
  public void setUp() {
    helper.setUp();
  }

  @After
  public void tearDown() {
    helper.tearDown();
  }

  @Test
  public void testValidTripFromEntity() {
    Entity tripEntity = new Entity("trip");
    tripEntity.setProperty(Trip.ENTITY_PROPERTY_TITLE, "foo trip");
    tripEntity.setProperty(Trip.ENTITY_PROPERTY_HOTEL_ID, "24234235");
    tripEntity.setProperty(Trip.ENTITY_PROPERTY_HOTEL_NAME, "SF Hotel");
    tripEntity.setProperty(Trip.ENTITY_PROPERTY_HOTEL_IMAGE, "https://photos.google.com/hotel.png");
    tripEntity.setProperty(Trip.ENTITY_PROPERTY_RATING, 4.5);
    tripEntity.setProperty(Trip.ENTITY_PROPERTY_DESCRIPTION, "lorem ipsummmm");
    tripEntity.setProperty(Trip.ENTITY_PROPERTY_OWNER, "peter@email.com");
    tripEntity.setProperty(Trip.ENTITY_PROPERTY_PAST_TRIP, false);
    tripEntity.setProperty(Trip.ENTITY_PROPERTY_PUBLIC, true);
    tripEntity.setProperty(Trip.ENTITY_PROPERTY_TIMESTAMP, 3942943923949L);
    Trip trip = TripDataConverter.convertEntityToTrip(tripEntity);

    Assert.assertEquals("foo trip", trip.title());
    Assert.assertEquals("24234235", trip.hotelID());
    Assert.assertEquals("SF Hotel", trip.hotelName());
    Assert.assertEquals("https://photos.google.com/hotel.png", trip.hotelImage());
    Assert.assertEquals(4.5, trip.rating(), 0.001);
    Assert.assertEquals("lorem ipsummmm", trip.description());
    Assert.assertEquals("peter@email.com", trip.owner());
    Assert.assertEquals(false, trip.isPastTrip());
    Assert.assertEquals(true, trip.isPublic());
    Assert.assertEquals(3942943923949L, trip.timestamp());
  }
}