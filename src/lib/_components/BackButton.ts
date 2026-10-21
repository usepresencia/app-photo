// Visual único de "voltar" do site — círculo com borda rose, fundo com
// blur e ícone — hoje usado por uma navegação real (NicheHero.tsx, via
// <Link>) e por um toggle de estado (AboutFlip.tsx, via <button>). Mesmo
// padrão do ADD_PILL_CLASSNAME em Addable.tsx: cada chamador soma só o
// posicionamento próprio (ex.: absolute left-5 top-6 em NicheHero).
export const BACK_BUTTON_CLASSNAME =
  "flex size-10 items-center justify-center rounded-full border border-rose/40 bg-background/50 text-rose backdrop-blur-sm transition-colors hover:border-rose";
