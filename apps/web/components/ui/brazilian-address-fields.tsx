"use client";
import { useEffect, useRef, useState } from "react";
import {
  brazilianStateCodes,
  brazilianStateSchema,
  postalCodeSchema,
  contactFieldMessages,
} from "@caab/contracts";
import { Button } from "./button";
import { FormField } from "./form-field";
import { ValidatedTextField } from "./validated-text-field";

type Address = { address: string; city: string; state: string };
export function BrazilianAddressFields({
  prefix,
  initial,
  className,
}: {
  prefix: string;
  initial?: Partial<Address & { postalCode: string }>;
  className?: string;
}) {
  const [address, setAddress] = useState<Address>({
    address: initial?.address ?? "",
    city: initial?.city ?? "",
    state: initial?.state ?? "",
  });
  const [lookup, setLookup] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [stateError, setStateError] = useState("");
  const [retry, setRetry] = useState(0);
  const revisions = useRef({ address: 0, city: 0, state: 0 });
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
          const next: Address = {
            address: [result.logradouro, result.bairro]
              .filter((value) => typeof value === "string" && value)
              .join(", ")
              .slice(0, 300),
            city: result.localidade.slice(0, 100),
            state: result.uf,
          };
          setAddress((current) => ({
            address:
              revisions.current.address === initialRevisions.address
                ? next.address
                : current.address,
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
      <div className={className}>
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
        <FormField
          id={`${prefix}-address`}
          label="Endereço (opcional)"
          hint="Logradouro, bairro, número e complemento."
        >
          <input
            name="address"
            autoComplete="street-address"
            maxLength={300}
            value={address.address}
            onChange={(event) => change("address", event.target.value)}
          />
        </FormField>
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
