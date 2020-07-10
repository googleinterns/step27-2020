describe("Test center of mass function", () => {
  it("Computes a singleton point correctly", () => {
    const singletonPointArray = [{ lat: 0, lng: 0, weight: 1 }];
    expectToBeCloseToArray(centerOfMass(singletonPointArray), [0, 0]);
  });

  it("Computes an example set of points with weights correctly", () => {
    const example1 = [
      {
        lat: 54.1,
        lng: 42.1,
        weight: 2,
      },
      {
        lat: 51.2,
        lng: 43.4,
        weight: 4,
      },
      {
        lat: 55.7,
        lng: 43.9,
        weight: 1,
      },
    ];

    expectToBeCloseToArray(centerOfMass(example1), [53.5626865, 43.1298507]);
  });
});

function expectToBeCloseToArray(actual, expected) {
  actual.forEach((x, i) => expect(x).toBeCloseTo(expected[i], 6));
}
