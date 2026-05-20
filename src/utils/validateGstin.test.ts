import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { normalizeGstin, validateGstin } from "./validateGstin.ts";

describe("validateGstin", () => {
  it("accepts a valid GSTIN", () => {
    const result = validateGstin("22AAAAA0000A1Z5");

    assert.equal(result.isValid, true);
    assert.equal(result.message, "GST number format is valid");
    assert.equal(result.normalized, "22AAAAA0000A1Z5");
  });

  it("normalizes lowercase and spaces", () => {
    assert.equal(normalizeGstin(" 22aaaaa0000a1z5 "), "22AAAAA0000A1Z5");
  });

  it("rejects empty GSTIN", () => {
    const result = validateGstin("");

    assert.equal(result.isValid, false);
    assert.equal(result.message, "GST number is required");
  });

  it("rejects wrong length", () => {
    const result = validateGstin("22AAAAA0000A1Z");

    assert.equal(result.isValid, false);
    assert.equal(result.message, "GST number must be exactly 15 characters");
  });

  it("rejects wrong format", () => {
    const result = validateGstin("2AAAAAA0000A1Z5");

    assert.equal(result.isValid, false);
    assert.equal(result.message, "Enter a valid GSTIN format");
  });

  it("limits normalized value to 15 characters", () => {
    assert.equal(normalizeGstin("22AAAAA0000A1Z5EXTRA"), "22AAAAA0000A1Z5");
  });
});
