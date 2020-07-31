package com.google.sps;

import javax.servlet.http.HttpServletRequest;

import com.google.gson.JsonObject;
import com.google.sps.util.BodyParser;

import org.junit.Assert;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.junit.runners.JUnit4;
import static org.mockito.Mockito.*;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.StringReader;

@RunWith(JUnit4.class)
public class BodyParserTest {
  private static final String JSON_EXAMPLE = "{\"prop1\":12345, \"prop2\":asdf}";
  private HttpServletRequest request;

  @Before
  public void setUp() throws IOException {
    request = mock(HttpServletRequest.class);
    when(request.getReader()).thenReturn(new BufferedReader(new StringReader(JSON_EXAMPLE)));
  }

  @Test
  public void testSerializedJsonParse() throws IOException {
    JsonObject obj = BodyParser.parseJsonObjectFromRequest(request);
    Assert.assertEquals(obj.getAsJsonPrimitive("prop1").getAsInt(), 12345);
    Assert.assertEquals(obj.getAsJsonPrimitive("prop2").getAsString(), "asdf");
  }
}