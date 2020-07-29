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
import com.google.appengine.api.users.UserService;
import com.google.appengine.api.users.UserServiceFactory;
import com.google.gson.Gson;
import com.google.sps.data.AuthInfo;
import com.google.sps.data.Trip;
import com.google.sps.data.TripLocation;
import com.google.sps.util.AuthChecker;
import com.google.sps.util.TripDataConverter;

import java.io.IOException;
import java.util.ArrayList;
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
    String userEmail = AuthChecker.getUserEmail(response);
    if (userEmail == null) {
      return;
    }

    Query tripQuery = new Query("trip")
        .setFilter(new FilterPredicate(Trip.ENTITY_PROPERTY_PAST_TRIP, FilterOperator.EQUAL, true));

    DatastoreService datastore = DatastoreServiceFactory.getDatastoreService();
    PreparedQuery tripResults = datastore.prepare(tripQuery);
    Iterable<Entity> tripEntityIterable = tripResults.asIterable();
    for (Entity entity : tripEntityIterable) {
      Trip trip = TripDataConverter.convertEntityToTrip(entity);
    }
    List<Map<Key, List<TripLocation>>> tripLocationMapList = new ArrayList<>();
    Query tripLocationsQuery = new Query("trip-location")
        .setFilter(new FilterPredicate(TripLocation.ENTITY_PROPERTY_OWNER, FilterOperator.EQUAL, userEmail));

    response.setContentType("application/json");
    Gson gson = new Gson();

  }
}