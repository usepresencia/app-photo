"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { FaCheck, FaChevronDown, FaRegCalendarAlt } from "react-icons/fa";
import { buildWhatsappLink } from "@/shared/_utils/whatsapp";

const floatingInput =
  "peer w-full rounded-lg border border-gold/30 bg-background/70 px-4 py-3 text-sm text-foreground placeholder-transparent shadow-sm backdrop-blur-sm transition-colors focus:border-gold focus:outline-none focus:ring-[3px] focus:ring-gold/20";

const floatingLabel =
  "pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground transition-all duration-150 peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:bg-background peer-focus:px-1 peer-focus:text-[0.62rem] peer-focus:uppercase peer-focus:tracking-[0.2em] peer-focus:text-gold peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:-translate-y-1/2 peer-[:not(:placeholder-shown)]:bg-background peer-[:not(:placeholder-shown)]:px-1 peer-[:not(:placeholder-shown)]:text-[0.62rem] peer-[:not(:placeholder-shown)]:uppercase peer-[:not(:placeholder-shown)]:tracking-[0.2em]";

const plainInput =
  "w-full rounded-lg border border-gold/30 bg-background/70 px-4 py-3 text-sm shadow-sm backdrop-blur-sm transition-colors focus:border-gold focus:outline-none focus:ring-[3px] focus:ring-gold/20";

const OPTIONS = [
  "Ensaio em estúdio",
  "Ensaio externo",
  "Gestante",
  "Família",
  "Aniversário infantil",
  "Casamento / Debutante",
  "Retrato profissional",
];

function NicheSelect({
  id,
  value,
  onChange,
  placeholder,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        id={id}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={`${plainInput} flex items-center justify-between gap-2 text-left ${value ? "text-foreground" : "text-muted-foreground"}`}
      >
        <span className="truncate">{value || placeholder}</span>
        <FaChevronDown
          aria-hidden="true"
          className={`size-3 shrink-0 text-gold transition-transform duration-150 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <ul
          role="listbox"
          tabIndex={-1}
          className="no-scrollbar absolute z-20 mt-2 max-h-60 w-full overflow-y-auto overflow-x-hidden rounded-lg border border-gold/30 bg-background px-4 py-1.5 text-sm shadow-lg"
          style={{ boxShadow: "var(--shadow-gold)" }}
        >
          {OPTIONS.map((opt) => (
            <li key={opt}>
              <button
                type="button"
                role="option"
                aria-selected={value === opt}
                onClick={() => {
                  onChange(opt);
                  setOpen(false);
                }}
                className={`flex w-full items-center gap-2 rounded-md px-3 py-2.5 text-left transition-all duration-150 hover:scale-[1.02] hover:bg-gold/10 ${
                  value === opt ? "text-gold" : "text-foreground"
                }`}
              >
                <FaCheck
                  aria-hidden="true"
                  className={`size-3 shrink-0 ${value === opt ? "opacity-100" : "opacity-0"}`}
                />
                <span className="truncate">{opt}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function ContactForm({ whatsapp }: { whatsapp: string }) {
  const [form, setForm] = useState({ nome: "", tipo: "", data: "", msg: "" });
  const nomeId = useId();
  const tipoId = useId();
  const dataId = useId();
  const msgId = useId();
  const dataInputRef = useRef<HTMLInputElement>(null);

  const send = (e: FormEvent) => {
    e.preventDefault();
    if (!form.tipo) return;
    const text = `Olá, Denise! Sou ${form.nome}. Tenho interesse em: ${form.tipo}. Data pretendida: ${
      form.data || "a definir"
    }. ${form.msg}`;
    window.open(buildWhatsappLink(whatsapp, text), "_blank");
  };

  return (
    <form
      onSubmit={send}
      className="relative overflow-hidden border border-gold/20 p-5"
      style={{ boxShadow: "var(--shadow-gold)" }}
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 18%, color-mix(in oklab, var(--gold) 12%, transparent) 0 14px, transparent 15px), radial-gradient(circle at 62% 34%, color-mix(in oklab, var(--gold) 8%, transparent) 0 20px, transparent 21px), radial-gradient(circle at 34% 68%, color-mix(in oklab, var(--gold) 10%, transparent) 0 18px, transparent 19px), radial-gradient(circle at 78% 88%, color-mix(in oklab, var(--gold) 8%, transparent) 0 16px, transparent 17px)",
          backgroundSize: "190px 190px",
        }}
      />
      <div className="relative z-10 space-y-4">
        <div className="relative">
          <input
            id={nomeId}
            required
            placeholder=" "
            className={floatingInput}
            value={form.nome}
            onChange={(e) => setForm({ ...form, nome: e.target.value })}
          />
          <label htmlFor={nomeId} className={floatingLabel}>
            Seu nome
          </label>
        </div>

        <div>
          <label htmlFor={tipoId} className="sr-only">
            Tipo de ensaio
          </label>
          <NicheSelect
            id={tipoId}
            value={form.tipo}
            onChange={(tipo) => setForm({ ...form, tipo })}
            placeholder="Selecione o seu momento"
          />
        </div>

        <div className="relative" onClick={() => dataInputRef.current?.showPicker?.()}>
          <input
            ref={dataInputRef}
            id={dataId}
            type="date"
            required
            className={`${plainInput} text-foreground [color-scheme:light] [&::-webkit-calendar-picker-indicator]:opacity-0`}
            value={form.data}
            onChange={(e) => setForm({ ...form, data: e.target.value })}
          />
          {!form.data && (
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-px left-4 right-10 flex items-center bg-background text-sm text-muted-foreground"
            >
              Selecione a data
            </span>
          )}
          <FaRegCalendarAlt
            aria-hidden="true"
            className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-gold"
          />
          <label htmlFor={dataId} className="sr-only">
            Data pretendida
          </label>
        </div>

        <div className="relative">
          <textarea
            id={msgId}
            rows={4}
            placeholder=" "
            className={floatingInput}
            value={form.msg}
            onChange={(e) => setForm({ ...form, msg: e.target.value })}
          />
          <label htmlFor={msgId} className={floatingLabel}>
            Conte um pouco sobre o que você imagina
          </label>
        </div>

        <button
          type="submit"
          className="gradient-border-gold font-condensed mx-auto block w-fit rounded-full px-10 py-3 text-center text-sm font-semibold uppercase tracking-[0.22em] text-gold transition-opacity hover:opacity-90"
          style={{
            boxShadow:
              "0 10px 25px -8px color-mix(in oklab, var(--gold) 55%, transparent), 0 4px 10px -4px color-mix(in oklab, var(--gold) 35%, transparent)",
          }}
        >
          Enviar
        </button>
      </div>
    </form>
  );
}
