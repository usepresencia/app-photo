# Legenda de fotos polaroide — Design

**Goal:** simplificar o fluxo de "nova foto" no preview (tirar o passo de posicionamento) e fazer o campo hoje chamado `role` virar uma legenda de verdade (`caption`), exibida nas três superfícies com visual de polaroide — home-gallery (já funciona), niche e quem-sou (não funcionam hoje).

**Contexto:** este spec depende do trabalho já implementado nesta sessão (rascunho/publicar, edição inline de texto). Não re-implementa nada daquilo — só consome as mesmas actions/entidades já draft-aware.

## Non-goals

- Sem migração de dados: confirmado com o usuário que não há Firestore real em produção, só emulador/dev local. O rename `role`→`caption` é direto, sem script de migração, sem backfill.
- Sem mudança na página `/placements` (CRUD completo, `identityEditable={true}`): o campo lá continua sempre visível para qualquer superfície, só passa a se chamar `caption`/"Legenda" em vez de `role`/"Papel". A regra de "só aparece pra superfície polaroide" vale exclusivamente para o fluxo de preview (`identityEditable={false}`).
- Superfícies `hero` e `package` não ganham legenda em lugar nenhum do site — não há `<figcaption>` novo nelas, o campo Descrição/Legenda simplesmente não aparece nos modais do preview pra essas superfícies.
- Nenhuma lógica de negócio depende do conteúdo da string `role`/`caption` hoje (confirmado por varredura nos dois repos — é sempre texto opaco, nunca comparado/filtrado). O rename é seguro.

## Arquitetura

### 1. Rename `role` → `caption` (Placement, ponta a ponta, nos dois repos)

Cada repo tem sua própria stack de domínio/aplicação/infra pro Firestore (arquitetura duplicada de propósito, não compartilhada) — o rename precisa ser feito independentemente nos dois.

**admin-photo** (lê/escreve `placements`/`placements_draft`):

- `Placement.role: string | null` → `Placement.caption: string | null`
- `PlacementRepository.update()`: `Partial<Pick<Placement, 'photoId' | 'role'>>` → `'photoId' | 'caption'`
- `PlacementDTO.role` → `PlacementDTO.caption`
- `UpdatePlacementUseCase`: mesma assinatura, `role`→`caption`
- `PlacementRepositoryImpl.toPlacement()`: `role: data.role ?? null` → `caption: data.caption ?? null` (isso já é o rename do campo gravado no Firestore — sem migração, os documentos novos simplesmente passam a ter `caption` em vez de `role`)
- `MockPlacementRepository.ts` (fixtures) + seu teste
- `actions/placements.ts`: assinatura de `updatePlacement`
- `PlacementsManager.tsx`: coluna `{ key: 'role', header: 'Papel' }` → `{ key: 'caption', header: 'Legenda' }`
- `PlacementForm.tsx`: campo `role`→`caption` (tipo, estado, `toCreatePayload`, `fromPlacement`) — ver seção 3 para a regra de visibilidade condicional
- `EditPlacementModal.tsx`: `updatePlacement(id, { photoId, role: payload.role })` → `caption: payload.caption`
- `AddPhotoModal.tsx`: reescrito na seção 2, já nasce usando `caption`

**app-photo** (lê `placements`/`placements_draft` do mesmo Firestore, camada própria e independente):

- `Placement.role` → `Placement.caption` (domínio)
- `PlacementRepositoryImpl.toPlacement()`: `role: data.role ?? null` → `caption: data.caption ?? null`
- `MockPlacementRepository.ts` (fixtures, distinto do de admin-photo) + seu teste
- `PlacedPhotoDTO.role` → `PlacedPhotoDTO.caption`
- `GetPhotosBySurfaceUseCase.ts`: `role: placement.role` → `caption: placement.caption`
- `scripts/migration/derivePhotosAndPlacements.ts` + `migrate-to-firestore.ts` + teste: script de migração histórica one-off (já rodado antes, mas mantido no repo) — `DerivedPlacement.role` → `caption`, `ABOUT_ROLES` → renomear pra `ABOUT_CAPTIONS` por clareza. Não é re-executado automaticamente, mas fica consistente com o novo nome do campo caso alguém rode de novo.
- Comentários que citam a palavra `role` em `getPhotosBySurface.ts` e `niches.ts` — atualizar o texto pra `caption` (são só comentários explicativos, não código, mas citam o nome do campo).

Nenhum índice do Firestore, regra de segurança, nem schema zod/yup referencia `role` — nada a mudar nesses.

### 2. `AddPhotoModal.tsx` — passo único, sem "botão de posicionamento"

Hoje é um wizard de 2 passos: escolher arquivo → tela separada "posicionamento" (Papel + Ordem + botão "Adicionar") que só então cria a Foto e o Placement.

Novo comportamento — uma tela só:

- Se a superfície do slot clicado (`surface`, já vem via prop do contexto do clique) está em `POLAROID_SURFACES`: mostra um campo "Legenda (opcional)" ANTES do input de arquivo.
- Se não está (`hero`, `package`): não mostra nenhum campo de texto — só o input de arquivo.
- Ordem nunca aparece pro usuário: calculada automaticamente (função pura `nextOrderFor`, seção 4) no momento da criação.
- Ao escolher o arquivo: upload pro Cloudinary → `createPhoto()` → `createPlacement({ ..., caption: <valor digitado ou null>, order: nextOrderFor(...) })` — tudo em sequência automática, sem clique de confirmação separado. Fecha o modal ao terminar.
- Título do modal vira só "Nova foto" (sem numeração de passo).

`AddPhotoModal` passa a receber `placements: PlacementViewModel[]` como prop nova (já existe em `PreviewFrame.tsx`, só precisa ser repassada).

### 3. `PlacementForm.tsx` — campo Legenda condicional no fluxo de editar (preview)

Hoje, com `identityEditable={false}` (usado só por `EditPlacementModal`, o modal que abre ao clicar numa foto existente no preview), NENHUM campo de texto aparece — só o seletor de foto.

Novo comportamento:

- Quando `identityEditable={false}` **e** `POLAROID_SURFACES.includes(values.surface)`: mostra o campo "Legenda (opcional)", carregado do banco via `fromPlacement()` (`caption: placement.caption ?? ''`, já é o comportamento correto hoje, só troca o nome do campo).
- Quando `identityEditable={false}` e a superfície NÃO é polaroide (`hero`, `package`): comportamento inalterado, nenhum campo aparece.
- Quando `identityEditable={true}` (página `/placements`, CRUD completo): comportamento inalterado — campo sempre visível pra qualquer superfície, só renomeado "Papel"→"Legenda".

Nova constante em `admin-photo/src/api/domain/placement/Placement.ts`, ao lado de `NULL_REF_SURFACES`:

```ts
export const POLAROID_SURFACES: readonly PhotoSurface[] = ["home-gallery", "niche", "quem-sou"];
```

### 4. Cálculo automático de ordem

Nova função pura, testada isoladamente:

```ts
export function nextOrderFor(
  surface: PhotoSurface,
  refId: string | null,
  placements: { surface: PhotoSurface; refId: string | null; order: number }[],
): number {
  const normalizedRefId = NULL_REF_SURFACES.includes(surface) ? null : refId;
  const matching = placements.filter(
    (p) =>
      p.surface === surface &&
      (NULL_REF_SURFACES.includes(p.surface) ? null : p.refId) === normalizedRefId,
  );
  return matching.length === 0 ? 0 : Math.max(...matching.map((p) => p.order)) + 1;
}
```

Arquivo: `admin-photo/src/app/preview/_components/nextOrderFor.ts` (+ teste). Usada só por `AddPhotoModal.tsx`.

### 5. app-photo — legenda vira dado, não texto fixo

Tipo compartilhado novo (generaliza o `GalleryPhoto` que hoje só existe pra home-gallery):

```ts
// app-photo/src/actions/_shared/getPhotosBySurface.ts
export interface LabeledPhoto extends Photo {
  label: string;
}

export function toLabeledPhoto(p: PlacedPhotoDTO): LabeledPhoto {
  return { ...toPhoto(p), label: p.caption ?? "" };
}
```

(`toPhoto`/`Photo` continuam existindo sem mudança — usados por `hero`/`package`, que não precisam de legenda.)

- `gallery.ts`: `getGalleryPhotos()` e `getAboutPhotos()` passam a usar `toLabeledPhoto` em vez do mapeamento próprio/`toPhoto`. `GalleryPhoto` (tipo local hoje só usado por `Gallery.tsx`) é substituído por `LabeledPhoto` importado do local compartilhado.
- `niches.ts`: `gallery = photos.map(toLabeledPhoto)`; tipo de `Niche.gallery` passa de `Photo[]` para `LabeledPhoto[]`.
- `NicheGallery.tsx`: prop `photos: LabeledPhoto[]`; novo `<figcaption>` condicional (só renderiza se `photo.label` não for vazio), estilo visual igual ao já usado em `Polaroid.tsx` (`font-hand mt-2 px-1 text-sm leading-snug sm:text-base`) pra manter consistência entre as três superfícies polaroide.
- `About.tsx`: `getAboutPhotos()` retorna `family: LabeledPhoto[]`. Componente `Row` perde a prop `notes?: string[]` — passa a usar `photos[i].label` como `caption` de cada `<Polaroid>` diretamente. As duas strings hardcoded ("Minha base, minha família" / "Amo esportes radicais e amo adrenalina") saem do código — viram dado gravável via o admin (legenda dos placements `family[1]`/`family[3]` de `quem-sou`).

`capaCaption` e `familia.legendaFoto` (campos de `Profile`, já editáveis desde a feature anterior) não são afetados — são conceito diferente, não vêm de `Placement.caption`.

## Testes

- `nextOrderFor`: TDD puro — vazio→0, sequência existente→max+1, ignora placements de outra surface/refId, trata `NULL_REF_SURFACES` corretamente (refId sempre null nessas).
- `AddPhotoModal`/`PlacementForm`: sem teste de componente novo dedicado (não é o padrão já existente no repo pra esses modais — os testes hoje cobrem mais as actions/use cases puros); a verificação real é o smoke test manual + os testes de regressão que já existem (`PlacementForm.test.ts`, `EditPlacementModal` indiretamente).
- Rename `role`→`caption`: todos os testes que hoje referenciam `.role`/`role:` precisam ser atualizados em conjunto com o código (mesma lista de arquivos da seção 1) — são renames mecânicos, não mudam comportamento testado.
- `NicheGallery.test.tsx`/`About.test.tsx`/`Gallery.test.tsx`: precisam de fixtures atualizadas (`LabeledPhoto` com `label`) e novas asserções conferindo a legenda condicional.

## Arquivos tocados (inventário completo)

**admin-photo** (14 arquivos de rename + 2 novos):
`Placement.ts`, `PlacementRepository.ts`, `PlacementDTO.ts`, `UpdatePlacementUseCase.ts` (+test), `CreatePlacementUseCase.test.ts`, `PlacementRepositoryImpl.ts`, `MockPlacementRepository.ts` (+test), `actions/placements.ts`, `PlacementsManager.tsx`, `PlacementForm.tsx` (+test), `EditPlacementModal.tsx`, `AddPhotoModal.tsx` (reescrito), `PreviewFrame.tsx` (passa `placements` pro `AddPhotoModal`), + novos `nextOrderFor.ts`/`nextOrderFor.test.ts`.

**app-photo** (8 arquivos de rename + mudanças de comportamento):
`Placement.ts`, `PlacementRepositoryImpl.ts`, `MockPlacementRepository.ts` (+test), `PlacedPhotoDTO.ts`, `GetPhotosBySurfaceUseCase.ts` (+test), `scripts/migration/derivePhotosAndPlacements.ts` (+test) + `migrate-to-firestore.ts`, `getPhotosBySurface.ts` (novo `LabeledPhoto`/`toLabeledPhoto`), `gallery.ts`, `niches.ts`, `NicheGallery.tsx` (+test), `About.tsx` (+test), `Gallery.tsx` (+test, ajuste de import de tipo).
