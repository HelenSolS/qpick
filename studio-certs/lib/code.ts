/**
 * Generates a certificate code: QPIC-XXXX-YYYY
 * XXXX = 4 random uppercase letters, YYYY = 4 random digits.
 */
const UPPERCASE = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const DIGITS = "0123456789";

function randomChar(from: string): string {
  return from[Math.floor(Math.random() * from.length)];
}

export function generateCertificateCode(): string {
  const part1 = Array.from({ length: 4 }, () => randomChar(UPPERCASE)).join("");
  const part2 = Array.from({ length: 4 }, () => randomChar(DIGITS)).join("");
  return `QPIC-${part1}-${part2}`;
}
