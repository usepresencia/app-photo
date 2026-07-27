import { useState } from "react";
import { BRAND, events, testimonials } from "./data";
import { Section } from "./Section";

export function Events() {
  return (
    <Section id="eventos" index="04" eyebrow="Eventos" title="Formatos de cobertura">
      <div className="space-y-3">
        {events.map((e, i) => (
          <article key={e.title} className="relative h-44 overflow-hidden border border-border">
            <img
              src={e.image}
              alt={`Cobertura de ${e.title}`}
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover grayscale"
            />
            <div className="absolute inset-0 bg-background/70" />
            <div className="relative flex h-full flex-col justify-end p-5">
              <span className="font-condensed text-[0.62rem] tracking-[0.35em] text-gold">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="display-xl mt-1 text-3xl text-foreground">{e.title}</h3>
              <p className="font-condensed mt-1 text-[0.65rem] uppercase tracking-[0.28em] text-muted-foreground">
                {e.subtitle}
              </p>
            </div>
          </article>
        ))}
      </div>
      <p className="font-condensed mt-6 text-center text-[0.65rem] uppercase tracking-[0.3em] text-muted-foreground">
        Preencha o formulário e finalize no WhatsApp
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
    "w-full border border-border bg-surface px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-gold focus:outline-none";

  return (
    <Section id="contato" index="05" eyebrow="Personalize" title="Fale comigo">
      <form onSubmit={send} className="frame-gold space-y-3 bg-surface/40 p-5">
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
          className="font-condensed w-full bg-primary px-6 py-3.5 text-sm font-semibold uppercase tracking-[0.22em] text-primary-foreground transition-opacity hover:opacity-90"
          style={{ boxShadow: "var(--shadow-gold)" }}
        >
          Enviar no WhatsApp
        </button>
      </form>
    </Section>
  );
}

export function Testimonials() {
  return (
    <Section id="feedbacks" index="06" eyebrow="Feedbacks de clientes" title="O que dizem por aí">
      <div className="no-scrollbar flex gap-3 overflow-x-auto pb-2">
        {testimonials.map((t) => (
          <blockquote
            key={t.name}
            className="w-72 shrink-0 border border-border bg-surface p-6"
          >
            <span aria-hidden="true" className="font-display block text-4xl leading-none text-gold">
              “
            </span>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t.text}</p>
            <footer className="font-condensed mt-4 text-[0.65rem] uppercase tracking-[0.3em] text-gold">
              {t.name}
            </footer>
          </blockquote>
        ))}
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <a
          href={BRAND.instagram}
          target="_blank"
          rel="noreferrer"
          className="frame-gold font-condensed px-6 py-3.5 text-center text-sm font-semibold uppercase tracking-[0.2em] text-foreground transition-colors hover:bg-surface"
        >
          Instagram
        </a>
        <a
          href="https://www.google.com/maps"
          target="_blank"
          rel="noreferrer"
          className="frame-gold font-condensed px-6 py-3.5 text-center text-sm font-semibold uppercase tracking-[0.2em] text-foreground transition-colors hover:bg-surface"
        >
          Avaliar no Google
        </a>
      </div>
    </Section>
  );
}

export function Location() {
  return (
    <Section id="estudio" index="07" eyebrow="Localização do estúdio" title="Onde nos encontramos">
      <div className="frame-gold overflow-hidden p-1.5">
        <iframe
          title="Mapa da localização do estúdio"
          src="https://www.google.com/maps?q=Sao+Paulo+SP&output=embed"
          className="h-64 w-full grayscale"
          loading="lazy"
        />
      </div>
      <div className="mt-4 border-l-2 border-gold bg-surface p-6">
        <p className="text-sm text-foreground">Rua das Artes, 120 — Vila Madalena, São Paulo/SP</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Atendimento com hora marcada, de terça a sábado.
        </p>
      </div>
      <footer className="mt-12">
        <span className="gold-rule block" />
        <p className="display-xl mt-5 text-center text-4xl text-foreground">
          {BRAND.name}
        </p>
        <p className="font-condensed mt-2 text-center text-[0.62rem] uppercase tracking-[0.4em] text-muted-foreground">
          © {new Date().getFullYear()} · Fotografia · São Paulo
        </p>
      </footer>
    </Section>
  );
}
