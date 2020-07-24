package com.google.sps.servlets;

import com.google.appengine.api.datastore.DatastoreService;
import com.google.appengine.api.datastore.DatastoreServiceFactory;
import com.google.appengine.api.datastore.PreparedQuery;
import com.google.appengine.api.datastore.Query;
import com.google.appengine.api.datastore.Transaction;
import com.google.appengine.api.datastore.TransactionOptions;
import com.google.appengine.api.datastore.Query.FilterOperator;
import com.google.appengine.api.datastore.Query.FilterPredicate;
import com.google.appengine.api.users.UserService;
import com.google.appengine.api.users.UserServiceFactory;
import com.google.common.collect.Iterables;
import com.google.appengine.api.datastore.Entity;
import com.google.appengine.api.datastore.Key;
import com.google.gson.Gson;
import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import com.google.sps.data.TripLocation;
import com.google.sps.data.Trip;
import com.google.sps.util.BodyParser;
import com.google.sps.util.AuthChecker;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

/**
 * Servlet allowing for creation of trips and adding them to the Datastore and
 * querying existing trips data for a user.
 */
@WebServlet("/trip-data")
public class TripsServlet extends HttpServlet {
  @Override
  public void doGet(HttpServletRequest request, HttpServletResponse response) throws IOException {
    String userEmail = AuthChecker.getUserEmail(response);
    if (userEmail == null) {
      return;
    }
    Query tripQuery = new Query("trip")
                      .setFilter(new FilterPredicate(Trip.ENTITY_PROPERTY_OWNER, FilterOperator.EQUAL, userEmail));
    Query tripLocationsQuery = new Query("trip-location")
                                .setFilter(new FilterPredicate(TripLocation.ENTITY_PROPERTY_OWNER, FilterOperator.EQUAL, userEmail));
    DatastoreService datastore = DatastoreServiceFactory.getDatastoreService();
    PreparedQuery tripResults = datastore.prepare(tripQuery);
    PreparedQuery tripLocationResults = datastore.prepare(tripLocationsQuery);
    Iterable<Entity> tripEntityIterable = tripResults.asIterable();
    Iterable<Entity> tripLocationEntityIterable = tripLocationResults.asIterable();
    
    // Convert trip location iterable to HashMap with mapping from timestamp to TripLocation object
    // Provides easy O(1) lookup of locations for a certain trip.
    Map<Key, List<TripLocation>> tripLocationMap = new HashMap<>();
    for(Entity entity : tripLocationEntityIterable) {
      TripLocation location = convertEntityToTripLocation(entity);
      if(tripLocationMap.containsKey(entity.getParent())) {
        List<TripLocation> locationsUnderCurrTrip = tripLocationMap.get(entity.getParent());
        locationsUnderCurrTrip.add(location);
        tripLocationMap.replace(entity.getParent(), locationsUnderCurrTrip);
      } else {
        tripLocationMap.put(entity.getParent(), new ArrayList<>(Arrays.asList(location)));
      }
    }

    // Get list of trips without their corresponding locations
    Map<Trip, List<TripLocation>> userTripsDataResponse = new HashMap<>();
    for (Entity entity : tripEntityIterable) {
      Trip trip = convertEntityToTrip(entity);
      userTripsDataResponse.put(trip, tripLocationMap.get(entity.getKey()));
    }

    response.setContentType("application/json;");
    Gson gson = new Gson();
    String serializedJSON = gson.toJson(userTripsDataResponse);
    response.getWriter().println(serializedJSON);
    response.setStatus(HttpServletResponse.SC_OK); 
  }

  @Override
  public void doPost(HttpServletRequest request, HttpServletResponse response) throws IOException {
    String userEmail = AuthChecker.getUserEmail(response);
    if (userEmail == null) {
      return;
    }
    JsonObject jsonObject = BodyParser.parseJsonObjectFromRequest(request);
    long timestamp = System.currentTimeMillis();
    
    Trip trip = convertJsonObjectToTrip(jsonObject, userEmail, timestamp);
    Entity tripEntity = convertTripToEntity(trip);

    DatastoreService datastore = DatastoreServiceFactory.getDatastoreService();
    TransactionOptions options = TransactionOptions.Builder.withXG(true);
    Transaction txn = datastore.beginTransaction(options);
    try {
      datastore.put(txn, tripEntity);

      JsonArray locationData = jsonObject.getAsJsonArray("locations");
      Iterator<JsonElement> locationIterator = locationData.iterator();

      while(locationIterator.hasNext()) {
        TripLocation location = convertJsonObjectToTripLocation(locationIterator.next().getAsJsonObject(), userEmail);
        datastore.put(txn, convertTripLocationToEntity(location, tripEntity));
      };
    
      txn.commit();
    } finally {
      if (txn.isActive()) {
        txn.rollback();
        response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
      } else {
        response.setStatus(HttpServletResponse.SC_CREATED);
      }
    }
  }

  @Override
  public void doPut(HttpServletRequest request, HttpServletResponse response) throws IOException {
    String userEmail = AuthChecker.getUserEmail(response);
    if (userEmail == null) {
      return;
    }
    
    JsonObject jsonObject = BodyParser.parseJsonObjectFromRequest(request);
    long timestamp = jsonObject.getAsJsonPrimitive(Trip.ENTITY_PROPERTY_TIMESTAMP).getAsLong();
    
    Trip trip = convertJsonObjectToTrip(jsonObject, userEmail, timestamp);
    Entity tripEntity = convertTripToEntity(trip);

    DatastoreService datastore = DatastoreServiceFactory.getDatastoreService();
    TransactionOptions options = TransactionOptions.Builder.withXG(true);
    Transaction txn = datastore.beginTransaction(options);
    try {
      Query tripQuery = new Query("trip")
                        .setFilter(new FilterPredicate(Trip.ENTITY_PROPERTY_OWNER, FilterOperator.EQUAL, userEmail))
                        .setFilter(new FilterPredicate(Trip.ENTITY_PROPERTY_TIMESTAMP, FilterOperator.EQUAL, timestamp));
      
      Iterable<Entity> tripEntityIterable = datastore.prepare(tripQuery).asIterable();
      if (Iterables.size(tripEntityIterable) == 0) {
        /* If we reach this breakpoint, that means no Trip matches the timestamp 
            to be updated. Send back an error code 404. */
        response.setStatus(HttpServletResponse.SC_NOT_FOUND);
        return;
      }
      Entity existingTrip = tripEntityIterable.iterator().next();
      Query tripLocationsQuery = new Query("trip-location")
                                  .setAncestor(existingTrip.getKey());
      Iterable<Entity> tripLocationEntityIterable = datastore.prepare(tripLocationsQuery).asIterable();

      // delete current data relating to Trip
      datastore.delete(txn, existingTrip.getKey());
      for (Entity tripLocationEntity : tripLocationEntityIterable) {
        datastore.delete(txn, tripLocationEntity.getKey());
      }

      datastore.put(txn, tripEntity);
      // build TripLocation objects from request data and put them in Datastore
      JsonArray locationData = jsonObject.getAsJsonArray("locations");
      Iterator<JsonElement> locationIterator = locationData.iterator();
      
      while(locationIterator.hasNext()) {
        TripLocation location = convertJsonObjectToTripLocation(locationIterator.next().getAsJsonObject(), userEmail);
        datastore.put(txn, convertTripLocationToEntity(location, tripEntity));
      }
    
      txn.commit();
    } finally {
      if (txn.isActive()) {
        txn.rollback();
        response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
      } else {
        response.setStatus(HttpServletResponse.SC_OK);
      }
    }
  }

  @Override
  public void doDelete(HttpServletRequest request, HttpServletResponse response) throws IOException {
    String userEmail = AuthChecker.getUserEmail(response);
    if (userEmail == null) {
      return;
    }
    long timestamp = Long.parseLong(request.getParameter("timestamp"));
    DatastoreService datastore = DatastoreServiceFactory.getDatastoreService();

    Query tripQuery = new Query("trip")
                        .setFilter(new FilterPredicate(Trip.ENTITY_PROPERTY_OWNER, FilterOperator.EQUAL, userEmail))
                        .setFilter(new FilterPredicate(Trip.ENTITY_PROPERTY_TIMESTAMP, FilterOperator.EQUAL, timestamp));
    Iterable<Entity> tripEntityIterable =  datastore.prepare(tripQuery).asIterable();

    if (Iterables.size(tripEntityIterable) == 0) {
      /* If we reach this breakpoint, that means no Trip matches the timestamp 
         to be deleted. Send back an error code 404. */
      response.setStatus(HttpServletResponse.SC_NOT_FOUND);
      return;
    }

    Iterator<Entity> iterator = tripEntityIterable.iterator();
    Key parentTripKey = iterator.next().getKey();

    // Get all trip locations with the trip to be deleted as their parent
    Query tripLocationsQuery = new Query("trip-location").setAncestor(parentTripKey);
    Iterable<Entity> tripLocationEntityIterable = datastore.prepare(tripLocationsQuery).asIterable();
    datastore.delete(parentTripKey);

    for (Entity tripLocationEntity : tripLocationEntityIterable) {
      datastore.delete(tripLocationEntity.getKey());
    }
    response.setStatus(HttpServletResponse.SC_OK);
  }

  /**
   * Converts a JsonObject with certain fields to its corresponding Trip value class.
   * @param jsonObject Object with fields for title, hotel ID, hotel name, hotel
   *                   photo ref, and rating.
   * @param userEmail
   * @param timestamp
   * @return Trip with corresponding fields to the JsonObject and params
   */
  private static Trip convertJsonObjectToTrip(JsonObject jsonObject, String userEmail, long timestamp) {
    return Trip.builder()
            .setTitle(jsonObject.getAsJsonPrimitive(Trip.ENTITY_PROPERTY_TITLE).getAsString())
            .setHotelID(jsonObject.getAsJsonPrimitive(Trip.ENTITY_PROPERTY_HOTEL_ID).getAsString())
            .setHotelName(jsonObject.getAsJsonPrimitive(Trip.ENTITY_PROPERTY_HOTEL_NAME).getAsString())
            .setHotelImage(jsonObject.getAsJsonPrimitive(Trip.ENTITY_PROPERTY_HOTEL_IMAGE).getAsString())
            .setRating(jsonObject.getAsJsonPrimitive(Trip.ENTITY_PROPERTY_RATING).getAsDouble())
            .setOwner(userEmail)
            .setTimestamp(timestamp)
            .build();
  }

  /**
   * Converts a JsonObject with certain fields to its corresponding TripLocation value class.
   * @param jsonObject Object with fields for id, name, and weight
   * @param userEmail
   * @return TripLocation with corresponding fields to the JsonObject and param
   */
  private static TripLocation convertJsonObjectToTripLocation(JsonObject jsonObject, String userEmail) {
    String placeID = jsonObject.getAsJsonPrimitive("id").getAsString();
    String placeName = jsonObject.getAsJsonPrimitive("name").getAsString();
    int weight = jsonObject.getAsJsonPrimitive("weight").getAsInt();
    return TripLocation.create(placeID, placeName, weight, userEmail);
  }

  /**
   * Converts an Entity of kind "trip" to the value class type.
   * 
   * @param entity the entity from the Datastore containing the trip data
   * @return Trip object with corresponding fields to the entity properties
   */
  public static Trip convertEntityToTrip(Entity entity) {
    String title = (String) entity.getProperty(Trip.ENTITY_PROPERTY_TITLE);
    String hotelID = (String) entity.getProperty(Trip.ENTITY_PROPERTY_HOTEL_ID);
    String hotelName = (String) entity.getProperty(Trip.ENTITY_PROPERTY_HOTEL_NAME);
    String hotelImage = (String) entity.getProperty(Trip.ENTITY_PROPERTY_HOTEL_IMAGE);
    double rating = (double) entity.getProperty(Trip.ENTITY_PROPERTY_RATING);
    String description = (String) entity.getProperty(Trip.ENTITY_PROPERTY_DESCRIPTION);
    String owner = (String) entity.getProperty(Trip.ENTITY_PROPERTY_OWNER);
    boolean isPastTrip = (boolean) entity.getProperty(Trip.ENTITY_PROPERTY_PAST_TRIP);
    boolean isPublic = (boolean) entity.getProperty(Trip.ENTITY_PROPERTY_PUBLIC);
    long timestamp = (long) entity.getProperty(Trip.ENTITY_PROPERTY_TIMESTAMP);

    return Trip.builder()
            .setTitle(title)
            .setHotelID(hotelID)
            .setHotelName(hotelName)
            .setHotelImage(hotelImage)
            .setRating(rating)
            .setDescription(description)
            .setOwner(owner)
            .setIsPastTrip(isPastTrip)
            .setIsPublic(isPublic)
            .setTimestamp(timestamp)
            .build();
  }

   /**
   * Converts a certain Trip object to a corresponding Entity object.
   * 
   * @param trip the Trip object to be converted
   * @return Entity object with matching property values
   */
  public static Entity convertTripToEntity(Trip trip) {
    Entity tripEntity = new Entity("trip");
    tripEntity.setProperty(Trip.ENTITY_PROPERTY_TITLE, trip.title());
    tripEntity.setProperty(Trip.ENTITY_PROPERTY_HOTEL_ID, trip.hotelID());
    tripEntity.setProperty(Trip.ENTITY_PROPERTY_HOTEL_NAME, trip.hotelName());
    tripEntity.setProperty(Trip.ENTITY_PROPERTY_HOTEL_IMAGE, trip.hotelImage());
    tripEntity.setProperty(Trip.ENTITY_PROPERTY_RATING, trip.rating());
    tripEntity.setProperty(Trip.ENTITY_PROPERTY_DESCRIPTION, trip.description());
    tripEntity.setProperty(Trip.ENTITY_PROPERTY_OWNER, trip.owner());
    tripEntity.setProperty(Trip.ENTITY_PROPERTY_PAST_TRIP, trip.isPastTrip());
    tripEntity.setProperty(Trip.ENTITY_PROPERTY_PUBLIC, trip.isPublic());
    tripEntity.setProperty(Trip.ENTITY_PROPERTY_TIMESTAMP, trip.timestamp());
    return tripEntity;
  }

  /**
   * Converts an Entity of kind "trip-location" to the value class type.
   * 
   * @param entity the entity from Datastore containing TripLocation data
   * @return TripLocation object with corresponding fields to the entity
   */
  public static TripLocation convertEntityToTripLocation(Entity entity) {
    String placeID = (String) entity.getProperty(TripLocation.ENTITY_PROPERTY_PLACE_ID);
    String placeName = (String) entity.getProperty(TripLocation.ENTITY_PROPERTY_PLACE_NAME);
    int weight = Math.toIntExact((long) entity.getProperty(TripLocation.ENTITY_PROPERTY_WEIGHT));
    String owner = (String) entity.getProperty(TripLocation.ENTITY_PROPERTY_OWNER);
    return TripLocation.create(placeID, placeName, weight, owner);
  }

  /**
   * Converts a certain TripLocation object to a corresponding Entity object.
   * 
   * @param location the TripLocation object to be converted
   * @param parent   the parent Trip holding these locations
   * @return Entity object with matching property values
   */
  public static Entity convertTripLocationToEntity(TripLocation location, Entity parent) {
    Entity tripLocationEntity = new Entity("trip-location", parent.getKey());
    tripLocationEntity.setProperty(TripLocation.ENTITY_PROPERTY_PLACE_ID, location.placeID());
    tripLocationEntity.setProperty(TripLocation.ENTITY_PROPERTY_PLACE_NAME, location.placeName());
    tripLocationEntity.setProperty(TripLocation.ENTITY_PROPERTY_WEIGHT, location.weight());
    tripLocationEntity.setProperty(TripLocation.ENTITY_PROPERTY_OWNER, location.owner());
    return tripLocationEntity;
  }
}