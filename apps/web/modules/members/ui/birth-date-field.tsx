"use client";

import { useId, useState } from "react";
import { CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { FormField } from "@/components/ui/form-field";
import styles from "./members.module.css";

const months = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];
const weekdays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const isoDate = (year: number, month: number, day: number) =>
  `${String(year).padStart(4, "0")}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

export function BirthDateField({
  id,
  defaultValue,
  disabled,
}: {
  id?: string;
  defaultValue: string;
  disabled: boolean;
}) {
  const calendarId = useId();
  const [value, setValue] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(0);
  const [year, setYear] = useState(2000);
  const today = new Date();
  const max = isoDate(today.getFullYear(), today.getMonth(), today.getDate());
  const validYear = Number.isInteger(year) && year >= 1 && year <= today.getFullYear();
  // setFullYear preserves years 1–99, which the multi-argument Date constructor offsets.
  const first = new Date(0);
  first.setFullYear(year, month, 1);
  const last = new Date(first);
  last.setMonth(month + 1, 0);
  const offset = first.getDay();
  const days = last.getDate();

  function changeOpen(next: boolean) {
    if (next && disabled) return;
    if (next) {
      const selected = value && value <= max ? value : max;
      setYear(Number(selected.slice(0, 4)));
      setMonth(Number(selected.slice(5, 7)) - 1);
    }
    setOpen(next);
  }

  return (
    <div className={`${styles.birthDateField} field-with-action`}>
      <input
        id={id}
        name="birthDate"
        type="date"
        max={max}
        value={value}
        disabled={disabled}
        onChange={(event) => setValue(event.target.value)}
      />
      <Dialog open={open && !disabled} onOpenChange={changeOpen}>
        <DialogTrigger asChild>
          <Button
            type="button"
            className="field-icon-button"
            disabled={disabled}
            aria-label="Abrir calendário de nascimento"
            title="Abrir calendário de nascimento"
          >
            <CalendarDays size={20} aria-hidden="true" />
          </Button>
        </DialogTrigger>
        <DialogContent
          title="Data de nascimento"
          description="Escolha o mês, o ano e o dia."
          className={styles.birthCalendar}
        >
          <div className={styles.calendarControls}>
            <FormField id={`${calendarId}-month`} label="Mês">
              <select value={month} onChange={(event) => setMonth(Number(event.target.value))}>
                {months.map((label, index) => (
                  <option key={label} value={index}>
                    {label}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField id={`${calendarId}-year`} label="Ano">
              <input
                type="number"
                min={1}
                max={today.getFullYear()}
                value={year || ""}
                onChange={(event) => setYear(Number(event.target.value))}
              />
            </FormField>
          </div>
          {validYear ? (
            <table className={styles.calendarTable} aria-label={`${months[month]} de ${year}`}>
              <thead>
                <tr>
                  {weekdays.map((day) => (
                    <th key={day} scope="col">
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: Math.ceil((offset + days) / 7) }, (_, week) => (
                  <tr key={week}>
                    {weekdays.map((weekday, column) => {
                      const day = week * 7 + column - offset + 1;
                      if (day < 1 || day > days) return <td key={weekday} />;
                      const date = isoDate(year, month, day);
                      return (
                        <td key={weekday}>
                          <button
                            type="button"
                            aria-label={`${day} de ${months[month]} de ${year}`}
                            aria-pressed={value === date}
                            aria-current={date === max ? "date" : undefined}
                            disabled={date > max}
                            onClick={() => {
                              setValue(date);
                              setOpen(false);
                            }}
                          >
                            {day}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p role="status">Informe um ano válido até {today.getFullYear()}.</p>
          )}
          <Button
            type="button"
            onClick={() => {
              setValue("");
              setOpen(false);
            }}
          >
            Limpar data
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
