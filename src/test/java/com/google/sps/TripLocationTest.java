package com.google.sps;

import com.google.sps.data.TripLocation;

import org.junit.Assert;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.junit.runners.JUnit4;

@RunWith(JUnit4.class)
public class TripLocationTest {
  @Test
  public void testDefaultUsage() {
    TripLocation location = TripLocation.create("xYz_A", "Googleplex", 4, "peter@google.com");
    Assert.assertEquals("xYz_A", location.placeID());
    Assert.assertEquals("Googleplex", location.placeName());
    Assert.assertEquals(4, location.weight());
    Assert.assertEquals("peter@google.com", location.owner());
  }
}