describe("Test unix timestamp toString converter", () => {
  it("converts timestamps correctly", () => {
    expect(unixTimestampToString(1593466864528)).toBe("6/29/2020");
    expect(unixTimestampToString(1593620880101)).toBe("7/1/2020");
    expect(unixTimestampToString(946702800000)).toBe("1/1/2000");
  });
});
