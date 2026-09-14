"use client";
import { useEffect, useRef, useState } from "react";
import {
  brazilianStateCodes,
  brazilianStateSchema,
  postalCodeSchema,
  contactFieldMessages,
  formatBrazilianAddress,
  type BrazilianAddress,
} from "@caab/contracts";
import { Button } from "./button";
import { FormField } from "./form-field";
import { ValidatedTextField } from "./validated-text-field";

type Address = Pick<
  BrazilianAddress,
  "street" | "neighborhood" | "number" | "complement" | "city" | "state"
>;
export function BrazilianAddressFields({
  prefix,
  initial,
  className,
}: {
  prefix: string;
  initial?: Partial<BrazilianAddress>;
  className?: string;
}) {
  const [address, setAddress] = useState<Address>({
    street: initial?.street ?? "",
    neighborhood: initial?.neighborhood ?? "",
    number: initial?.number ?? "",
    complement: initial?.complement ?? "",
    city: initial?.city ?? "",
    state: initial?.state ?? "",
  });
  const legacy = ![
    initial?.street,
    initial?.neighborhood,
    initial?.number,
    initial?.complement,
  ].some(Boolean)
    ? (initial?.address ?? "")
    : "";
  const [converting, setConverting] = useState(!legacy);
  const [lookup, setLookup] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [stateError, setStateError] = useState("");
  const [retry, setRetry] = useState(0);
  const revisions = useRef({
    street: 0,
    neighborhood: 0,
    number: 0,
    complement: 0,
    city: 0,
    state: 0,
  });
  const stateInput = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const valid = brazilianStateSchema.safeParse(address.state).success;
    stateInput.current?.setCustomValidity(valid ? "" : contactFieldMessages.state);
    if (valid) setStateError("");
  }, [address.state]);
  useEffect(() => {
    if (lookup.length !== 8) return;
    const controller = new AbortController();
    const initialRevisions = { ...revisions.current };
    const timer = setTimeout(() => {
      setNotice("Consultando CEP…");
      setError("");
      void fetch(`https://viacep.com.br/ws/${lookup}/json/`, {
        signal: AbortSignal.any([controller.signal, AbortSignal.timeout(5000)]),
        credentials: "omit",
        referrerPolicy: "no-referrer",
      })
        .then(async (response) => {
          if (!response.ok) throw new Error("Consulta indisponível");
          const result = await response.json();
          if (controller.signal.aborted) return;
          if (result.erro) {
            setError("CEP não encontrado. Confira o número ou preencha o endereço manualmente.");
            setNotice("");
            return;
          }
          if (
            typeof result.cep !== "string" ||
            result.cep.replace(/\D/g, "") !== lookup ||
            typeof result.localidade !== "string" ||
            !brazilianStateCodes.includes(result.uf)
          )
            throw new Error("Resposta inválida");
          const next = {
            street: typeof result.logradouro === "string" ? result.logradouro.slice(0, 300) : "",
            neighborhood: typeof result.bairro === "string" ? result.bairro.slice(0, 100) : "",
            city: result.localidade.slice(0, 100),
            state: result.uf,
          };
          setAddress((current) => ({
            ...current,
            street:
              revisions.current.street === initialRevisions.street ? next.street : current.street,
            neighborhood:
              revisions.current.neighborhood === initialRevisions.neighborhood
                ? next.neighborhood
                : current.neighborhood,
            city: revisions.current.city === initialRevisions.city ? next.city : current.city,
            state: revisions.current.state === initialRevisions.state ? next.state : current.state,
          }));
          setNotice(
            "CEP consultado. Confira o endereço e acrescente número e complemento, se necessário.",
          );
        })
        .catch(() => {
          if (!controller.signal.aborted) {
            setError(
              "Não foi possível consultar o CEP. Tente novamente ou preencha o endereço manualmente.",
            );
            setNotice("");
          }
        });
    }, 250);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [lookup, retry]);
  function change(field: keyof Address, value: string) {
    revisions.current[field]++;
    setAddress((current) => ({ ...current, [field]: value }));
  }
  return (
    <>
      <div className={["address-fields", className].filter(Boolean).join(" ")}>
        <ValidatedTextField
          id={`${prefix}-postalCode`}
          name="postalCode"
          label="CEP (opcional)"
          hint="Digite oito números para preencher endereço, cidade e UF."
          schema={postalCodeSchema}
          message={contactFieldMessages.postalCode}
          mask="postalCode"
          autoComplete="postal-code"
          placeholder="00000-000"
          defaultValue={initial?.postalCode ?? ""}
          onValueChange={(input) => {
            setLookup(input.value.replace(/\D/g, ""));
            setNotice("");
            setError("");
          }}
        />
        {legacy && (
          <div>
            <p id={`${prefix}-legacy`}>Endereço anterior: {legacy}</p>
            <label className="checkbox-field">
              <input
                type="checkbox"
                checked={converting}
                onChange={(event) => setConverting(event.target.checked)}
              />
              Substituir o endereço anterior pelos campos separados
            </label>
          </div>
        )}
        <input
          type="hidden"
          name="address"
          value={converting ? formatBrazilianAddress(address) : legacy}
        />
        {(
          [
            ["street", "Rua (opcional)", 300, "address-line1"],
            ["neighborhood", "Bairro (opcional)", 100, "address-level3"],
            ["number", "Número (opcional)", 20, "off"],
            ["complement", "Complemento (opcional)", 150, "address-line2"],
          ] as const
        ).map(([name, label, max, autoComplete]) => (
          <FormField
            key={name}
            id={`${prefix}-${name}`}
            label={label}
            hint={name === "number" ? "Ex.: 123, 12A ou s/n." : undefined}
          >
            <input
              name={name}
              maxLength={max}
              autoComplete={autoComplete}
              disabled={!converting}
              value={address[name]}
              onChange={(event) => change(name, event.target.value)}
            />
          </FormField>
        ))}
        <FormField id={`${prefix}-city`} label="Cidade (opcional)">
          <input
            name="city"
            autoComplete="address-level2"
            maxLength={100}
            value={address.city}
            onChange={(event) => change("city", event.target.value)}
          />
        </FormField>
        <FormField id={`${prefix}-state`} label="Estado (UF) (opcional)" error={stateError}>
          <input
            ref={stateInput}
            name="state"
            list={`${prefix}-state-options`}
            autoComplete="address-level1"
            maxLength={2}
            value={address.state}
            onChange={(event) =>
              change("state", event.target.value.replace(/[^a-z]/gi, "").toUpperCase())
            }
            onBlur={() =>
              setStateError(
                brazilianStateSchema.safeParse(address.state).success
                  ? ""
                  : contactFieldMessages.state,
              )
            }
            onInvalid={() => setStateError(contactFieldMessages.state)}
          />
        </FormField>
        <datalist id={`${prefix}-state-options`}>
          {brazilianStateCodes.map((state) => (
            <option key={state} value={state} />
          ))}
        </datalist>
      </div>
      <p role="status">{notice}</p>
      {error && (
        <div>
          <p role="alert">{error}</p>
          <Button type="button" onClick={() => setRetry((value) => value + 1)}>
            Consultar CEP novamente
          </Button>
        </div>
      )}
    </>
  );
}
