package com.google.sps.servlets;

import com.google.appengine.api.datastore.DatastoreService;
import com.google.appengine.api.datastore.DatastoreServiceFactory;
import com.google.appengine.api.datastore.PreparedQuery;
import com.google.appengine.api.datastore.Query;
import com.google.appengine.api.datastore.Query.FilterOperator;
import com.google.appengine.api.datastore.Query.FilterPredicate;
import com.google.appengine.api.users.UserService;
import com.google.appengine.api.users.UserServiceFactory;
import com.google.appengine.api.datastore.Entity;
import com.google.appengine.api.datastore.Key;
import com.google.gson.Gson;
import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import com.google.sps.data.TripLocation;
import com.google.sps.data.Trip;
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
    UserService userService = UserServiceFactory.getUserService();
    if (userService.isUserLoggedIn()) {
      String userEmail = userService.getCurrentUser().getEmail();
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
    } else {
      // send error code 401 if user is not authenticated and tries to access data
      response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
    }
  }

  @Override
  public void doPut(HttpServletRequest request, HttpServletResponse response) throws IOException {
    UserService userService = UserServiceFactory.getUserService();
    if (!userService.isUserLoggedIn()) {
      response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
    }
    String userEmail = userService.getCurrentUser().getEmail();
    
    
    String requestBody = request.getReader().lines().collect(Collectors.joining(System.lineSeparator()));
    JsonObject jsonObject = JsonParser.parseString(requestBody).getAsJsonObject();

    // true if the client is attempting to do an update, false if insert
    boolean isUpdating = jsonObject.has("timestamp");
    long timestamp = isUpdating ? jsonObject.getAsJsonPrimitive(Trip.ENTITY_PROPERTY_TIMESTAMP).getAsLong() : System.currentTimeMillis();
    Trip trip = Trip.builder()
      .setTitle(jsonObject.getAsJsonPrimitive(Trip.ENTITY_PROPERTY_TITLE).getAsString())
      .setHotelID(jsonObject.getAsJsonPrimitive(Trip.ENTITY_PROPERTY_HOTEL_ID).getAsString())
      .setHotelName(jsonObject.getAsJsonPrimitive(Trip.ENTITY_PROPERTY_HOTEL_NAME).getAsString())
      .setHotelImage(jsonObject.getAsJsonPrimitive(Trip.ENTITY_PROPERTY_HOTEL_IMAGE).getAsString())
      .setRating(jsonObject.getAsJsonPrimitive(Trip.ENTITY_PROPERTY_RATING).getAsDouble())
      .setOwner(userEmail)
      .setTimestamp(timestamp)
      .build();
    Entity tripEntity = convertTripToEntity(trip);
    DatastoreService datastore = DatastoreServiceFactory.getDatastoreService();
    if(isUpdating) {
      Query tripQuery = new Query("trip")
                          .setFilter(new FilterPredicate(Trip.ENTITY_PROPERTY_OWNER, FilterOperator.EQUAL, userEmail))
                          .setFilter(new FilterPredicate(Trip.ENTITY_PROPERTY_TIMESTAMP, FilterOperator.EQUAL, timestamp));
      Query tripLocationsQuery = new Query("trip-location")
                                    .setFilter(new FilterPredicate(TripLocation.ENTITY_PROPERTY_OWNER, FilterOperator.EQUAL, userEmail));
      PreparedQuery tripResults = datastore.prepare(tripQuery);
      PreparedQuery tripLocationResults = datastore.prepare(tripLocationsQuery);
      Iterable<Entity> tripEntityIterable = tripResults.asIterable();
      Iterable<Entity> tripLocationEntityIterable = tripLocationResults.asIterable();
      
      response.setStatus(HttpServletResponse.SC_OK);
    } else {
      datastore.put(tripEntity);

      // build TripLocation objects from request data and put them in Datastore
      JsonArray locationData = jsonObject.getAsJsonArray("locations");
      Iterator<JsonElement> locationIterator = locationData.iterator();
      
      while(locationIterator.hasNext()) {
        JsonObject curr = locationIterator.next().getAsJsonObject();
        String placeID = curr.getAsJsonPrimitive("id").getAsString();
        String placeName = curr.getAsJsonPrimitive("name").getAsString();
        int weight = curr.getAsJsonPrimitive("weight").getAsInt();
        TripLocation location = TripLocation.create(placeID, placeName, weight, userEmail);
        datastore.put(convertTripLocationToEntity(location, tripEntity));
      }

      response.setStatus(HttpServletResponse.SC_CREATED);
    }
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
}