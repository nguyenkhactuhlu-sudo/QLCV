import { describe, it, expect } from "vitest";
import { escapeHtml, getCurrentPeriod } from "../../src/utils/helpers.js";

describe("Helpers", () => {
  describe("escapeHtml", () => {
    it("returns empty string for null/undefined", () => {
      expect(escapeHtml(null)).toBe("");
      expect(escapeHtml(undefined)).toBe("");
    });
    it("escapes HTML special characters", () => {
      const result = escapeHtml("<script>alert(\"xss\")</script>");
      expect(result).not.toContain("<script>");
      expect(result).toContain("&lt;");
    });
    it("returns plain text unchanged", () => {
      expect(escapeHtml("Hello World")).toBe("Hello World");
    });
  });
  describe("getCurrentPeriod", () => {
    it("returns YYYY-MM format", () => {
      const period = getCurrentPeriod();
      expect(period).toMatch(/^\d{4}-\d{2}$/);
    });
  });
});
