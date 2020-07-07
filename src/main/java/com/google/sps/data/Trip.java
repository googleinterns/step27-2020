package com.google.sps.data;

import java.util.List;

import com.google.appengine.api.datastore.DatastoreService;
import com.google.appengine.api.datastore.DatastoreServiceFactory;
import com.google.appengine.api.datastore.Entity;
import com.google.appengine.api.datastore.Query;
import com.google.auto.value.AutoValue;

/**
 * Value class representing the data associated with a trip created on the My
 * Trips page.
 */
@AutoValue
public abstract class Trip {
  public abstract String title();

  public abstract List<Location> locations();

  // represented by Place ID strings
  public abstract List<String> hotels();

  // [1, 5], scale=0.5
  public abstract double rating();

  public abstract String description();

  public abstract String owner();

  public abstract boolean isPublic();

  public abstract long timestamp();

  public static Builder builder() {
    return new AutoValue_Trip.Builder();
  }

  @AutoValue.Builder
  public abstract static class Builder {
    public abstract Builder setTitle(String value);

    public abstract Builder setLocations(List<Location> value);

    public abstract Builder setHotels(List<String> value);

    public abstract Builder setRating(double value);

    public abstract Builder setDescription(String value);

    public abstract Builder setOwner(String value);

    public abstract Builder setIsPublic(boolean value);

    public abstract Builder setTimestamp(long value);

    public abstract Trip build();
  }
}
