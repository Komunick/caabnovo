import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Alert } from "./alert";
import { Button, buttonVariants } from "./button";
import { FormField } from "./form-field";
import { Input } from "./input";
import { Spinner } from "./spinner";

describe("institutional UI contracts", () => {
  it("defines semantic color, spacing, focus, radius and typography tokens", async () => {
    const css = await readFile(resolve("apps/web/styles/tokens.css"), "utf8");
    for (const token of [
      "--color-action",
      "--color-danger",
      "--color-focus",
      "--space-1",
      "--radius-md",
      "--font-sans",
    ]) {
      expect(css).toContain(token);
    }
  });

  it("keeps button variants deterministic and preserves accessible names", () => {
    expect(buttonVariants({ intent: "primary", size: "compact" })).toContain("button--primary");
    expect(buttonVariants({ intent: "danger" })).toContain("button--danger");
    const markup = renderToStaticMarkup(<Button aria-label="Salvar registro" />);
    expect(markup).toContain('aria-label="Salvar registro"');
    expect(markup).toContain('type="button"');
  });

  it("connects field labels, descriptions and errors without relying on color", () => {
    const markup = renderToStaticMarkup(
      <FormField id="email" label="E-mail" hint="Use o endereço institucional" error="Inválido">
        <Input type="email" />
      </FormField>,
    );
    expect(markup).toContain('for="email"');
    expect(markup).toContain('id="email"');
    expect(markup).toContain('aria-invalid="true"');
    expect(markup).toContain('aria-describedby="email-hint email-error"');
    expect(markup).toContain('role="alert"');
  });

  it("announces alerts and loading state with explicit text alternatives", () => {
    const alert = renderToStaticMarkup(<Alert>Não foi possível salvar.</Alert>);
    const spinner = renderToStaticMarkup(<Spinner label="Carregando usuários" />);
    expect(alert).toContain('role="alert"');
    expect(spinner).toContain('role="status"');
    expect(spinner).toContain("Carregando usuários");
  });
});
