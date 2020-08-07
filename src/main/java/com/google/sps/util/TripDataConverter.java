package com.google.sps.util;

import com.google.appengine.api.datastore.Entity;
import com.google.gson.JsonObject;
import com.google.sps.data.Trip;
import com.google.sps.data.TripLocation;

public class TripDataConverter {
  /**
   * Converts a JsonObject with certain fields to its corresponding Trip value
   * class.
   * 
   * @param jsonObject Object with fields for title, hotel ID, hotel name, hotel
   *                   photo ref, and rating.
   * @param userEmail
   * @param timestamp
   * @return Trip with corresponding fields to the JsonObject and params
   */
  public static Trip convertJsonObjectToTrip(JsonObject jsonObject, String userEmail, long timestamp) {
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
   * Converts a JsonObject with certain fields to its corresponding TripLocation
   * value class.
   * 
   * @param jsonObject Object with fields for id, name, and weight
   * @param userEmail
   * @return TripLocation with corresponding fields to the JsonObject and param
   */
  public static TripLocation convertJsonObjectToTripLocation(JsonObject jsonObject, String userEmail) {
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