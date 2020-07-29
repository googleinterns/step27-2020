package com.google.sps.servlets;

import com.google.appengine.api.datastore.DatastoreService;
import com.google.appengine.api.datastore.DatastoreServiceFactory;
import com.google.appengine.api.datastore.PreparedQuery;
import com.google.appengine.api.datastore.Query;
import com.google.appengine.api.datastore.Transaction;
import com.google.appengine.api.datastore.TransactionOptions;
import com.google.appengine.api.datastore.Query.FilterOperator;
import com.google.appengine.api.datastore.Query.FilterPredicate;
import com.google.common.collect.Iterables;
import com.google.appengine.api.datastore.Entity;
import com.google.appengine.api.datastore.Key;
import com.google.gson.Gson;
import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.sps.data.TripLocation;
import com.google.sps.data.Trip;
import com.google.sps.util.BodyParser;
import com.google.sps.util.AuthChecker;
import com.google.sps.util.TripDataConverter;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;

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

    // Convert trip location iterable to HashMap with mapping from timestamp to
    // TripLocation object
    // Provides easy O(1) lookup of locations for a certain trip.
    Map<Key, List<TripLocation>> tripLocationMap = new HashMap<>();
    for (Entity entity : tripLocationEntityIterable) {
      TripLocation location = TripDataConverter.convertEntityToTripLocation(entity);
      if (tripLocationMap.containsKey(entity.getParent())) {
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
      Trip trip = TripDataConverter.convertEntityToTrip(entity);
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

    Trip trip = TripDataConverter.convertJsonObjectToTrip(jsonObject, userEmail, timestamp);
    Entity tripEntity = TripDataConverter.convertTripToEntity(trip);

    DatastoreService datastore = DatastoreServiceFactory.getDatastoreService();
    TransactionOptions options = TransactionOptions.Builder.withXG(true);
    Transaction txn = datastore.beginTransaction(options);
    try {
      datastore.put(txn, tripEntity);

      JsonArray locationData = jsonObject.getAsJsonArray("locations");
      Iterator<JsonElement> locationIterator = locationData.iterator();

      while (locationIterator.hasNext()) {
        TripLocation location = TripDataConverter.convertJsonObjectToTripLocation(locationIterator.next().getAsJsonObject(), userEmail);
        datastore.put(txn, TripDataConverter.convertTripLocationToEntity(location, tripEntity));
      }
      ;

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

    Trip trip = TripDataConverter.convertJsonObjectToTrip(jsonObject, userEmail, timestamp);
    Entity tripEntity = TripDataConverter.convertTripToEntity(trip);

    DatastoreService datastore = DatastoreServiceFactory.getDatastoreService();
    TransactionOptions options = TransactionOptions.Builder.withXG(true);
    Transaction txn = datastore.beginTransaction(options);
    try {
      Query tripQuery = new Query("trip")
          .setFilter(new FilterPredicate(Trip.ENTITY_PROPERTY_OWNER, FilterOperator.EQUAL, userEmail))
          .setFilter(new FilterPredicate(Trip.ENTITY_PROPERTY_TIMESTAMP, FilterOperator.EQUAL, timestamp));

      Iterable<Entity> tripEntityIterable = datastore.prepare(tripQuery).asIterable();
      if (Iterables.size(tripEntityIterable) == 0) {
        /*
         * If we reach this breakpoint, that means no Trip matches the timestamp to be
         * updated. Send back an error code 404.
         */
        response.setStatus(HttpServletResponse.SC_NOT_FOUND);
        return;
      }
      Entity existingTrip = tripEntityIterable.iterator().next();
      Query tripLocationsQuery = new Query("trip-location").setAncestor(existingTrip.getKey());
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

      while (locationIterator.hasNext()) {
        TripLocation location = TripDataConverter.convertJsonObjectToTripLocation(locationIterator.next().getAsJsonObject(), userEmail);
        datastore.put(txn, TripDataConverter.convertTripLocationToEntity(location, tripEntity));
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
    Iterable<Entity> tripEntityIterable = datastore.prepare(tripQuery).asIterable();

    if (Iterables.size(tripEntityIterable) == 0) {
      /*
       * If we reach this breakpoint, that means no Trip matches the timestamp to be
       * deleted. Send back an error code 404.
       */
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
}