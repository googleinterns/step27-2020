describe("Test center of mass function", () => {
  it("Computes a singleton point correctly", () => {
    const singletonPointArray = [{ lat: 0, lng: 0, weight: 1 }];
    expect(centerOfMass(singletonPointArray)).toEqual([0, 0]);
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
    expect(centerOfMass(example1)).toBeCloseTo([
      53.562686567164185,
      43.129850746268666,
    ]);
  });
});

describe("Test center of mass function", () => {
  it("Computes a singleton point correctly", () => {
    const singletonPointArray = [{ lat: 0, lng: 0, weight: 1 }];
    expect(centerOfMass(singletonPointArray)).toEqual([0, 0]);
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
    expect(centerOfMass(example1)).toBeCloseTo([
      53.562686567164185,
      43.129850746268666,
    ]);
  });
});