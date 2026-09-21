// Synthetic values only; never derived from a real person's record.
export function syntheticUserContact() {
  const digits = Array.from(crypto.getRandomValues(new Uint8Array(9)), (value) => value % 10);
  if (new Set(digits).size === 1) digits[0] = (digits[0]! + 1) % 10;
  for (const length of [9, 10]) {
    const sum = digits
      .slice(0, length)
      .reduce((total, digit, index) => total + digit * (length + 1 - index), 0);
    digits.push(((sum * 10) % 11) % 10);
  }
  return {
    cpf: digits.join(""),
    phone: "71999990000",
    address: {
      postalCode: "40000000",
      street: "Rua Sintética",
      number: "s/n",
      complement: "",
      neighborhood: "Bairro Teste",
      city: "Salvador",
      state: "BA" as const,
      address: "",
    },
  };
}
