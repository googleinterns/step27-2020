package com.google.sps.data;

import com.google.auto.value.AutoValue;

/**
 * Value class representing the data associated with a trip created on the My
 * Trips page. Its corresponding Locations are stored in TripLocation entities.
 */
@AutoValue
public abstract class Trip {

  public static final String ENTITY_PROPERTY_TITLE = "title";
  public static final String ENTITY_PROPERTY_HOTEL = "hotel";
  public static final String ENTITY_PROPERTY_RATING = "rating";
  public static final String ENTITY_PROPERTY_DESCRIPTION = "description";
  public static final String ENTITY_PROPERTY_OWNER = "owner";
  public static final String ENTITY_PROPERTY_PUBLIC = "is_public";
  public static final String ENTITY_PROPERTY_TIMESTAMP = "timestamp";

  public abstract String title();

  // represented by a Place ID string
  public abstract String hotel();

  // [1, 5], scale=0.5
  public abstract double rating();

  public abstract String description();

  public abstract String owner();

  public abstract boolean isPublic();

  public abstract long timestamp();

  public static Builder builder() {
    // initialize fields not required at first creation
    return new AutoValue_Trip.Builder()
                .setHotel("")
                .setRating(-1)
                .setDescription("")
                .setIsPublic(false);
  }

  @AutoValue.Builder
  public abstract static class Builder {
    public abstract Builder setTitle(String value);

    public abstract Builder setHotel(String value);

    public abstract Builder setRating(double value);

    public abstract Builder setDescription(String value);

    public abstract Builder setOwner(String value);

    public abstract Builder setIsPublic(boolean value);

    public abstract Builder setTimestamp(long value);

    public abstract Trip build();
  }
}
