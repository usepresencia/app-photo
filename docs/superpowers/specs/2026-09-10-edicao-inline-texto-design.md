# Edição inline de texto — admin-photo + app-photo

**Data:** 2026-09-10
**Status:** aprovado, aguardando plano de implementação

## Contexto

Hoje, `<Editable type="niche|package|profile" id="...">` embrulha o
**bloco inteiro** de uma entidade (o card de nicho, o card de pacote, a
seção de texto do perfil) — clicar em qualquer lugar dentro dele abre
um modal com todos os campos daquela entidade de uma vez
(`EditNicheModal`/`EditPackageModal`/`EditProfileModal`). O pedido
agora: editar campo por campo, direto no lugar onde o texto aparece,
sem passar por modal nenhum. Isso vale pras 3 entidades cujo conteúdo
é essencialmente texto — nicho, pacote e perfil — não pra `placement`
(foto), que continua com seu fluxo de picker já existente, nem pra
campos que não são texto visível (`order`, `showAsEventTeaser`,
`featured`, `nicheSlug`), que seguem editáveis só pelas telas antigas
(`/niches`, `/packages`), ainda não removidas.

Esta spec depende da spec de rascunho/publicar
(`2026-09-09-rascunho-publicar-design.md`, já implementada) — toda
escrita daqui grava em rascunho, nada some. Sem essa base, editar um
parágrafo de nicho "no ar" a cada tecla seria inaceitável.

## Achado ao investigar o código atual

Em 3 lugares diferentes, o `<Editable>` de bloco embrulha um `<Link>`
ou botão real (`Niches.tsx`, `Events.tsx`: card de nicho linka pra
`/ensaios/[slug]`; `PackagePicker.tsx`: card de pacote seleciona o
pacote) — em modo preview isso **intercepta esse clique**, e hoje é
literalmente impossível navegar clicando nesses cards estando no
`/preview`. Trocar pra edição pontual de texto resolve isso de graça:
só o texto específico vira alvo de clique, o resto do card volta a se
comportar normalmente. Isso inclui a tela de detalhe do pacote
(descrita no inventário abaixo) — hoje inalcançável em preview pelo
mesmo motivo (o card inteiro intercepta o clique de "selecionar
pacote"), e que ganha campos editáveis novos que não existiam antes.

Também achei dois campos de perfil (`profile.capaCaption` e
`profile.familia.legendaFoto`) que hoje ficam **dentro** de um
`<Editable type="placement">` (a legenda de uma foto), não dentro de
um `<Editable type="profile">` — ou seja, não têm hoje nenhum caminho
de edição via preview (só dá pra trocar a foto ao lado, não o texto da
legenda). A edição inline resolve isso também, embrulhando o texto
específico independente da foto ao lado.

## Decisão de arquitetura

Componente novo, `<EditableText>`, marca um texto específico (não um
bloco inteiro) como editável — sem depender de um clique ser
repassado pro admin abrir modal nenhum: o próprio texto vira
editável **dentro do iframe**, in-line, e só a confirmação final
manda uma mensagem pro admin salvar.

```tsx
"use client";
export function EditableText({
  type,
  id,
  field,
  as: Tag = "span",
  className = "",
  children,
}: {
  type: "niche" | "package" | "profile";
  id: string;
  field: string;
  as?: keyof React.JSX.IntrinsicElements;
  className?: string;
  children: string;
}) {
  return (
    <Tag data-editable-text={`${type}:${id}:${field}`} className={className}>
      {children}
    </Tag>
  );
}
```

`data-editable-text` é um atributo **novo**, separado de
`data-editable`/`data-addable` — mesma razão de sempre (distinguir o
tipo de alvo sem sobrecarregar um atributo só). `field` é o caminho do
campo dentro da entidade: `"title"` (escalar), `"description.1"`
(item de array), `"profissao.paragrafos.2"` (aninhado + array). Cada
parágrafo/item de lista já renderiza como seu próprio nó no DOM
(`.map()`) — cada um ganha seu próprio `<EditableText>`, próprio
`field` com o índice.

**`EditableText` pode ficar aninhado dentro de um `<Editable
type="placement">`** (caso do `capaCaption`/`legendaFoto`, que ficam
ao lado de uma foto). Isso funciona sem nenhum truque de
`stopPropagation` na declaração: o handler de clique do
`PreviewOverlay` já resolve isso pela **ordem dos `.closest()`**,
verificando `[data-editable-text]` antes de cair pro `[data-editable]`
genérico — ver seção seguinte.

### Mecânica de edição (dentro do próprio iframe, sem round-trip pro admin)

Diferente do fluxo de `placement`/bloco-inteiro (clique → manda
mensagem → admin abre modal), aqui **entrar em modo de edição é local,
só a confirmação final é que sai do iframe**:

1. Clique num `[data-editable-text]` → `PreviewOverlay` (a) guarda o
   texto atual do nó (`el.textContent`) num state próprio, (b) seta
   `el.contentEditable = "true"` nesse nó específico, (c) foca nele,
   (d) passa a rastrear esse nó como "em edição" (mesma técnica de
   posicionamento via `getBoundingClientRect` já usada pro ícone de
   lixeira, mas disparada por foco, não por hover).
2. Enquanto em edição, um par de ícones flutuantes (✓/✗) aparece
   posicionado sobre o nó. Cada botão usa
   `onMouseDown={e => e.preventDefault()}` — sem isso, o clique no
   ícone tiraria o foco do `contentEditable` (blur) antes do `onClick`
   dele disparar, perdendo a edição.
3. **Confirmar** (clique no ✓, ou `Enter` sem Shift — nenhum destes
   campos tem quebra de linha própria, então `Enter` sempre confirma
   em vez de inserir uma linha nova): manda
   `{ type: "app-photo:preview:edit-text", entityType, id, field,
value: el.textContent }` pro admin, `contentEditable = "false"`,
   para de rastrear.
4. **Cancelar** (clique no ✗, `Escape`, ou perder o foco sem confirmar
   — blur é tratado como cancelar implícito, não como salvar
   silencioso): `el.textContent` volta pro valor guardado no passo 1,
   `contentEditable = "false"`, para de rastrear.

### `PreviewOverlay` — ordem de resolução do clique

O handler de clique (documento, fase de captura) ganha uma checagem
nova, **antes** da checagem de `[data-editable]` já existente:

```ts
const textEl = target.closest("[data-editable-text]");
if (textEl && !isEditingText(textEl)) {
  event.preventDefault();
  event.stopPropagation();
  enterTextEditMode(textEl);
  return;
}
// ... checagem de [data-addable] e [data-editable] continuam depois, inalteradas
```

(`isEditingText` evita reabrir/perder o cursor se o usuário clicar de
novo dentro do mesmo nó já em edição — um clique ali deve posicionar o
cursor normalmente, não reiniciar o estado.)

## O que muda no admin-photo

### Nova mensagem `edit-text` no `PreviewFrame`

Mesmo padrão das constantes `PING`/`ACK`/`EDIT`/`ADD`/`DELETE` já
existentes (strings literais duplicadas manualmente em
`PreviewOverlay.tsx` e `PreviewFrame.tsx`, com o comentário "mantenha
sincronizado" já usado nelas) — `EDIT_TEXT = "app-photo:preview:edit-text"`
segue o mesmo esquema, nos dois arquivos.

```ts
if (event.data?.type === EDIT_TEXT) {
    const { entityType, id, field, value } = event.data;
    void applyTextEdit(entityType, field, value, { niches, packages, profile }).then(
        (result) => {
            if (!result.ok) {
                showToast({ message: result.error, variant: 'error' });
                return;
            }
            // atualiza a lista local (niche/package) ou o profile, sem
            // fechar nada — não existe modal aberto aqui
            ...
            reloadIframe();
        },
    );
    return;
}
```

### `applyTextEdit` + `setValueAtPath` (lógica pura + orquestração)

Função pura, reutilizada pelas 3 entidades — dado um valor (escalar ou
array/objeto aninhado) e um caminho, devolve uma cópia com o valor no
caminho substituído:

```ts
export function setValueAtPath<T>(current: T, path: string[], value: string): T {
  if (path.length === 0) return value as unknown as T;
  const [head, ...rest] = path;
  if (Array.isArray(current)) {
    const index = Number(head);
    const clone = [...current];
    clone[index] = setValueAtPath(clone[index], rest, value);
    return clone as unknown as T;
  }
  const obj = current as Record<string, unknown>;
  return { ...obj, [head]: setValueAtPath(obj[head], rest, value) } as T;
}
```

`applyTextEdit(entityType, field, value, lists)` decide, por
`entityType`, como aplicar o patch e qual action existente chamar:

- **niche/package**: `updateNiche`/`updatePackage` já aceitam
  `Partial<...>` (confirmado no código real, sem mudança nenhuma
  necessária nelas). `field.split(".")` → primeiro segmento é o nome
  do campo top-level (`"title"`, `"description"`, `"items"` etc.); o
  patch roda só na PRÓPRIA VALOR daquele campo (`setValueAtPath(niche[topField], resto do caminho, value)`),
  e a action é chamada só com `{ [topField]: patchedValue }` — parcial
  de verdade, não reenvia a entidade inteira.
- **profile**: `saveProfile` exige o objeto completo (sem mudança
  nele também). O patch roda no objeto `profile` INTEIRO
  (`setValueAtPath(profile, field.split("."), value)`, caminho
  completo desde a raiz — ex.: `"profissao.paragrafos.2"`), e
  `saveProfile(profilePatchado)` salva tudo de uma vez.

Como `updateNiche`/`updatePackage`/`saveProfile` **já escrevem em
`_draft`** (spec de rascunho/publicar já implementada), nenhuma
mudança extra é necessária pra isso — a edição de texto já nasce como
rascunho, sem nenhuma lógica nova de "onde salvar".

### `EDIT_HANDLERS`/`PreviewFrame` — remove o caminho de bloco pras 3 entidades

`EditTarget`/`EDIT_HANDLERS` (`editHandlers.ts`) perdem as entradas
`niche`/`package`/`profile` — sobra só `placement` (troca de foto,
inalterado). `PreviewFrame.tsx` para de importar/renderizar
`EditNicheModal`, `EditPackageModal` e `EditProfileModal` (os
componentes em si continuam existindo — as telas antigas `/niches`,
`/packages`, `/profile` ainda os usam). `resolveEditHandler` deixa de
ser chamado pra essas 3 entidades porque `PreviewOverlay` nunca mais
vai gerar um `data-editable="niche:..."` (etc.) pra clicar — só
`data-editable="placement:..."`, que continua existindo pra swap de
foto.

## Inventário completo — cada campo, onde renderiza, `field`

### Nicho

| Arquivo:linha (app-photo)                            | Campo           | `field`             | Observação                                                  |
| ---------------------------------------------------- | --------------- | ------------------- | ----------------------------------------------------------- |
| `_components/Niches.tsx` (home, carrossel)           | title, subtitle | `title`, `subtitle` | Card linka pra `/ensaios/[slug]` — hoje quebrado em preview |
| `_components/Events.tsx` (home, eventos)             | title, subtitle | `title`, `subtitle` | Mesmo card, outra seção da home                             |
| `ensaios/[slug]/_components/NicheHero.tsx`           | title, subtitle | `title`, `subtitle` | Topo da própria página do nicho                             |
| `ensaios/[slug]/page.tsx` (bloco de intro/descrição) | intro           | `intro`             | Um `<p>` só, condicional (`{niche.intro && ...}`)           |
| idem                                                 | description[]   | `description.<i>`   | `.map()`, cada item já é seu próprio `<p>`                  |
| idem                                                 | highlights[]    | `highlights.<i>`    | `.map()`, cada item já é seu próprio `<li>`                 |

`closingLine` não renderiza em lugar nenhum do app-photo hoje (campo
morto) — fora do escopo, não ganha `EditableText` (não há onde
embrulhar).

### Pacote

| Arquivo:linha (app-photo)                                               | Campo       | `field`         | Observação                                                                            |
| ----------------------------------------------------------------------- | ----------- | --------------- | ------------------------------------------------------------------------------------- |
| `ensaios/[slug]/_components/PackagePicker.tsx` (card, lista de pacotes) | name, price | `name`, `price` | Card seleciona o pacote — hoje quebrado em preview                                    |
| idem (tela de detalhe, `{pack && ...}`)                                 | name, price | `name`, `price` | **Sem `Editable` nenhum hoje** — primeira vez que esses 2 campos ficam editáveis aqui |
| idem (tela de detalhe)                                                  | description | `description`   | Escalar (string), não array — **sem `Editable` nenhum hoje**                          |
| idem (tela de detalhe, `pack.items.map`)                                | items[]     | `items.<i>`     | Cada item já é seu próprio `<li>` — **sem `Editable` nenhum hoje**                    |

### Perfil

| Arquivo:linha (`_components/About.tsx`)                               | Campo                      | `field`                        | Observação                                                      |
| --------------------------------------------------------------------- | -------------------------- | ------------------------------ | --------------------------------------------------------------- |
| Dentro do 1º `<Editable type="placement" id={family[0].placementId}>` | capaCaption                | `capaCaption`                  | Hoje sem caminho de edição — nested num `Editable` de placement |
| 1º `<Editable type="profile" id="main">`                              | profissao.titulo, .eyebrow | `profissao.titulo`, `.eyebrow` |                                                                 |
| idem (`.map()`)                                                       | profissao.paragrafos[]     | `profissao.paragrafos.<i>`     |                                                                 |
| 2º `<Editable type="profile" id="main">` (mais abaixo na página)      | familia.titulo             | `familia.titulo`               |                                                                 |
| idem (`.map()`)                                                       | familia.paragrafos[]       | `familia.paragrafos.<i>`       |                                                                 |
| Dentro do `<Editable type="placement" id={family[2].placementId}>`    | familia.legendaFoto        | `familia.legendaFoto`          | Hoje sem caminho de edição — nested num `Editable` de placement |

## Fluxo de dados

1. Clique num `[data-editable-text]` → `PreviewOverlay` entra em modo
   de edição local (sem sair do iframe): `contentEditable=true`,
   foco, ícones ✓/✗ flutuantes.
2. Usuário digita, confirma (✓ ou Enter) ou cancela (✗, Esc, blur).
3. Confirmar → `{ type: "edit-text", entityType, id, field, value }`
   pro admin.
4. `PreviewFrame` resolve via `applyTextEdit`, que monta o patch certo
   (`setValueAtPath`) e chama a action existente
   (`updateNiche`/`updatePackage`/`saveProfile` — já grava em
   rascunho).
5. Sucesso: atualiza a lista local (niche/package) ou o `profile`
   local, `reloadIframe()`. Falha: toast de erro — o texto no iframe
   já está com o valor novo (contentEditable já confirmou
   visualmente); um `reloadIframe()` nunca acontece nesse caminho, e
   como a origem da verdade é o rascunho no Firestore (não mudou), a
   PRÓXIMA vez que a página recarregar (troca de aba, F5) o texto
   volta pro valor antigo — não fica uma inconsistência permanente.

## Erros e casos extremos

- **Confirmar um campo vazio** (usuário apaga todo o texto e aperta
  Enter): permitido — mesmo campo aceita string vazia hoje via
  `NicheForm`/`PackageForm` (nenhuma validação de "não vazio" existe
  nesses formulários atualmente); a spec não introduz uma regra nova
  que não existia.
- **`updateNiche`/`updatePackage`/`saveProfile` falha** (ex.: sessão
  expirada): toast de erro, texto no DOM já mudou visualmente mas o
  Firestore não — ver "Fluxo de dados" item 5, se autocorrige no
  próximo reload.
- **Clique em outro `[data-editable-text]` enquanto um já está em
  edição**: cancela o primeiro (mesmo comportamento de blur — reverte
  pro valor salvo) antes de entrar no segundo. Nunca dois nós
  editáveis ao mesmo tempo.
- **`field` não existe na entidade carregada** (ex.: aba antiga,
  entidade mudou de forma entre deploys): `applyTextEdit` retorna
  erro, toast pedindo pra recarregar — mesmo padrão do
  `resolveEditHandler` hoje pra um id não encontrado.

## Testes

- `parseEditableTarget`-style: uma função pura nova, tipo
  `parseEditableTextTarget(value: string | null)`, faz o parse de
  `"niche:familia:description.1"` → `{ entityType, id, field }` —
  testada isoladamente, mesmo padrão de `parseEditableTarget`/
  `parseAddableTarget` já existente.
- `setValueAtPath` (admin-photo): função pura, testada com os 3
  formatos de caminho (escalar, array de 1 nível, aninhado + array) —
  fácil de isolar, sem tocar Firestore/DOM.
- `applyTextEdit`: testado com mocks das 3 actions (`updateNiche`/
  `updatePackage`/`saveProfile`), confirmando que o patch parcial
  certo é montado pra cada `entityType`.
- Mecânica de `contentEditable`/ícones flutuantes/posicionamento via
  `getBoundingClientRect`: **não** testada automaticamente (depende de
  layout real do browser) — smoke test manual, mesmo padrão já
  estabelecido nesta sessão pro ícone de lixeira.

## Riscos / pontos de atenção

- **Maior mudança de UX desta série** — a experiência de editar texto
  deixa de ser "clique → modal" e vira "clique → edita ali mesmo".
  Candidato a precisar de ajuste fino durante a implementação
  (posicionamento dos ícones, comportamento de blur) mais do que
  qualquer peça puramente lógica desta spec.
- **`contentEditable` em elementos com filhos complexos**: os campos
  desta spec são todos texto puro (sem HTML aninhado dentro do
  `<h3>`/`<p>`/`<li>`), então `el.textContent` como valor é seguro —
  não cobre (nem precisa cobrir) um campo que um dia tenha HTML rico
  dentro.
- **Remoção do caminho de bloco quebra qualquer teste que dependa de
  `EditNicheModal`/`EditPackageModal`/`EditProfileModal` abrindo a
  partir do `/preview`** — plano de implementação precisa localizar e
  atualizar esses testes (`editHandlers.test.ts` certamente; conferir
  se `PreviewFrame` tem algum teste que hoje cubra esse caminho antes
  de removê-lo).

## Decisões já tomadas neste brainstorming

| decisão                                        | escolha                                                                                                              |
| ---------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Escopo                                         | Todos os blocos de texto de nicho, pacote e perfil — não só um bloco específico                                      |
| Mecanismo de edição                            | `contentEditable` no próprio elemento (não troca por `<textarea>`)                                                   |
| Parágrafos/itens de array                      | Cada um vira seu próprio bloco editável independente — não um textarea com o array inteiro                           |
| Gatilho de salvar                              | Par de ícones flutuante (✓/✗) ao focar — não salva ao perder o foco, não exige Enter                                 |
| Onde os dados são gravados                     | Rascunho (reaproveita `updateNiche`/`updatePackage`/`saveProfile`, já convertidos pela spec de publicar)             |
| Modal de bloco inteiro (niche/package/profile) | Removido do `/preview` — campos não-texto (order, showAsEventTeaser, featured, nicheSlug) ficam só nas telas antigas |
