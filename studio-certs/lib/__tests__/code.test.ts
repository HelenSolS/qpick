import { describe, it, expect } from "vitest";
import { generateCertificateCode } from "../code";

const CODE_REGEX = /^QPIC-[A-Z]{4}-\d{4}$/;

describe("generateCertificateCode", () => {
  it("returns format QPIC-XXXX-YYYY (4 uppercase, 4 digits)", () => {
    const code = generateCertificateCode();
    expect(code).toMatch(CODE_REGEX);
  });

  it("generates different codes on multiple calls", () => {
    const codes = new Set<string>();
    for (let i = 0; i < 100; i++) {
      codes.add(generateCertificateCode());
    }
    expect(codes.size).toBe(100);
  });

  it("has correct length", () => {
    const code = generateCertificateCode();
    expect(code.length).toBe(14);
    expect(code.startsWith("QPIC-")).toBe(true);
    expect(code[9]).toBe("-");
  });
});
