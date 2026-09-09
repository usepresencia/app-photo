# Preview com criar/deletar/perfil — admin-photo + app-photo

**Data:** 2026-09-09
**Status:** aprovado, aguardando plano de implementação

## Contexto

O plano anterior (`2026-09-09-admin-preview-edicao-inline.md`) deu ao
`/preview` do admin-photo a capacidade de **editar** nichos, pacotes e
posicionamentos direto na página real, via clique + modal. O pedido
agora: remover o resto da UI do admin (telas de tabela em
`/niches`, `/packages`, `/photos`, `/placements`, `/profile`) e fazer o
login levar direto pro `/preview`, já que a edição inline supostamente
cobre tudo.

Não cobre. O preview de hoje só edita o que já existe na página —
**criar** um nicho/pacote/foto novo, **deletar** qualquer coisa e
**editar o perfil** do site não têm equivalente nenhum ali (perfil foi
propositalmente deixado fora do `EDIT_HANDLERS` no plano anterior).
Sem essas quatro capacidades, remover as telas antigas quebraria
funcionalidade de verdade — não dá pra criar um nicho novo, não dá pra
subir uma foto nova, o perfil do site fica travado no que já está lá.

Esta spec cobre **só** ampliar o preview com essas quatro capacidades.
Remover as telas antigas e redirecionar o login pro `/preview` é uma
segunda spec, deliberadamente adiada — só faz sentido depois que o que
está aqui estiver implementado e testado. Ver "Decisões já tomadas".

## Decisão de arquitetura

Estende o protocolo `postMessage` já existente (handshake +
`edit`) com dois tipos de mensagem novos:

- `{ type: "app-photo:preview:add", entityType, context }` — clique
  num marcador de "adicionar", em vez de num item existente.
- `{ type: "app-photo:preview:delete", entityType, id }` — clique no
  ícone de lixeira que aparece ao passar o mouse sobre um item
  editável (mesmo `entityType`/`id` do `edit`).

Do lado do app-photo, um componente novo `<Addable>` (mesmo padrão do
`Editable`: `"use client"`, atributo `data-*` cru, invisível fora do
modo preview via CSS) marca onde um "+" pode aparecer. O
`PreviewOverlay` ganha rastreio de hover de verdade (`mouseover`/
`mouseout`, não só CSS) pra desenhar o ícone de lixeira posicionado
sobre o item — o contorno de edição continua sendo CSS puro, só a
lixeira precisa de JS porque é um elemento novo, não um efeito visual
do próprio item.

Do lado do admin-photo, dois registros novos espelham o
`EDIT_HANDLERS` já existente:

```ts
const ADD_HANDLERS: Record<string, (context: unknown, ctx: PreviewLists) => void> = {
  niche: () => openNewNicheModal(),
  package: (context) =>
    openNewPackageModal({ nicheSlug: (context as { nicheSlug: string }).nicheSlug }),
  placement: (context) =>
    openAddPhotoModal(context as { surface: PhotoSurface; refId: string | null }),
};

const DELETE_HANDLERS: Record<string, (id: string, lists: PreviewLists) => DeleteTarget | null> = {
  niche: (id, lists) => {
    /* acha o niche, monta confirmação */
  },
  package: (id, lists) => {
    /* ... */
  },
  placement: (id, lists) => {
    /* remove só o posicionamento, não a foto */
  },
};
```

`EDIT_HANDLERS` ganha uma entrada nova, `profile`, que ignora o `id`
recebido (o perfil é um singleton, `profile/main`) e abre o
`EditProfileModal` novo.

## Modelo de superfícies "adicionáveis"

| Página            | Onde entra o `+`                              | `type`      | `context`                                |
| ----------------- | --------------------------------------------- | ----------- | ---------------------------------------- |
| `/` (home)        | Fim do carrossel de nichos (`Niches.tsx`)     | `niche`     | nenhum                                   |
| `/ensaios/[slug]` | Fim da grade de pacotes (`PackagePicker.tsx`) | `package`   | `{ nicheSlug }`                          |
| `/` (home)        | Fim do film strip do hero                     | `placement` | `{ surface: "hero" }`                    |
| `/` (home)        | Fim da seção Quem sou                         | `placement` | `{ surface: "quem-sou" }`                |
| `/` (home)        | Fim da galeria da home                        | `placement` | `{ surface: "home-gallery" }`            |
| `/ensaios/[slug]` | Fim da galeria do nicho                       | `placement` | `{ surface: "niche", refId: nicheSlug }` |

Clicar num `+` de tipo `placement` abre o `AddPhotoModal` (passo 1:
upload; passo 2: papel/ordem do posicionamento) já sabendo
`surface`/`refId` — só falta escolher o arquivo e, se a superfície
usa papéis com sentido (quem-sou: "capa"/"polaroid-1"/etc.), o papel
certo.

Fora desta lista: **fotos órfãs** (sem posicionamento nenhum) não têm
onde aparecer no site publicado, por definição — cobertas pelo painel
lateral do `/preview`, não por um `Addable` (ver seção própria).

## O que muda no app-photo

### `<Addable>` (componente cliente novo)

`src/app/_components/Addable.tsx` — mesmo padrão do `Editable`:

```tsx
"use client";
export function Addable({
  type,
  context,
  className = "",
  children,
}: {
  type: "niche" | "package" | "placement";
  context?: Record<string, string>;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div data-addable={`${type}:${context ? JSON.stringify(context) : ""}`} className={className}>
      {children}
    </div>
  );
}
```

`data-addable` fica separado de `data-editable` de propósito — o
`PreviewOverlay` precisa distinguir "isto é um alvo de edição" de
"isto é um alvo de criação" pra montar a mensagem certa
(`edit` vs. `add`), e misturar os dois num atributo só (ex.: prefixo
`"add:"` dentro de `data-editable`) obrigaria todo consumidor de
`data-editable` a filtrar esse caso — mais frágil que dois atributos
distintos.

`context` vira JSON dentro do atributo (não um segundo `:` cru como em
`data-editable`, que já usa o primeiro `:` pra separar tipo de id) —
`{ surface: "niche", refId: "familia" }` tem mais de um campo, e um
esquema de delimitador customizado pra isso seria mais frágil que
`JSON.stringify`/`JSON.parse`, que já resolve aninhamento e escaping
de vírgula/dois-pontos dentro dos próprios valores.

CSS do modo preview (Task 4 do plano anterior) ganha uma regra
irmã pra `[data-addable]`, com o mesmo `pointer-events`/`cursor`, mas
**visível só em modo preview** (por padrão, `display: none` —
diferente de `[data-editable]`, que já existe visualmente no site
normal e só ganha contorno extra no hover).

### `PreviewOverlay` — hover de verdade + ícone de lixeira

Além do delegado de clique já existente (que passa a checar também
`[data-addable]`, montando a mensagem `add`), `PreviewOverlay` ganha
um `mouseover`/`mouseout` no `document` (só ativo quando `active` é
`true`) que rastreia qual `[data-editable]` está sob o mouse. Enquanto
há um hover ativo, renderiza um botão fixo (ícone de lixeira),
posicionado via `getBoundingClientRect()` do elemento sob o mouse,
recalculado em `scroll`/`resize`. Clicar nele dispara
`{ type: "app-photo:preview:delete", entityType, id }` — mesmos
`entityType`/`id` que um `edit` naquele elemento usaria, já que a
lixeira só aparece em cima de itens já `data-editable`.

## O que muda no admin-photo

### `ADD_HANDLERS` / `DELETE_HANDLERS` (registros novos)

Mesmo padrão do `EDIT_HANDLERS` (`src/app/preview/_components/editHandlers.ts`):
tipo conhecido resolve pra uma ação; tipo desconhecido não quebra.
`ADD_HANDLERS` abre o modal certo (já preenchido com o `context`
recebido); `DELETE_HANDLERS` resolve a entidade pelo `id` e monta o
texto de confirmação (reaproveita o `ConfirmationDialog` que as
Managers já usam) antes de chamar a action de exclusão certa
(`deleteNiche`/`deletePackage`/`deletePlacement`).

Deletar um item `placement` remove **só o posicionamento** — a foto em
si (`Photo`) continua existindo, igual a tela `/placements` já
funciona hoje. Excluir a foto de verdade só acontece pelo painel de
fotos órfãs (ver abaixo).

### `EDIT_HANDLERS` ganha `profile`

```ts
profile: (_id, lists) => ({ kind: "profile", profile: lists.profile }),
```

`PreviewFrame` passa a buscar `getProfile()` também (a mesma action
que `/profile` já usa) e guardar num state próprio, igual às outras
quatro listas.

### `EditProfileModal` (componente novo)

`src/app/preview/_components/EditProfileModal.tsx` — wrapper fino:
`Dialog` + `DialogContent` envolvendo o `ProfileForm` já existente
(`src/app/profile/_components/ProfileForm.tsx`), sem tocar no
`ProfileForm` em si (ele já é autocontido — gerencia seu próprio
estado, chama `saveProfile` direto, usa `runMutation`).

### `AddPhotoModal` (componente novo, 2 passos)

`src/app/preview/_components/AddPhotoModal.tsx` — um único `Dialog`
com estado interno `step: 1 | 2`:

- **Passo 1** (upload): mesmo `<input type="file">` + chamada a
  `uploadToCloudinary` que o `UploadPhotoModal` já usa — mas **não**
  chama `createPhoto` ainda. Ao terminar o upload, guarda
  `{ cloudinaryPublicId, width, height }` em state e avança pro passo 2.
- **Passo 2** (posicionamento): campos de papel/ordem reaproveitando o
  `PlacementForm` já existente e seus mesmos valores padrão
  (`EMPTY_PLACEMENT_FORM`: ordem começa em `'0'`, sem cálculo
  automático de "próxima posição livre") — o `NewPlacementModal` de
  hoje já funciona assim, sem nenhuma lógica de auto-incremento; este
  modal não inventa uma nova. Surface/refId vêm fixos do `context`, só
  papel e ordem ficam editáveis. Confirmar chama `createPhoto` (cria a
  foto) e, com o id retornado, `createPlacement` (cria o posicionamento
  na superfície certa) em sequência — se `createPlacement` falhar
  depois de `createPhoto` ter sucesso, a foto fica órfã (aparece no
  painel lateral pra tentar de novo, não é um estado quebrado).

### Painel de fotos órfãs (`/preview`)

Painel retrátil (botão de abrir/fechar) na página `/preview`, fora do
iframe — lista `photos.filter(p => não aparece em nenhum placements)`.
Cada linha tem miniatura + botão "Remover" (chama `deletePhoto`,
único lugar do preview que apaga o **asset**, não um posicionamento).
Um botão "Enviar foto" no topo do painel abre o `UploadPhotoModal`
exatamente como ele já existe hoje (upload solto, sem posicionamento —
a foto nasce órfã de propósito, pra usar depois via algum `+` de
galeria).

## Fluxo de dados — criar

1. Usuário passa o mouse sobre um `+` (`Addable`) → contorno CSS
   (mesmo mecanismo do `Editable`).
2. Clique → `PreviewOverlay` monta `{ type: "add", entityType, context }`
   a partir do `data-addable`, manda pro admin.
3. `PreviewFrame` resolve via `ADD_HANDLERS`, abre o modal certo
   (`NewNicheModal`/`NewPackageModal`/`AddPhotoModal`) já preenchido
   com o `context`.
4. Salvar chama a action de criação já existente (`createNiche`/
   `createPackage`/`createPhoto`+`createPlacement`) — o webhook de
   revalidação já dispara dentro dessas actions, sem mudança.
5. Modal fecha, lista local do `/preview` atualiza, iframe recarrega
   (mesmo `reloadIframe()` do fluxo de edição).

## Fluxo de dados — deletar

1. Hover sobre um item `data-editable` → `PreviewOverlay` rastreia via
   `mouseover`, desenha o ícone de lixeira posicionado sobre ele.
2. Clique na lixeira → `{ type: "delete", entityType, id }` pro admin.
3. `PreviewFrame` resolve via `DELETE_HANDLERS`, abre
   `ConfirmationDialog` com o texto certo pra aquela entidade.
4. Confirmar chama a action de exclusão já existente (`deleteNiche`/
   `deletePackage`/`deletePlacement`).
5. Lista local atualiza (remove o item), iframe recarrega.

## Erros e casos extremos

- **`createPlacement` falha depois de `createPhoto` ter sucesso** (passo 2
  do `AddPhotoModal`): a foto fica órfã — aparece no painel lateral,
  não é um estado quebrado nem exige limpeza manual.
- **`context` de um `Addable` referencia um nicho que não existe mais**
  (ex.: aba aberta há muito tempo, nicho removido em outra aba): mesmo
  tratamento do `EDIT_HANDLERS` hoje — toast pedindo pra recarregar,
  em vez de abrir um modal com dado inconsistente.
- **Confirmação de exclusão cancelada**: fecha o `ConfirmationDialog`,
  nada acontece — mesmo padrão das Managers hoje.
- **Falha ao deletar**: já coberto pelo `runMutation` existente — toast
  de erro, item continua na lista.
- **Painel de fotos órfãs vazio**: mensagem simples ("nenhuma foto sem
  posicionamento"), não esconde o painel inteiro.

## Testes

- `Addable` (app-photo): mesmo padrão do teste do `Editable` — atributo
  `data-addable` no formato certo, `className` repassado.
- `PreviewOverlay` (app-photo): funções puras de parsing de `add`/
  `delete` testadas isoladamente, mesmo padrão de `parseEditableTarget`/
  `isHandshakeAck` já existente. Posicionamento do ícone de lixeira via
  `getBoundingClientRect` não é testado automaticamente (depende de
  layout real do browser) — coberto pelo smoke test manual.
- `ADD_HANDLERS`/`DELETE_HANDLERS` (admin-photo): mesmo padrão de teste
  puro do `EDIT_HANDLERS` já existente — tipo conhecido chama o
  handler certo, tipo desconhecido não quebra.
- Sem teste de integração do fluxo de 2 passos do `AddPhotoModal` nem
  do painel de fotos órfãs — smoke test manual documentado no plano de
  implementação, mesmo padrão já usado nesta sessão.

## Riscos / pontos de atenção

- **Posicionamento do ícone de lixeira é a peça mais frágil desta
  spec** — depende de `getBoundingClientRect` recalculado em
  scroll/resize dentro de um iframe; peça candidata a precisar de
  ajuste fino durante a implementação, mais do que qualquer outra
  parte.
- **`AddPhotoModal` de 2 passos introduz um estado intermediário real**
  (foto criada, posicionamento não) — mitigado pelo painel de fotos
  órfãs, que vira a rede de segurança pra esse caso, não um bug.
- **Volume de trabalho está espalhado nos dois repos de novo** —
  `Addable` + instrumentação de 6 pontos no app-photo, mais os
  registros/modais/painel no admin-photo.

## Decisões já tomadas neste brainstorming

| decisão                                      | escolha                                                                                                                                                                                                |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Onde ficam os botões de criar                | Dentro do iframe, perto de onde o item apareceria (`Addable`), não numa barra fora dele                                                                                                                |
| Como funciona o deletar                      | Ícone de lixeira separado, ao lado do contorno de hover — não um botão dentro do modal de edição                                                                                                       |
| Fluxo de "adicionar foto" numa galeria       | Um modal novo (`AddPhotoModal`) com 2 passos internos — upload, depois posicionamento                                                                                                                  |
| Fotos sem posicionamento nenhum              | Painel lateral leve no `/preview`, fora do iframe — não uma tela de tabela completa de novo                                                                                                            |
| Deletar um posicionamento vs. deletar a foto | São ações diferentes — deletar `placement` só desvincula; deletar a foto de verdade só existe no painel de órfãs                                                                                       |
| Escopo desta spec                            | Só ampliar o preview — remover as telas antigas (`/niches`, `/packages`, `/photos`, `/placements`, `/profile`) e redirecionar o login pro `/preview` viram uma segunda spec, depois desta estar pronta |
