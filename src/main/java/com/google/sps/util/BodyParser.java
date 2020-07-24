package com.google.sps.util;

import com.google.gson.JsonObject;
import com.google.gson.JsonParser;

import java.io.IOException;
import java.util.stream.Collectors;

import javax.servlet.http.HttpServletRequest;

public class BodyParser {

  /**
   * Parses the request body of a certain HTTP request using the Java Servlet framework
   * and converts it into a Gson JsonObject.
   * @param request a request passed to a certain servlet
   * @return JsonObject with corresponding properties to the request body.
   * @throws IOException
   */
  public static JsonObject parseJsonObjectFromRequest(HttpServletRequest request) throws IOException {
    String requestBody = request.getReader().lines().collect(Collectors.joining(System.lineSeparator()));
    return JsonParser.parseString(requestBody).getAsJsonObject();
  }
}