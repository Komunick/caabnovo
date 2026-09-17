import { describe, expect, it, vi } from "vitest";
import { randomInt } from "node:crypto";
import { newPasswordSchema } from "@caab/contracts";
import { INITIAL_PASSWORD_WORDS, generateInitialPassword } from "./initial-password";

vi.mock("node:crypto", () => ({ randomInt: vi.fn() }));
const random = vi.mocked(randomInt as (max: number) => number);

describe("initial password generation", () => {
  it("uses a word and exactly six digits, including leading zeros, within the current policy", () => {
    expect(INITIAL_PASSWORD_WORDS.length).toBeGreaterThanOrEqual(200);
    expect(new Set(INITIAL_PASSWORD_WORDS).size).toBe(INITIAL_PASSWORD_WORDS.length);
    for (let index = 0; index < INITIAL_PASSWORD_WORDS.length; index++) {
      random.mockReturnValueOnce(index).mockReturnValueOnce(7);
      const password = generateInitialPassword();
      expect(password).toMatch(/^[A-Z][a-z]{5,}000007$/);
      expect(newPasswordSchema.safeParse(password).success).toBe(true);
    }
    expect(randomInt).toHaveBeenCalledWith(INITIAL_PASSWORD_WORDS.length);
    expect(randomInt).toHaveBeenCalledWith(1_000_000);
  });
  it("keeps the maximum suffix at six digits", () => {
    random.mockReturnValueOnce(0).mockReturnValueOnce(999999);
    expect(generateInitialPassword()).toMatch(/^[A-Z][a-z]+999999$/);
  });
  it("does not reintroduce words removed during the offensive-language review", () => {
    for (const word of [
      "macaco",
      "galinha",
      "baleia",
      "banana",
      "boneca",
      "barriga",
      "brancura",
      "amarelo",
      "girafa",
      "concha",
    ]) {
      expect(INITIAL_PASSWORD_WORDS).not.toContain(word);
    }
  });
});
