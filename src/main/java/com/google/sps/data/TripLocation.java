package com.google.sps.data;

import com.google.auto.value.AutoValue;

/**
 * Inner value class for a location, with a Places ID
 * (https://developers.google.com/places/place-id) string, weight representing
 * the importance of the location, and owner email address string. The
 * corresponding entities will have parent entities of the trips containing
 * these locations.
 */
@AutoValue
public abstract class TripLocation {
  public static final String ENTITY_PROPERTY_PLACE_ID = "place_id";
  public static final String ENTITY_PROPERTY_PLACE_NAME = "place_name";
  public static final String ENTITY_PROPERTY_WEIGHT = "weight";
  public static final String ENTITY_PROPERTY_OWNER = "owner";

  public static TripLocation create(String placeID, String placeName, int weight, String owner) {
    return new AutoValue_TripLocation(placeID, placeName, weight, owner);
  }

  public abstract String placeID();

  public abstract String placeName();

  public abstract int weight();

  public abstract String owner();
}