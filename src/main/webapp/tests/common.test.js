describe('Test the serialized by Gson JSON parser', () => {
  it('parses an empty JSON string correctly', () => {
    expect(parseSerializedJson('')).toEqual({});
  });

  it('parses a single field JSON string correctly', () => {
    expect(parseSerializedJson('{field1=yes}')).toEqual({
      field1: 'yes',
    });
  });

  it('parses an example value class with Gson correctly', () => {
    expect(
      parseSerializedJson('AutoValue{prop1=5, prop2=yes, prop3=nope}')
    ).toEqual({
      prop1: '5',
      prop2: 'yes',
      prop3: 'nope',
    });
  });

  it('parses Trip serialized JSON correctly', () => {
    expect(
      parseSerializedJson(
        'Trip{title=test, hotel=hotel1234, rating=-1.0, description=, owner=test@example.com, isPublic=false, timestamp=1594256985924}'
      )
    ).toEqual({
      description: '',
      hotel: 'hotel1234',
      isPublic: 'false',
      owner: 'test@example.com',
      rating: '-1.0',
      timestamp: '1594256985924',
      title: 'test',
    });
  });

  it('parses a Trip serialized JSON with commas in values correctly', () => {
    expect(parseSerializedJson('Trip{title=broken, hotelID=aBc234, hotelName=The Hotel, hotelImage=aBcXP, rating=3.5, description=commas, but, not, broken., owner=peter@google.com, isPastTrip=true, isPublic=true, timestamp=1596136046764}')).toEqual({
      title: 'broken',
      hotelID: 'aBc234',
      hotelName: 'The Hotel',
      hotelImage: 'aBcXP',
      rating: '3.5',
      description: 'commas, but, not, broken.',
      owner: 'peter@google.com',
      isPastTrip: 'true',
      isPublic: 'true',
      timestamp: '1596136046764',
    });
  });
});
