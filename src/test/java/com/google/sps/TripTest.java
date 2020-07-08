package com.google.sps;

import com.google.sps.data.Trip;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;

import org.junit.Assert;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.junit.runners.JUnit4;

@RunWith(JUnit4.class)
public class TripTest {
  @Test
  public void testDefaultBuilderValuesWithRequiredData() {
    Trip defaultTrip = Trip.builder()
                        .setTitle("Trip 1")
                        .setOwner("test@gmail.com")
                        .setTimestamp(1594160425000L)
                        .build();
    Assert.assertEquals("Trip 1", defaultTrip.title());
    Assert.assertEquals("", defaultTrip.hotel());
    Assert.assertEquals(-1, defaultTrip.rating(), 0.01);
    Assert.assertEquals("", defaultTrip.description());
    Assert.assertEquals("test@gmail.com", defaultTrip.owner());
    Assert.assertEquals(false, defaultTrip.isPublic());
    Assert.assertEquals(1594160425000L, defaultTrip.timestamp());
  }
}