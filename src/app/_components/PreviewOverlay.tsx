"use client";

import { useEffect, useState } from "react";
import { clientEnv } from "@/lib/config/env.client";

const PING = "app-photo:preview:ping";
const ACK = "app-photo:preview:ack";
const EDIT = "app-photo:preview:edit";
const EDIT_TEXT = "app-photo:preview:edit-text";
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

export function parseEditableTextTarget(
  value: string | null,
): { entityType: string; id: string; field: string } | null {
  if (!value) return null;
  const [entityType, id, field] = value.split(":");
  if (!entityType || !id || !field) return null;
  return { entityType, id, field };
}

// Os ícones flutuantes (lixeira, confirmar/cancelar) são irmãos do
// conteúdo, não filhos do elemento editável. Sem esta guarda, mover o
// mouse até eles conta como "saiu do editável": o hover zera, o botão
// desmonta antes do clique e, quando o ponteiro recai sobre o elemento,
// remonta — pisca-pisca que deixa o ícone inclicável.
export function isPreviewAffordance(node: EventTarget | null): boolean {
  return node instanceof Element && node.closest("[data-preview-affordance]") !== null;
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

interface TextEditing {
  el: HTMLElement;
  entityType: string;
  id: string;
  field: string;
  originalValue: string;
}

// Inerte por padrão — só ativa depois de confirmar, por postMessage, que
// está sendo carregado dentro do admin-photo (ver spec do preview com
// edição inline). Nunca ativa pra um visitante comum: fora de um iframe,
// ou dentro de um iframe de qualquer outra origem, esse componente não
// faz nada.
export function PreviewOverlay() {
  const [active, setActive] = useState(false);
  const [hovered, setHovered] = useState<HoveredEditable | null>(null);
  const [textEditing, setTextEditing] = useState<TextEditing | null>(null);
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

      const textEl = target.closest("[data-editable-text]") as HTMLElement | null;
      if (textEl) {
        const parsed = parseEditableTextTarget(textEl.getAttribute("data-editable-text"));
        if (parsed && textEditing?.el !== textEl) {
          event.preventDefault();
          event.stopPropagation();
          const originalValue = textEl.textContent ?? "";
          textEl.contentEditable = "true";
          textEl.focus();
          setTextEditing({ el: textEl, ...parsed, originalValue });
        }
        return;
      }

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
  }, [active, adminOrigin, textEditing]);

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
      if (isPreviewAffordance(event.target)) return;
      const el = (event.target as HTMLElement).closest("[data-editable]") as HTMLElement | null;
      const parsed = parseEditableTarget(el?.getAttribute("data-editable") ?? null);
      setHovered(el && parsed ? { el, ...parsed } : null);
    }

    function handleMouseOut(event: MouseEvent) {
      const related = event.relatedTarget as Node | null;
      if (isPreviewAffordance(related)) return;
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

  // "el" (dentro de textEditing, um useState) é o nó DOM real sendo
  // editado — guardado em state só pra ser lido durante o render (mesmo
  // motivo do "hovered" acima), não é dado gerenciado pelo React.
  // contentEditable/textContent são propriedades do próprio DOM; não há
  // alternativa via setState pra alternar/reverter isso num elemento que
  // o React não criou/controla — daí o eslint-disable em cada mutação.
  function confirmTextEdit() {
    if (!textEditing || !adminOrigin) return;
    const { el, entityType, id, field } = textEditing;
    const value = el.textContent ?? "";
    // eslint-disable-next-line react-hooks/immutability
    el.contentEditable = "false";
    window.parent.postMessage({ type: EDIT_TEXT, entityType, id, field, value }, adminOrigin);
    setTextEditing(null);
  }

  function cancelTextEdit() {
    if (!textEditing) return;
    const { el, originalValue } = textEditing;
    // eslint-disable-next-line react-hooks/immutability
    el.textContent = originalValue;
    el.contentEditable = "false";
    setTextEditing(null);
  }

  useEffect(() => {
    if (!textEditing) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        confirmTextEdit();
      } else if (event.key === "Escape") {
        event.preventDefault();
        cancelTextEdit();
      }
    }

    // blur é cancelar implícito — os ícones flutuantes usam
    // onMouseDown/preventDefault (ver o JSX abaixo) pra nunca causar
    // esse blur antes do próprio onClick deles disparar; então este
    // handler só roda pra "cliquei em outro lugar da página" (que já
    // não conta como confirmar).
    function handleBlur() {
      cancelTextEdit();
    }

    const el = textEditing.el;
    el.addEventListener("keydown", handleKeyDown);
    el.addEventListener("blur", handleBlur);
    return () => {
      el.removeEventListener("keydown", handleKeyDown);
      el.removeEventListener("blur", handleBlur);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- confirmTextEdit/cancelTextEdit fecham sobre textEditing/adminOrigin do próprio render; recriá-las a cada dependência já é coberto por este efeito rodar de novo quando textEditing muda
  }, [textEditing]);

  const hoveredRect = hovered?.el.getBoundingClientRect();
  const textEditingRect = textEditing?.el.getBoundingClientRect();

  return (
    <>
      {active && hovered && adminOrigin && hoveredRect && (
        <button
          type="button"
          aria-label="Remover"
          data-preview-affordance=""
          className="preview-delete-icon"
          style={{
            top: hoveredRect.top - 8,
            left: hoveredRect.right - 16,
          }}
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
      )}
      {active && textEditing && textEditingRect && (
        <div
          data-preview-affordance=""
          className="preview-textedit-icons"
          style={{
            top: textEditingRect.top - 32,
            right: window.innerWidth - textEditingRect.right,
          }}
        >
          <button
            type="button"
            aria-label="Confirmar"
            onMouseDown={(event) => event.preventDefault()}
            onClick={confirmTextEdit}
          >
            ✓
          </button>
          <button
            type="button"
            aria-label="Cancelar"
            onMouseDown={(event) => event.preventDefault()}
            onClick={cancelTextEdit}
          >
            ✗
          </button>
        </div>
      )}
    </>
  );
}
