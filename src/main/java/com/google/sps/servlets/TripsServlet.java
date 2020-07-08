package com.google.sps.servlets;

import com.google.appengine.api.datastore.DatastoreService;
import com.google.appengine.api.datastore.DatastoreServiceFactory;
import com.google.appengine.api.datastore.PreparedQuery;
import com.google.appengine.api.datastore.Query;
import com.google.appengine.api.datastore.Query.FilterOperator;
import com.google.appengine.api.datastore.Query.FilterPredicate;
import com.google.appengine.api.datastore.Query.SortDirection;
import com.google.appengine.api.users.UserService;
import com.google.appengine.api.users.UserServiceFactory;
import com.google.appengine.api.datastore.Entity;
import com.google.gson.Gson;
import com.google.sps.data.Location;
import com.google.sps.data.Trip;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
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
      Query query = new Query("trip")
                    .setFilter(new FilterPredicate(Trip.ENTITY_PROPERTY_OWNER, FilterOperator.EQUAL, userEmail))
                    .addSort(Trip.ENTITY_PROPERTY_TIMESTAMP, SortDirection.DESCENDING);
      DatastoreService datastore = DatastoreServiceFactory.getDatastoreService();
      PreparedQuery results = datastore.prepare(query);

      Iterable<Entity> entityIterable = results.asIterable();
      List<Trip> userTripsResponse = new ArrayList<>();
      for (Entity entity : entityIterable) {
        userTripsResponse.add(convertEntityToTrip(entity));
      }
      response.setContentType("application/json;");
      Gson gson = new Gson();
      String serializedJSON = gson.toJson(userTripsResponse);
      response.getWriter().println(serializedJSON);
      response.setStatus(HttpServletResponse.SC_OK);
    } else {
      // send error code 401 if user is not authenticated and tries to access data
      response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
    }
  }

  @Override
  public void doPost(HttpServletRequest request, HttpServletResponse response) throws IOException {
    response.setContentType("application/json;");
    UserService userService = UserServiceFactory.getUserService();
    if (userService.isUserLoggedIn()) {
      String userEmail = userService.getCurrentUser().getEmail();
      long timestamp = System.currentTimeMillis();
      String requestData = request.getReader().lines().collect(Collectors.joining());

      Trip trip = new Gson().fromJson(requestData, Trip.class);
      
      Entity tripEntity = convertTripToEntity(trip);
      DatastoreService datastore = DatastoreServiceFactory.getDatastoreService();
     
      datastore.put(tripEntity);
      response.setStatus(HttpServletResponse.SC_OK);
    } else {
      // send error code 401 if user is not authenticated and tries to access data
      response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
    }
  }

  /**
   * Converts an Entity of kind "trip" to the value class type.
   * 
   * @param entity the entity from the Datastore containing the trip data
   * @return Trip object with corresponding fields to the entity properties
   */
  @SuppressWarnings("unchecked")
  private static Trip convertEntityToTrip(Entity entity) {
    String title = (String) entity.getProperty(Trip.ENTITY_PROPERTY_TITLE);
    List<Location> locations = (List<Location>) entity.getProperty(Trip.ENTITY_PROPERTY_LOCATIONS);
    List<String> hotels = (List<String>) entity.getProperty(Trip.ENTITY_PROPERTY_HOTELS);
    double rating = (double) entity.getProperty(Trip.ENTITY_PROPERTY_RATING);
    String description = (String) entity.getProperty(Trip.ENTITY_PROPERTY_DESCRIPTION);
    String owner = (String) entity.getProperty(Trip.ENTITY_PROPERTY_OWNER);
    boolean isPublic = (boolean) entity.getProperty(Trip.ENTITY_PROPERTY_PUBLIC);
    long timestamp = (long) entity.getProperty(Trip.ENTITY_PROPERTY_TIMESTAMP);

    return Trip.builder()
            .setTitle(title)
            .setLocations(locations == null ? new ArrayList<Location>() : locations)
            .setHotels(hotels == null ? new ArrayList<String>() : hotels)
            .setRating(rating)
            .setDescription(description)
            .setOwner(owner)
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
  private static Entity convertTripToEntity(Trip trip) {
    Entity tripEntity = new Entity("trip");
    tripEntity.setProperty(Trip.ENTITY_PROPERTY_TITLE, trip.title());
    tripEntity.setProperty(Trip.ENTITY_PROPERTY_LOCATIONS, trip.locations());
    tripEntity.setProperty(Trip.ENTITY_PROPERTY_HOTELS, trip.hotels());
    tripEntity.setProperty(Trip.ENTITY_PROPERTY_RATING, trip.rating());
    tripEntity.setProperty(Trip.ENTITY_PROPERTY_DESCRIPTION, trip.description());
    tripEntity.setProperty(Trip.ENTITY_PROPERTY_OWNER, trip.owner());
    tripEntity.setProperty(Trip.ENTITY_PROPERTY_PUBLIC, trip.isPublic());
    tripEntity.setProperty(Trip.ENTITY_PROPERTY_TIMESTAMP, trip.timestamp());
    return tripEntity;
  }
}