import { readFileSync } from "node:fs";

// Synthetic 2 x 2 JPEG; no personal data.
export const jpeg = readFileSync(
  new URL("../../../../tests/fixtures/synthetic.jpg", import.meta.url),
);
