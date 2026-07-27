import { useState } from "react";
import { BRAND, events, testimonials } from "./data";
import { Section } from "./Section";

export function Events() {
  return (
    <Section id="eventos" eyebrow="Eventos" title="Formatos de cobertura">
      <div className="space-y-4">
        {events.map((e) => (
          <article
            key={e.title}
            className="relative h-40 overflow-hidden rounded-lg border border-border"
          >
            <img
              src={e.image}
              alt={`Cobertura de ${e.title}`}
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover grayscale"
            />
            <div className="absolute inset-0 bg-background/65" />
            <div className="relative flex h-full flex-col items-center justify-center px-5 text-center">
              <h3 className="font-display text-2xl text-foreground">{e.title}</h3>
              <p className="mt-1 text-xs uppercase tracking-[0.2em] text-muted-foreground">
                {e.subtitle}
              </p>
            </div>
          </article>
        ))}
      </div>
      <p className="eyebrow mt-6 text-center">
        Preencha o formulário abaixo e finalize a conversa no WhatsApp
      </p>
    </Section>
  );
}

export function Contact() {
  const [form, setForm] = useState({ nome: "", tipo: "Ensaio em estúdio", data: "", msg: "" });

  const send = (e: React.FormEvent) => {
    e.preventDefault();
    const text = `Olá, Denise! Sou ${form.nome}. Tenho interesse em: ${form.tipo}. Data pretendida: ${
      form.data || "a definir"
    }. ${form.msg}`;
    window.open(`${BRAND.whatsapp}?text=${encodeURIComponent(text)}`, "_blank");
  };

  const field =
    "w-full rounded-md border border-border bg-surface px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-foreground focus:outline-none";

  return (
    <Section id="contato" eyebrow="Personalize" title="Fale comigo">
      <form onSubmit={send} className="mx-auto max-w-lg space-y-3">
        <input
          required
          className={field}
          placeholder="Seu nome"
          value={form.nome}
          onChange={(e) => setForm({ ...form, nome: e.target.value })}
        />
        <select
          className={field}
          value={form.tipo}
          onChange={(e) => setForm({ ...form, tipo: e.target.value })}
        >
          <option>Ensaio em estúdio</option>
          <option>Ensaio externo</option>
          <option>Gestante</option>
          <option>Família</option>
          <option>Aniversário infantil</option>
          <option>Casamento / Debutante</option>
          <option>Retrato profissional</option>
        </select>
        <input
          type="date"
          className={field}
          value={form.data}
          onChange={(e) => setForm({ ...form, data: e.target.value })}
        />
        <textarea
          rows={4}
          className={field}
          placeholder="Conte um pouco sobre o que você imagina"
          value={form.msg}
          onChange={(e) => setForm({ ...form, msg: e.target.value })}
        />
        <button
          type="submit"
          className="w-full rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          Enviar no WhatsApp
        </button>
      </form>
    </Section>
  );
}

export function Testimonials() {
  return (
    <Section id="feedbacks" eyebrow="Feedbacks de clientes" title="O que dizem por aí">
      <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
        {testimonials.map((t) => (
          <blockquote
            key={t.name}
            className="w-72 shrink-0 rounded-lg border border-border bg-surface p-6"
          >
            <p className="text-sm leading-relaxed text-muted-foreground">“{t.text}”</p>
            <footer className="eyebrow mt-4">{t.name}</footer>
          </blockquote>
        ))}
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <a
          href={BRAND.instagram}
          target="_blank"
          rel="noreferrer"
          className="rounded-full border border-border px-6 py-3 text-center text-sm font-semibold text-foreground transition-colors hover:bg-surface"
        >
          Instagram
        </a>
        <a
          href="https://www.google.com/maps"
          target="_blank"
          rel="noreferrer"
          className="rounded-full border border-border px-6 py-3 text-center text-sm font-semibold text-foreground transition-colors hover:bg-surface"
        >
          Avaliar no Google
        </a>
      </div>
    </Section>
  );
}

export function Location() {
  return (
    <Section id="estudio" eyebrow="Localização do estúdio" title="Onde nos encontramos">
      <div className="overflow-hidden rounded-lg border border-border">
        <iframe
          title="Mapa da localização do estúdio"
          src="https://www.google.com/maps?q=Sao+Paulo+SP&output=embed"
          className="h-64 w-full grayscale"
          loading="lazy"
        />
      </div>
      <div className="mt-4 rounded-lg border border-border bg-surface p-6 text-center">
        <p className="text-sm text-foreground">Rua das Artes, 120 — Vila Madalena, São Paulo/SP</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Atendimento com hora marcada, de terça a sábado.
        </p>
      </div>
      <footer className="mt-10 text-center">
        <p className="eyebrow">
          © {new Date().getFullYear()} {BRAND.name} Fotografia
        </p>
      </footer>
    </Section>
  );
}
