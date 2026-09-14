import { expect, it } from "vitest";
import { formatContactInput } from "./masked-contact-input";
it("formats CPF, alphanumeric CNPJ, CEP and both Brazilian phone lengths", () => {
  expect(formatContactInput("52998224725", "cpf")).toBe("529.982.247-25");
  expect(formatContactInput("12abc34501de35", "cnpj")).toBe("12.ABC.345/01DE-35");
  expect(formatContactInput("04252011000110", "cnpj")).toBe("04.252.011/0001-10");
  expect(formatContactInput("40020000", "postalCode")).toBe("40020-000");
  expect(formatContactInput("7133334444", "phone")).toBe("(71) 3333-4444");
  expect(formatContactInput("71999998888", "phone")).toBe("(71) 99999-8888");
  expect(formatContactInput("abc71xyz33334444", "phone")).toBe("(71) 3333-4444");
  expect(formatContactInput("", "phone")).toBe("");
});
