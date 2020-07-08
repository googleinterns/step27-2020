package com.google.sps.data;

import com.google.auto.value.AutoValue;

/**
 * Inner value class for a location, with a Places ID
 * (https://developers.google.com/places/place-id) string, weight representing
 * the importance of the location, timestamp identifying the trip it's matched
 * to, and owner email address string.
 */
@AutoValue
public abstract class TripLocation {
  public static final String ENTITY_PROPERTY_PLACE = "place_id";
  public static final String ENTITY_PROPERTY_WEIGHT = "weight";
  public static final String ENTITY_PROPERTY_TRIP = "trip";
  public static final String ENTITY_PROPERTY_OWNER = "owner";

  public static TripLocation create(String placeID, int weight, long timestamp, String owner) {
    return new AutoValue_TripLocation(placeID, weight, timestamp, owner);
  }

  public abstract String placeID();

  public abstract int weight();

  public abstract long timestamp();

  public abstract String owner();
}