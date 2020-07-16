package com.google.sps.data;

import com.google.auto.value.AutoValue;

/**
 * Value class representing the data associated with a trip created on the My
 * Trips page. Its corresponding Locations are stored in TripLocation entities.
 */
@AutoValue
public abstract class Trip {

  public static final String ENTITY_PROPERTY_TITLE = "title";
  public static final String ENTITY_PROPERTY_HOTEL_ID = "hotel_id";
  public static final String ENTITY_PROPERTY_HOTEL_NAME = "hotel_name";
  public static final String ENTITY_PROPERTY_HOTEL_IMAGE = "hotel_img";
  public static final String ENTITY_PROPERTY_RATING = "rating";
  public static final String ENTITY_PROPERTY_DESCRIPTION = "description";
  public static final String ENTITY_PROPERTY_OWNER = "owner";
  public static final String ENTITY_PROPERTY_PUBLIC = "is_public";
  public static final String ENTITY_PROPERTY_PAST_TRIP = "is_past_trip";
  public static final String ENTITY_PROPERTY_TIMESTAMP = "timestamp";

  public abstract String title();

  // represented by a Place ID string
  public abstract String hotelID();

  public abstract String hotelName();

  public abstract String hotelImage();

  // [1, 5], scale=0.5
  public abstract double rating();

  public abstract String description();

  public abstract String owner();

  public abstract boolean isPastTrip();

  public abstract boolean isPublic();

  public abstract long timestamp();

  public static Builder builder() {
    // initialize fields not required at first creation
    return new AutoValue_Trip.Builder()
                .setRating(-1)
                .setDescription("")
                .setIsPublic(false)
                .setIsPastTrip(false);
  }

  @AutoValue.Builder
  public abstract static class Builder {
    public abstract Builder setTitle(String value);

    public abstract Builder setHotelID(String value);

    public abstract Builder setHotelName(String value);

    public abstract Builder setHotelImage(String value);

    public abstract Builder setRating(double value);

    public abstract Builder setDescription(String value);

    public abstract Builder setOwner(String value);

    public abstract Builder setIsPastTrip(boolean value);

    public abstract Builder setIsPublic(boolean value);

    public abstract Builder setTimestamp(long value);

    public abstract Trip build();
  }
}
