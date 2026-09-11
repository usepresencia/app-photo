# Preview com edição inline — admin-photo + app-photo

**Data:** 2026-09-09
**Status:** aprovado, aguardando plano de implementação

## Contexto

O admin-photo (planos 6-11) já tem CRUD completo de `Niche`, `Package`,
`Photo`, `Placement` e `Profile` — cinco telas de formulário/tabela,
sem nenhuma relação visual com o site que elas de fato editam. Depois
de testar a UI ao vivo contra o Firebase Emulator Suite, o pedido foi:
mostrar o admin como se estivesse "dentro" do site público de verdade,
com botões de editar sobre o conteúdo, e que salvar ali já publique —
sem estado de rascunho, sem uma segunda cópia visual do site pra manter
sincronizada.

Restrição que atravessa todo o desenho: o `app-photo` é deliberadamente
**sem autenticação nenhuma** desde o plano 6 — decisão reafirmada aqui.
Nenhuma sessão, cookie ou lógica de admin entra no app-photo. O que ele
ganha é puramente cosmético: uma marcação inerte que só produz algum
efeito quando alguém (o admin-photo) confirma via protocolo que está
"do outro lado" — não é autenticação, é um acordo de mensagens entre
duas janelas.

## Decisão de arquitetura

**iframe do site real + handshake via `postMessage`.** O admin-photo
abre o app-photo de verdade dentro de um `<iframe>` — não uma
recriação visual (rejeitada: duplicaria todo o layout do site e sairia
de sincronia a cada mudança de design lá). O app-photo ganha um
componente cliente pequeno e por padrão inerte que só ativa um overlay
de edição depois de confirmar, por `postMessage`, que está sendo
carregado pelo admin-photo — nunca pra um visitante comum, nunca sem
esse aceno.

Editar continua reaproveitando 100% do CRUD já existente: clicar numa
seção do preview abre o mesmo modal (`EditNicheModal`,
`EditPackageModal`, `EditPlacementModal`) que a tela de tabela já usa
— nada de formulário novo. "Publicar" não é um conceito novo: é o save
que já existe, que já chama o webhook de revalidação (`planos 7-11`).
A única peça nova de verdade é o iframe recarregar depois de um save
bem-sucedido, pra mostrar o resultado sem precisar F5 manual.

## Modelo de superfícies editáveis

Cada seção visível do site vira um `<Editable type="..." id="...">`
(app-photo) envolvendo o trecho existente — não uma reescrita da UI,
um wrap.

| Página            | Seção                          | `type`      | `id`                                        |
| ----------------- | ------------------------------ | ----------- | ------------------------------------------- |
| `/` (home)        | Cada foto do hero (film strip) | `placement` | id do placement (`surface: "hero"`)         |
| `/` (home)        | Texto da seção "Quem sou"      | `profile`   | `"main"`                                    |
| `/` (home)        | Cada foto da seção "Quem sou"  | `placement` | id do placement (`surface: "quem-sou"`)     |
| `/` (home)        | Cada foto da galeria da home   | `placement` | id do placement (`surface: "home-gallery"`) |
| `/ensaios/[slug]` | Bloco de texto do nicho        | `niche`     | slug do nicho                               |
| `/ensaios/[slug]` | Cada card de pacote            | `package`   | id do pacote                                |
| `/ensaios/[slug]` | Cada foto da galeria do nicho  | `placement` | id do placement (`surface: "niche"`)        |

Clicar numa **foto**, em qualquer superfície, sempre abre o
`EditPlacementModal` — é o placement que decide qual foto ocupa aquele
slot, igual a tela de Posicionamentos já trata. Clicar num **nicho**
ou **pacote** abre o modal de edição da própria entidade (texto/preço/
itens), não do placement.

**Fora de escopo desta primeira versão:** criar conteúdo novo a partir
do preview (ex.: "adicionar uma foto neste slot vazio"). Criar continua
exclusivamente pelas telas de CRUD normais (`/niches`, `/packages`,
`/photos`, `/placements`). O preview só edita o que já existe.

## O que muda no `app-photo`

### Cabeçalhos de segurança (`next.config.ts`)

O app-photo hoje não define `headers()` nenhum — nada bloqueia nem
protege. Ganha os mesmos cabeçalhos que o admin-photo já tem
(`X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`,
`Strict-Transport-Security`), mais um `Content-Security-Policy` com
`frame-ancestors` liberando **só** a origem do admin-photo — não
`X-Frame-Options: DENY` (bloquearia o próprio admin) nem um
`frame-ancestors *` (qualquer site poderia iframar). A origem permitida
vem de uma env var nova, ver abaixo.

### `NEXT_PUBLIC_ADMIN_PHOTO_URL` (env var nova)

Origem do admin-photo (`http://localhost:3001` em dev,
`https://admin.denisegalvao.com.br` em produção) — única fonte da
verdade, usada tanto no `frame-ancestors` do `next.config.ts` quanto no
componente de overlay, pra validar a origem das mensagens recebidas.
Opcional: sem ela, o overlay nunca ativa (nenhuma origem confia
verdadeiramente em "qualquer um") e o `frame-ancestors` fica restrito a
`'self'` — o site funciona normalmente pra visitantes, só o preview do
admin não teria como se conectar.

### `<Editable>` (componente cliente novo)

`src/app/_components/Editable.tsx` — wrapper fino:

```tsx
"use client";
export function Editable({
  type,
  id,
  children,
}: {
  type: "niche" | "package" | "placement" | "profile";
  id: string;
  children: React.ReactNode;
}) {
  return <div data-editable={`${type}:${id}`}>{children}</div>;
}
```

Cada componente de página existente (Hero, seção Quem-sou, card de
pacote, galeria, bloco de texto do nicho) embrulha o trecho relevante
nele — a lista da tabela acima é o guia de onde.

### `PreviewOverlay` (componente cliente novo)

`src/app/_components/PreviewOverlay.tsx`, montado uma vez no layout
raiz. Fica inerte a não ser que `window.self !== window.top` (está
dentro de um iframe). Manda um ping pro pai ao montar; só ativa o modo
de overlay (contorno ao passar o mouse sobre qualquer `[data-editable]`,
clique dispara `postMessage({type: "edit", entityType, id}, adminOrigin)`)
depois de receber a confirmação do pai, validando `event.origin` contra
`NEXT_PUBLIC_ADMIN_PHOTO_URL`. Sem confirmação, sem overlay — o site
aparece idêntico ao normal.

## O que muda no `admin-photo`

### `NEXT_PUBLIC_APP_PHOTO_URL` (env var nova)

URL pública do app-photo, exposta ao browser — distinta da
`APP_PHOTO_URL` que já existe (essa é só de servidor, usada pelo
webhook de revalidação). Usada como `src` do iframe e pra validar a
origem das mensagens recebidas do app-photo.

### `/preview` (rota nova, entra no menu)

Server Component: busca `getNiches()`, `getPackages()`, `getPhotos()`,
`getPlacements()` — as mesmas 4 actions que `/placements` já usa, sem
nada novo do lado do servidor — e passa pro componente cliente.

### `PreviewFrame` (componente cliente novo)

Renderiza o `<iframe src={NEXT_PUBLIC_APP_PHOTO_URL}>`. Faz o handshake
(responde o ping do app-photo, validando origem nos dois sentidos).
Recebe `{type: "edit", entityType, id}`, consulta um registro:

```ts
const EDIT_HANDLERS: Record<string, (id: string) => void> = {
  niche: (id) => openNicheEdit(niches.find((n) => n.slug === id)),
  package: (id) => openPackageEdit(packages.find((p) => p.id === id)),
  placement: (id) => openPlacementEdit(placements.find((p) => p.id === id)),
};
```

Se a entidade não estiver na lista já carregada (preview aberto há
muito tempo, mudança feita em outra aba), mostra um toast pedindo pra
recarregar o preview, em vez de quebrar. Abre o modal já existente
correspondente. Ao salvar com sucesso (`result.ok` do `runMutation`,
já usado em todo modal), além do que o modal já faz (atualizar lista
local, fechar, toast), recarrega o iframe.

## Fluxo de dados de ponta a ponta

1. `/preview` carrega, busca as 4 listas, monta `PreviewFrame`.
2. iframe carrega o app-photo real; `PreviewOverlay` detecta que está
   num iframe, manda ping pro pai.
3. `PreviewFrame` recebe o ping, responde confirmando.
4. `PreviewOverlay` valida a origem da confirmação, ativa o overlay.
5. Usuário passa o mouse sobre uma seção → contorno (CSS puro, sem
   round-trip). Clica → `postMessage({type: "edit", entityType, id})`.
6. `PreviewFrame` valida a origem, resolve via `EDIT_HANDLERS`, abre o
   modal existente pré-preenchido.
7. Usuário salva → Server Action existente roda (Firestore write +
   webhook de revalidação, nada novo) → `onUpdated` atualiza a lista
   local do preview e recarrega o iframe.
8. iframe recarrega com o cache já invalidado pelo webhook do passo 7
   → conteúdo novo aparece → handshake (passos 2-4) se repete sozinho.

## Erros e casos extremos

- **Handshake nunca chega** (JS desabilitado, app-photo fora do ar):
  degrada bem — site real aparece sem overlay, nada quebra.
- **Mensagem de origem errada**: descartada silenciosamente.
- **Entidade clicada não está mais na lista carregada**: toast pedindo
  recarregar o preview.
- **Falha ao salvar**: já coberto pelo `runMutation` existente — toast
  de erro, modal continua aberto, iframe não recarrega.
- **iframe não carrega**: mensagem clara em vez de área em branco.

## Testes

- `PreviewOverlay` (app-photo): parsing de mensagens — handshake
  válido ativa overlay, origem errada é ignorada.
- `EDIT_HANDLERS`/`PreviewFrame` (admin-photo): tipo conhecido chama o
  handler certo; tipo desconhecido não quebra.
- Sem teste de integração com iframe real — jsdom não simula
  comunicação cross-document de forma confiável. Smoke test manual
  documentado no plano de implementação (mesmo padrão já usado nesta
  sessão pra fluxos que exigem navegador de verdade).

## Riscos / pontos de atenção

- **Volume de trabalho real está em instrumentar o site, não nos
  componentes novos.** `Editable`/`PreviewOverlay`/`PreviewFrame` são
  pequenos; embrulhar cada seção existente do app-photo (Hero, Quem-sou,
  galeria da home, texto do nicho, cards de pacote, galeria do nicho) é
  o grosso do esforço, espalhado por vários arquivos já existentes.
- **`frame-ancestors` liga o app-photo à origem do admin por env var** —
  se `NEXT_PUBLIC_ADMIN_PHOTO_URL` estiver errada ou ausente em
  produção, o preview simplesmente não conecta (falha visível, não
  silenciosa) — não é um risco de segurança, é um risco de
  configuração.
- **Sem teste automatizado real do handshake cross-document** — a
  cobertura de testes fica nas peças isoladas (parsing de mensagem,
  registro de handlers); a integração completa depende de smoke test
  manual, como já é o padrão desta sessão.

## Decisões já tomadas neste brainstorming

| decisão                              | escolha                                                                                  |
| ------------------------------------ | ---------------------------------------------------------------------------------------- |
| Onde o preview roda                  | admin-photo, iframando o app-photo real — não uma recriação visual                       |
| Autenticação no app-photo            | Nenhuma — continua exatamente como já era; o overlay é cosmético                         |
| Escopo inicial                       | Site inteiro de uma vez (home + todas as páginas de nicho), não incremental              |
| Criar conteúdo pelo preview          | Fora de escopo — só edição do que já existe                                              |
| Marcação de seções editáveis         | Componente `<Editable type id>` reutilizável, não atributo cru repetido                  |
| Roteamento de clique pro modal certo | Registro `EDIT_HANDLERS` central, não if/else crescendo por entidade                     |
| Atualização do preview após salvar   | Reload do iframe (o webhook de revalidação já existe, só faltava isso)                   |
| Cabeçalhos de segurança do app-photo | Ganha o mesmo conjunto do admin-photo, mais `frame-ancestors` restrito à origem do admin |
