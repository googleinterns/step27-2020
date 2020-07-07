package com.google.sps.data;

import com.google.auto.value.AutoValue;

/**
 * Inner value class for a location, with a Places ID
 * (https://developers.google.com/places/place-id) string and weight
 * representing the importance of the location
 */
@AutoValue
public abstract class Location {
  public static Location create(String placeID, int weight) {
    return new AutoValue_Location(placeID, weight);
  }

  public abstract String placeID();

  public abstract int weight();
}