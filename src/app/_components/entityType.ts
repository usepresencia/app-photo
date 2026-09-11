// Tipo compartilhado do "type" que Editable/Addable/EditableText embutem
// nos atributos data-editable/data-addable/data-editable-text, lidos por
// PreviewOverlay.tsx (e, do lado do admin-photo, por PreviewFrame.tsx).
// Editable.tsx usa o conjunto completo; Addable.tsx e EditableText.tsx
// usam só o subconjunto que faz sentido pro seu propósito (ver os tipos
// derivados abaixo).
export type EntityType = "niche" | "package" | "placement" | "profile" | "testimonial";

// Addable não cria um "testimonial" (avaliação individual) — o "+" ali
// sincroniza a seção inteira de avaliações com o Google, por isso troca
// "testimonial" pela variante plural "testimonials". Não é erro de
// digitação: o admin-photo (PreviewFrame.tsx) lê esse valor literal
// ("testimonials") pra disparar essa sincronização, então o texto exato
// não pode mudar aqui sem coordenar os dois lados.
export type AddableEntityType = Exclude<EntityType, "profile" | "testimonial"> | "testimonials";
