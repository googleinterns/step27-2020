package com.google.sps.servlets;

import com.google.appengine.api.datastore.DatastoreService;
import com.google.appengine.api.datastore.DatastoreServiceFactory;
import com.google.appengine.api.datastore.PreparedQuery;
import com.google.appengine.api.datastore.Query;
import com.google.appengine.api.datastore.Query.FilterOperator;
import com.google.appengine.api.datastore.Query.FilterPredicate;
import com.google.common.collect.Iterables;
import com.google.appengine.api.datastore.Entity;
import com.google.appengine.api.users.UserServiceFactory;
import com.google.gson.Gson;
import com.google.gson.JsonObject;
import com.google.sps.data.Trip;
import com.google.sps.data.TripLocation;
import com.google.sps.util.AuthChecker;
import com.google.sps.util.BodyParser;
import com.google.sps.util.TripDataConverter;

import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;

import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

@WebServlet("/trips-network")
public class TripsNetworkServlet extends HttpServlet {

  @Override
  public void doGet(HttpServletRequest request, HttpServletResponse response) throws IOException {
    String userEmail = AuthChecker.getUserEmail(response, UserServiceFactory.getUserService());
    if (userEmail == null) {
      return;
    }

    Query tripQuery = new Query("trip")
        .setFilter(new FilterPredicate(Trip.ENTITY_PROPERTY_PAST_TRIP, FilterOperator.EQUAL, true));

    DatastoreService datastore = DatastoreServiceFactory.getDatastoreService();

    PreparedQuery tripResults = datastore.prepare(tripQuery);
    Iterable<Entity> tripEntityIterable = tripResults.asIterable();

    Map<Trip, List<TripLocation>> tripsResponseMap = new HashMap<>();
    for (Entity entity : tripEntityIterable) {
      // query and store trip locations under the current trip in the map
      Trip trip = TripDataConverter.convertEntityToTrip(entity);
      Query tripLocationsQuery = new Query("trip-location").setAncestor(entity.getKey());
      Iterable<Entity> tripLocationEntityIterable = datastore.prepare(tripLocationsQuery).asIterable();

      List<TripLocation> tripLocationList = new ArrayList<>();
      for (Entity tripEntity : tripLocationEntityIterable) {
        TripLocation location = TripDataConverter.convertEntityToTripLocation(tripEntity);
        tripLocationList.add(location);
      }
      tripsResponseMap.put(trip, tripLocationList);
    }

    response.setContentType("application/json");
    Gson gson = new Gson();
    String serializedJSON = gson.toJson(tripsResponseMap);
    response.getWriter().println(serializedJSON);
    response.setStatus(HttpServletResponse.SC_OK);
  }

  @Override
  public void doPut(HttpServletRequest request, HttpServletResponse response) throws IOException {
    String userEmail = AuthChecker.getUserEmail(response, UserServiceFactory.getUserService());
    if (userEmail == null) {
      return;
    }
    long timestamp = Long.parseLong(request.getParameter("timestamp"));
    boolean isPastTrip = Boolean.parseBoolean(request.getParameter("is_past_trip"));
    DatastoreService datastore = DatastoreServiceFactory.getDatastoreService();

    Query tripQuery = new Query("trip")
        .setFilter(new FilterPredicate(Trip.ENTITY_PROPERTY_OWNER, FilterOperator.EQUAL, userEmail))
        .setFilter(new FilterPredicate(Trip.ENTITY_PROPERTY_TIMESTAMP, FilterOperator.EQUAL, timestamp));

    Iterable<Entity> tripEntityIterable = datastore.prepare(tripQuery).asIterable();

    if (Iterables.size(tripEntityIterable) == 0) {
      response.setStatus(HttpServletResponse.SC_NOT_FOUND);
      return;
    }

    Iterator<Entity> iterator = tripEntityIterable.iterator();
    Entity tripToPatch = iterator.next();
    tripToPatch.setProperty(Trip.ENTITY_PROPERTY_PAST_TRIP, isPastTrip);
    datastore.put(tripToPatch);

    response.setStatus(HttpServletResponse.SC_OK);
  }

  @Override
  public void doPost(HttpServletRequest request, HttpServletResponse response) throws IOException {
    String userEmail = AuthChecker.getUserEmail(response, UserServiceFactory.getUserService());
    if (userEmail == null) {
      return;
    }
    JsonObject jsonObject = BodyParser.parseJsonObjectFromRequest(request);
    long timestamp = jsonObject.getAsJsonPrimitive(Trip.ENTITY_PROPERTY_TIMESTAMP).getAsLong();
    double rating = jsonObject.getAsJsonPrimitive(Trip.ENTITY_PROPERTY_RATING).getAsDouble();
    String description = jsonObject.getAsJsonPrimitive(Trip.ENTITY_PROPERTY_DESCRIPTION).getAsString();

    DatastoreService datastore = DatastoreServiceFactory.getDatastoreService();

    Query tripQuery = new Query("trip")
        .setFilter(new FilterPredicate(Trip.ENTITY_PROPERTY_OWNER, FilterOperator.EQUAL, userEmail))
        .setFilter(new FilterPredicate(Trip.ENTITY_PROPERTY_TIMESTAMP, FilterOperator.EQUAL, timestamp));

    Iterable<Entity> tripEntityIterable = datastore.prepare(tripQuery).asIterable();

    if (Iterables.size(tripEntityIterable) == 0 || Iterables.size(tripEntityIterable) > 1) {
      response.setStatus(HttpServletResponse.SC_NOT_FOUND);
      return;
    }

    Iterator<Entity> iterator = tripEntityIterable.iterator();
    Entity tripToPost = iterator.next();

    if (!(boolean) tripToPost.getProperty(Trip.ENTITY_PROPERTY_PAST_TRIP)) {
      // Trip isn't a past trip, so we can't post it to the network.
      response.setStatus(HttpServletResponse.SC_PRECONDITION_FAILED);
    }

    tripToPost.setProperty(Trip.ENTITY_PROPERTY_PUBLIC, true);
    tripToPost.setProperty(Trip.ENTITY_PROPERTY_RATING, rating);
    tripToPost.setProperty(Trip.ENTITY_PROPERTY_DESCRIPTION, description);

    datastore.put(tripToPost);

    response.setStatus(HttpServletResponse.SC_OK);
  }
}