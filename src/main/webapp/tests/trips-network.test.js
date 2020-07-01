describe("Test unix timestamp toString converter", () => {
  it("converts timestamps correctly", () => {
    expect(unixTimestampToString(1593466864528)).toBe("6/29/2020");
  });
});
