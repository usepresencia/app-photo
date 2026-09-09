"use client";

import { useEffect, useState } from "react";
import { clientEnv } from "@/lib/config/env.client";

const PING = "app-photo:preview:ping";
const ACK = "app-photo:preview:ack";
const EDIT = "app-photo:preview:edit";
const ADD = "app-photo:preview:add";
const DELETE = "app-photo:preview:delete";

export function originOf(url: string | undefined): string | null {
  if (!url) return null;
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
}

export function isHandshakeAck(
  event: { origin: string; data: unknown },
  adminOrigin: string,
): boolean {
  return event.origin === adminOrigin && (event.data as { type?: string } | null)?.type === ACK;
}

export function parseEditableTarget(
  value: string | null,
): { entityType: string; id: string } | null {
  if (!value) return null;
  const sep = value.indexOf(":");
  if (sep === -1) return null;
  const entityType = value.slice(0, sep);
  const id = value.slice(sep + 1);
  if (!entityType || !id) return null;
  return { entityType, id };
}

export function parseAddableTarget(
  value: string | null,
): { entityType: string; context: unknown } | null {
  if (!value) return null;
  const sep = value.indexOf(":");
  if (sep === -1) return null;
  const entityType = value.slice(0, sep);
  if (!entityType) return null;
  const contextStr = value.slice(sep + 1);
  if (!contextStr) return { entityType, context: undefined };
  try {
    return { entityType, context: JSON.parse(contextStr) };
  } catch {
    return null;
  }
}

interface HoveredEditable {
  el: HTMLElement;
  entityType: string;
  id: string;
}

// Inerte por padrão — só ativa depois de confirmar, por postMessage, que
// está sendo carregado dentro do admin-photo (ver spec do preview com
// edição inline). Nunca ativa pra um visitante comum: fora de um iframe,
// ou dentro de um iframe de qualquer outra origem, esse componente não
// faz nada.
export function PreviewOverlay() {
  const [active, setActive] = useState(false);
  const [hovered, setHovered] = useState<HoveredEditable | null>(null);
  const adminOrigin = originOf(clientEnv.NEXT_PUBLIC_ADMIN_PHOTO_URL);

  useEffect(() => {
    if (!adminOrigin || window.self === window.top) return;

    function handleMessage(event: MessageEvent) {
      if (isHandshakeAck(event, adminOrigin!)) setActive(true);
    }
    window.addEventListener("message", handleMessage);
    window.parent.postMessage({ type: PING }, adminOrigin);
    return () => window.removeEventListener("message", handleMessage);
  }, [adminOrigin]);

  useEffect(() => {
    document.documentElement.toggleAttribute("data-preview-active", active);
  }, [active]);

  useEffect(() => {
    if (!active || !adminOrigin) return;
    const origin = adminOrigin;

    // Delegação num único listener no document, em vez de um handler por
    // <Editable> — mais barato numa página com dezenas de seções
    // editáveis, e captura em fase de captura pra interceptar o clique
    // antes que o próprio site reaja (ex.: navegar um <Link>, selecionar
    // um pacote no PackagePicker).
    function handleClick(event: MouseEvent) {
      const target = event.target as HTMLElement;

      const addEl = target.closest("[data-addable]");
      const addParsed = parseAddableTarget(addEl?.getAttribute("data-addable") ?? null);
      if (addParsed) {
        event.preventDefault();
        event.stopPropagation();
        window.parent.postMessage({ type: ADD, ...addParsed }, origin);
        return;
      }

      const el = target.closest("[data-editable]");
      const parsed = parseEditableTarget(el?.getAttribute("data-editable") ?? null);
      if (!parsed) return;
      event.preventDefault();
      event.stopPropagation();
      window.parent.postMessage({ type: EDIT, ...parsed }, origin);
    }
    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, [active, adminOrigin]);

  // Rastreio de hover de verdade (mouseover/mouseout) — o contorno de
  // edição continua sendo CSS puro (:hover em [data-editable]), mas o
  // ícone de lixeira é um elemento novo que precisa saber sobre qual
  // item está o mouse pra se posicionar. Usa state (não ref) porque o
  // valor é lido durante o render pra decidir o que desenhar — ler
  // ref.current no corpo do componente é um erro de lint
  // (react-hooks/refs). Updates funcionais (`prev => ...`) evitam
  // closures obsoletas sem precisar de ref nenhum.
  useEffect(() => {
    if (!active) return;

    function handleMouseOver(event: MouseEvent) {
      const el = (event.target as HTMLElement).closest("[data-editable]") as HTMLElement | null;
      const parsed = parseEditableTarget(el?.getAttribute("data-editable") ?? null);
      setHovered(el && parsed ? { el, ...parsed } : null);
    }

    function handleMouseOut(event: MouseEvent) {
      const related = event.relatedTarget as Node | null;
      setHovered((prev) => (prev && (!related || !prev.el.contains(related)) ? null : prev));
    }

    function handleReposition() {
      // Um objeto novo (mesmo conteúdo) força recalcular o rect no
      // render seguinte, sem disparar handleMouseOver/Out de novo.
      setHovered((prev) => (prev ? { ...prev } : prev));
    }

    document.addEventListener("mouseover", handleMouseOver);
    document.addEventListener("mouseout", handleMouseOut);
    window.addEventListener("scroll", handleReposition, true);
    window.addEventListener("resize", handleReposition);
    return () => {
      document.removeEventListener("mouseover", handleMouseOver);
      document.removeEventListener("mouseout", handleMouseOut);
      window.removeEventListener("scroll", handleReposition, true);
      window.removeEventListener("resize", handleReposition);
    };
  }, [active]);

  if (!active || !hovered || !adminOrigin) return null;

  const rect = hovered.el.getBoundingClientRect();

  return (
    <button
      type="button"
      aria-label="Remover"
      className="preview-delete-icon"
      style={{ top: rect.top - 8, left: rect.right - 16 }}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        window.parent.postMessage(
          { type: DELETE, entityType: hovered.entityType, id: hovered.id },
          adminOrigin,
        );
      }}
    >
      🗑
    </button>
  );
}
