package com.google.sps;

import com.google.appengine.api.datastore.Entity;
import com.google.appengine.tools.development.testing.LocalDatastoreServiceTestConfig;
import com.google.appengine.tools.development.testing.LocalServiceTestHelper;
import com.google.gson.JsonObject;
import com.google.sps.data.Trip;
import com.google.sps.data.TripLocation;
import com.google.sps.util.TripDataConverter;

import org.junit.After;
import org.junit.Assert;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.junit.runners.JUnit4;

@RunWith(JUnit4.class)
public class TripDataConverterTest {
  private final LocalServiceTestHelper helper = new LocalServiceTestHelper(new LocalDatastoreServiceTestConfig());
  private static final String USER_EMAIL = "peter@google.com";
  private static final long TIMESTAMP = 3942943923949L;
  private static final String TRIP_TITLE = "foo trip";
  private static final String HOTEL_ID = "24234235";
  private static final String HOTEL_NAME = "Google Hotel";
  private static final double TRIP_RATING = 4.5;
  private static final String TRIP_DESCRIPTION = "Lorem ipsum dolor.";
  private static final String HOTEL_IMAGE_REF = "aBcXyZ1CABAbCABcabC";
  private static final boolean IS_TRIP_PAST_TRIP = true;
  private static final boolean IS_TRIP_PUBLIC = true;

  private static final String LOCATION_ID = "aBcXyZ";
  private static final String LOCATION_NAME = "Googleplex";
  private static final int LOCATION_WEIGHT = 4;

  private Entity tripEntity;
  private Trip trip;
  private JsonObject tripObject;

  private Entity tripLocationEntity;
  private TripLocation tripLocation;
  private JsonObject tripLocationObject;

  @Before
  public void setUp() {
    helper.setUp();
    tripEntity = new Entity("trip");
    tripEntity.setProperty(Trip.ENTITY_PROPERTY_TITLE, TRIP_TITLE);
    tripEntity.setProperty(Trip.ENTITY_PROPERTY_HOTEL_ID, HOTEL_ID);
    tripEntity.setProperty(Trip.ENTITY_PROPERTY_HOTEL_NAME, HOTEL_NAME);
    tripEntity.setProperty(Trip.ENTITY_PROPERTY_HOTEL_IMAGE, HOTEL_IMAGE_REF);
    tripEntity.setProperty(Trip.ENTITY_PROPERTY_RATING, TRIP_RATING);
    tripEntity.setProperty(Trip.ENTITY_PROPERTY_DESCRIPTION, TRIP_DESCRIPTION);
    tripEntity.setProperty(Trip.ENTITY_PROPERTY_OWNER, USER_EMAIL);
    tripEntity.setProperty(Trip.ENTITY_PROPERTY_PAST_TRIP, IS_TRIP_PAST_TRIP);
    tripEntity.setProperty(Trip.ENTITY_PROPERTY_PUBLIC, IS_TRIP_PUBLIC);
    tripEntity.setProperty(Trip.ENTITY_PROPERTY_TIMESTAMP, TIMESTAMP);

    trip = Trip.builder()
            .setTitle(TRIP_TITLE)
            .setHotelID(HOTEL_ID)
            .setHotelName(HOTEL_NAME)
            .setHotelImage(HOTEL_IMAGE_REF)
            .setRating(TRIP_RATING)
            .setDescription(TRIP_DESCRIPTION)
            .setOwner(USER_EMAIL)
            .setIsPastTrip(IS_TRIP_PAST_TRIP)
            .setIsPublic(IS_TRIP_PUBLIC)
            .setTimestamp(TIMESTAMP)
            .build();

    tripObject = new JsonObject();
    tripObject.addProperty(Trip.ENTITY_PROPERTY_TITLE, TRIP_TITLE);
    tripObject.addProperty(Trip.ENTITY_PROPERTY_HOTEL_ID, HOTEL_ID);
    tripObject.addProperty(Trip.ENTITY_PROPERTY_HOTEL_NAME, HOTEL_NAME);
    tripObject.addProperty(Trip.ENTITY_PROPERTY_HOTEL_IMAGE, HOTEL_IMAGE_REF);
    tripObject.addProperty(Trip.ENTITY_PROPERTY_RATING, TRIP_RATING);

    tripLocationEntity = new Entity("trip-location");
    tripLocationEntity.setProperty(TripLocation.ENTITY_PROPERTY_PLACE_ID, LOCATION_ID);
    tripLocationEntity.setProperty(TripLocation.ENTITY_PROPERTY_PLACE_NAME, LOCATION_NAME);
    tripLocationEntity.setProperty(TripLocation.ENTITY_PROPERTY_WEIGHT, 4L);
    tripLocationEntity.setProperty(TripLocation.ENTITY_PROPERTY_OWNER, USER_EMAIL);

    tripLocation = TripLocation.create(LOCATION_ID, LOCATION_NAME, LOCATION_WEIGHT, USER_EMAIL);

    tripLocationObject = new JsonObject();
    tripLocationObject.addProperty("id", LOCATION_ID);
    tripLocationObject.addProperty("name", LOCATION_NAME);
    tripLocationObject.addProperty("weight", LOCATION_WEIGHT);
  }

  @After
  public void tearDown() {
    helper.tearDown();
  }

  @Test
  public void testValidTripFromJsonObject() {
    Trip result = TripDataConverter.convertJsonObjectToTrip(tripObject, USER_EMAIL, TIMESTAMP);
    Assert.assertEquals(TRIP_TITLE, result.title());
    Assert.assertEquals(HOTEL_ID, result.hotelID());
    Assert.assertEquals(HOTEL_NAME, result.hotelName());
    Assert.assertEquals(HOTEL_IMAGE_REF, result.hotelImage());
    Assert.assertEquals(TRIP_RATING, result.rating(), 0.01);
    Assert.assertEquals(USER_EMAIL, result.owner());
    Assert.assertEquals(TIMESTAMP, result.timestamp());
  }

  @Test
  public void testValidTripLocationFromJsonObject() {
    TripLocation result = TripDataConverter.convertJsonObjectToTripLocation(tripLocationObject, USER_EMAIL);
    Assert.assertEquals(tripLocation, result);
  }

  @Test
  public void testValidTripFromEntity() {
    Trip result = TripDataConverter.convertEntityToTrip(tripEntity);
    Assert.assertEquals(trip, result);
  }

  @Test
  public void testValidEntityFromTrip() {
    Entity result = TripDataConverter.convertTripToEntity(trip);
    Assert.assertEquals(tripEntity.getProperties(), result.getProperties());
  }

  @Test
  public void testValidTripLocationFromEntity() {
    TripLocation result = TripDataConverter.convertEntityToTripLocation(tripLocationEntity);
    Assert.assertEquals(tripLocation, result);
  }

  @Test
  public void testValidEntityFromTripLocation() {
    Entity result = TripDataConverter.convertTripLocationToEntity(tripLocation, tripEntity);
    Assert.assertEquals(LOCATION_ID, result.getProperty(TripLocation.ENTITY_PROPERTY_PLACE_ID));
    Assert.assertEquals(LOCATION_NAME, result.getProperty(TripLocation.ENTITY_PROPERTY_PLACE_NAME));
    Assert.assertEquals(LOCATION_WEIGHT, result.getProperty(TripLocation.ENTITY_PROPERTY_WEIGHT));
    Assert.assertEquals(USER_EMAIL, result.getProperty(TripLocation.ENTITY_PROPERTY_OWNER));
    Assert.assertEquals(tripEntity.getKey(), result.getParent());
  }
}