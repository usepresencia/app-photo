# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [0.1.10](https://github.com/useagendaflow/app-photo/compare/v0.1.9...v0.1.10) (2026-09-11)

### Bug Fixes

- restore gallery polaroid height lost when Editable wrapped the figure ([1b91c5d](https://github.com/useagendaflow/app-photo/commit/1b91c5d9e2a653752e1c081193053ad7007f599f))

### [0.1.9](https://github.com/useagendaflow/app-photo/compare/v0.1.8...v0.1.9) (2026-09-11)

### Bug Fixes

- avoid CSS minifier bug that broke the gallery flip animation ([38e1908](https://github.com/useagendaflow/app-photo/commit/38e1908566e9a6846a389d0188c0da347ae9c7a7))

### [0.1.8](https://github.com/useagendaflow/app-photo/compare/v0.1.7...v0.1.8) (2026-09-11)

### Bug Fixes

- use SITE_URL for the preview-enter redirect origin in production ([99a9ed4](https://github.com/useagendaflow/app-photo/commit/99a9ed45e27dada83ed901ece523638630a6c019))

### [0.1.7](https://github.com/useagendaflow/app-photo/compare/v0.1.6...v0.1.7) (2026-09-11)

### Bug Fixes

- cap Cloudinary delivery width to the original image (c_limit) ([2273a80](https://github.com/useagendaflow/app-photo/commit/2273a80e8f30b6392555bcbaff990a6ec2d7df3b))

### [0.1.6](https://github.com/useagendaflow/app-photo/compare/v0.1.5...v0.1.6) (2026-09-11)

### Features

- restore migration script, mirror writes to draft, add testimonials ([b90a81c](https://github.com/useagendaflow/app-photo/commit/b90a81ca522f66988c53db14a26e322b9b80ae43))

### Bug Fixes

- force dynamic rendering on home and sitemap ([32e8439](https://github.com/useagendaflow/app-photo/commit/32e84394518d5a6c7e3d8281ef224b0933ceb464))

### [0.1.5](https://github.com/useagendaflow/app-photo/compare/v0.1.4...v0.1.5) (2026-09-11)

### Features

- add /api/preview/enter, the only route that mints the draft cookie ([8d38125](https://github.com/useagendaflow/app-photo/commit/8d381250b67a39e3ccc4807f0c6535267b98cb2d))
- add Addable component and preview-mode CSS for it ([76b567f](https://github.com/useagendaflow/app-photo/commit/76b567f50060bd5f8cd312fb076f215186e56367))
- add Addable niche marker at the end of the home carousel ([41d49bc](https://github.com/useagendaflow/app-photo/commit/41d49bcc09e6d9870264cfefe19190ff90fad192))
- add Addable package marker at the end of the package grid ([c6c50fa](https://github.com/useagendaflow/app-photo/commit/c6c50fa55aed3a261b7b1b6cde2ec0ee3932f119))
- add Addable placement marker at the end of the home gallery ([b76ecd1](https://github.com/useagendaflow/app-photo/commit/b76ecd1e126f5b6f455d70997862c3f5fc1a3122))
- add Addable placement marker at the end of the niche gallery ([071319f](https://github.com/useagendaflow/app-photo/commit/071319fb58aebc590e5a4469147ecef33216ac28))
- add an "Adicionar nova foto" pill to the niche hero ([1f49330](https://github.com/useagendaflow/app-photo/commit/1f49330f96ad4f1116ff52867e6d15ec660a343b))
- add app-photo client env schema (NEXT_PUBLIC_ADMIN_PHOTO_URL) ([6b83994](https://github.com/useagendaflow/app-photo/commit/6b83994fc449a6cd3f8dc6920dbf3c4a0b1ca636))
- add Docker deployment (standalone build, health check) ([4d63846](https://github.com/useagendaflow/app-photo/commit/4d63846a88c90ed0dfde5789c00ddd0a776e0117))
- add draft-mode cookie name and decision function ([d2c7230](https://github.com/useagendaflow/app-photo/commit/d2c7230b287a3540b06b8e67ae196761e388e8d1))
- add Editable wrapper and preview-mode CSS ([e8efba4](https://github.com/useagendaflow/app-photo/commit/e8efba460fc5966d182f3d667a3dff3c3ea2a703))
- add EditableText, marks one text field (not a whole block) ([5f0868d](https://github.com/useagendaflow/app-photo/commit/5f0868d38e6409e51d9effce1f280377b147fe62))
- add LabeledPhoto/toLabeledPhoto ([88bf8ba](https://github.com/useagendaflow/app-photo/commit/88bf8ba07fe0021d5601fc4913f363617a375618))
- add local text-edit mode to PreviewOverlay ([d891b7c](https://github.com/useagendaflow/app-photo/commit/d891b7c576164ddcd9804823b7b261ca4cac35d6))
- add parseEditableTextTarget ([dcf1a65](https://github.com/useagendaflow/app-photo/commit/dcf1a651d241e076e9f123c2affcda4ea638d149))
- add PreviewOverlay handshake component ([d674452](https://github.com/useagendaflow/app-photo/commit/d674452e3ba18bf485359eb44a2088c94f188f05))
- add security headers and frame-ancestors CSP to app-photo ([264f9da](https://github.com/useagendaflow/app-photo/commit/264f9da1de98067758baf428d5a4b9a375fca34a))
- add Testimonial domain (read-only) in app-photo ([2e52632](https://github.com/useagendaflow/app-photo/commit/2e526325ca70be555aafd95ee25d36fcc08bca5f))
- **cloudinary:** infra de entrega + contrato Firestore de produção ([e08c4ea](https://github.com/useagendaflow/app-photo/commit/e08c4eaab413fa0bb6511bd6153350ca45c12a76))
- **cloudinary:** resolver cloudinaryPublicId no PhotoRepositoryImpl ([0bb6b62](https://github.com/useagendaflow/app-photo/commit/0bb6b62af2b61c3595238bede9be794ade36fcd8))
- dual-mode reads (live/draft) in all 5 repositories ([94b70d9](https://github.com/useagendaflow/app-photo/commit/94b70d98704789ae789be6d3f81effe54631e5f0))
- extend PreviewOverlay to render a floating delete icon on hover ([77ab2d4](https://github.com/useagendaflow/app-photo/commit/77ab2d40a527f86617b88d46fed8e096b15ad444))
- extend PreviewOverlay to send app-photo:preview:add on Addable clicks ([3b6b2f8](https://github.com/useagendaflow/app-photo/commit/3b6b2f8127eae998ac1d7ab373264225426a0d1d))
- **galeria:** ligar getGalleryPhotos ao Photo/Placement ([27af7fe](https://github.com/useagendaflow/app-photo/commit/27af7febf9a3c8ee75c2f9572171f43dd5d9f294))
- **hero:** ligar getHeroPhotos ao Photo/Placement ([0749713](https://github.com/useagendaflow/app-photo/commit/0749713fd7896862c0d073a82b29a4b2df8d79bc))
- home page polaroid captions come from the database ([839323c](https://github.com/useagendaflow/app-photo/commit/839323cf549d3946740d6543b6aeebd1274249c9))
- **infra:** adicionar firebase-admin, zod e validação de ambiente ([e9947e7](https://github.com/useagendaflow/app-photo/commit/e9947e7e38124815d58cb2a26ae5b84fe56bb958))
- make hero film strip photos editable in preview mode ([96cb6de](https://github.com/useagendaflow/app-photo/commit/96cb6de893897ea5baf313c5f2b379cec6a2618b))
- make home gallery photos editable in preview mode ([ed42f44](https://github.com/useagendaflow/app-photo/commit/ed42f44e507a9c10a2459291e0a3bb851ca33a26))
- make home teaser cards (Niches, Events) editable in preview mode ([28584c0](https://github.com/useagendaflow/app-photo/commit/28584c00ee3da980dd40b6113034d270e40d50a2))
- make niche gallery photos editable in preview mode ([86568d2](https://github.com/useagendaflow/app-photo/commit/86568d27ce3d31995d72d19414cbe772c4aed596))
- make niche hero and intro text editable in preview mode ([6fcd8b9](https://github.com/useagendaflow/app-photo/commit/6fcd8b957ec289483ed1c35febd877f4fd4764de))
- make niche intro/description/highlights inline-editable ([b5df004](https://github.com/useagendaflow/app-photo/commit/b5df004485740dc10c80a1197c556d57906d9b23))
- make niche title/subtitle inline-editable (3 render locations) ([fa1e39a](https://github.com/useagendaflow/app-photo/commit/fa1e39af5e51c2958539965afbde2a897f92adc8))
- make package cards editable in preview mode ([43b3a94](https://github.com/useagendaflow/app-photo/commit/43b3a94a07e899c92bc32f5fc9d1f4582b717144))
- make package name/price/description/items inline-editable ([55af6ef](https://github.com/useagendaflow/app-photo/commit/55af6ef59509130c04f7052f924a1671246f163e))
- make profile fields inline-editable ([75bbf56](https://github.com/useagendaflow/app-photo/commit/75bbf564ca891ab05ad208d28373347a2fc0762f))
- make RepositoryFactory async, cookie-driven draft mode ([d8036d3](https://github.com/useagendaflow/app-photo/commit/d8036d384a7941be79e2f1a92e01bf88b2493f4c))
- make the "Quem sou" section editable in preview mode ([4b25b00](https://github.com/useagendaflow/app-photo/commit/4b25b0010b492f0ad0d11ab45451ea6e54e5433c))
- **migração:** niche/package/profile + CLI orquestrador ([db646e0](https://github.com/useagendaflow/app-photo/commit/db646e02203c493824a1cf7f3a006b8deccc2578))
- **migração:** upload assinado do Cloudinary + derivação de Photo/Placement ([c8146cc](https://github.com/useagendaflow/app-photo/commit/c8146cc85d2ecd9406c8d28a75e4dc64ea9ff6eb))
- mount PreviewOverlay in the root layout ([7ba039f](https://github.com/useagendaflow/app-photo/commit/7ba039fa69face001f5d8d309c9cdd01402d7977))
- move the "add photo" pill next to the Meus trabalhos title ([9f93da2](https://github.com/useagendaflow/app-photo/commit/9f93da2e1a066f3e95b478501228d576b8539128))
- move the add-ensaio pill next to "Ensaios para cada momento" ([e0d97f9](https://github.com/useagendaflow/app-photo/commit/e0d97f9c386da73b6b42827838f3a8184e2d209f))
- move the niche gallery's add-photo pill next to its title ([014d343](https://github.com/useagendaflow/app-photo/commit/014d343b03c6d9a88f1b6a555fc26ca83d663cbc))
- niche.gallery carries caption as label ([3a69df0](https://github.com/useagendaflow/app-photo/commit/3a69df0519a00b267d6f0f0438eab97eba8784ac))
- **niche:** domínio, DTO, casos de uso e repositório mock ([aaa2373](https://github.com/useagendaflow/app-photo/commit/aaa23731a2d938686c3938a74f8dc24483a0551c))
- **niche:** leitura pública ganha cache com tag "niches" ([258b3a9](https://github.com/useagendaflow/app-photo/commit/258b3a9564b1c56899ad1082f0fe06ab021b5df7))
- **niche:** repositório Firestore e fábrica de repositórios ([f7bff34](https://github.com/useagendaflow/app-photo/commit/f7bff344f11813190de53645774ef12a1a779671))
- **nicho:** ligar galeria de cada nicho ao Photo/Placement ([b88a6c4](https://github.com/useagendaflow/app-photo/commit/b88a6c409309db0aee7c8df6274af09cb7abe9be))
- **package:** domínio, DTO, caso de uso e repositório mock ([89beacc](https://github.com/useagendaflow/app-photo/commit/89beaccd6b4b6008dbe7e497c6eaad0fe11418b6))
- **package:** leitura pública ganha cache com tag "packages" ([ed168cd](https://github.com/useagendaflow/app-photo/commit/ed168cda69485bc5f71548ca693ac6318e9c30a1))
- **package:** ligar actions/packages.ts e PackagePicker.tsx ([fdc8883](https://github.com/useagendaflow/app-photo/commit/fdc8883af33f7043cfd08a2e44a14f755095eee8))
- **package:** repositório Firestore e fábrica de repositórios ([14de050](https://github.com/useagendaflow/app-photo/commit/14de050e58e11d75110585c83de9ce764189eff5))
- **photo:** domínio, DTO, caso de uso e repositórios mock ([be386c9](https://github.com/useagendaflow/app-photo/commit/be386c9d43ec3564e0849882384bdb9f15c835e0))
- **photo:** repositórios Firestore e fábrica de repositórios ([fd1ee91](https://github.com/useagendaflow/app-photo/commit/fd1ee912b6de371f12e15c9dea9adf88519ad0fa))
- **placement:** leitura pública ganha cache com tag "placements" ([8efe401](https://github.com/useagendaflow/app-photo/commit/8efe40121087696d2eb036e72ee2edd12c0c6fc5))
- **profile:** domínio, DTO, caso de uso e repositório mock ([440bf1d](https://github.com/useagendaflow/app-photo/commit/440bf1dad81010403b4959ba7e85a41894285570))
- **profile:** leitura pública ganha cache com tag "profile" ([7b314ba](https://github.com/useagendaflow/app-photo/commit/7b314baf22b000dda5cc00f994e85274d01fdec2))
- **profile:** ligar actions/profile.ts e About.tsx ([b0513cd](https://github.com/useagendaflow/app-photo/commit/b0513cd5e76efb1c1bd3b826af721d15be887e0d))
- **profile:** repositório Firestore e fábrica de repositórios ([9870286](https://github.com/useagendaflow/app-photo/commit/987028664dc522b2184d662cc2c23f20de2395c0))
- **quem-sou:** ligar getAboutPhotos ao Photo/Placement ([f49970a](https://github.com/useagendaflow/app-photo/commit/f49970a21f1557472e81d4209e5f898510fc2aeb))
- read testimonials from Firestore instead of a hardcoded array ([714f099](https://github.com/useagendaflow/app-photo/commit/714f099b50285180bc4326eeb9dd5912df29c752))
- rename the gallery add-photo pill to "Adicionar nova foto" ([2336039](https://github.com/useagendaflow/app-photo/commit/23360399d7737e34144e5214d922b444f6312f14))
- render hidden testimonials inline, dimmed, in draft mode ([419a00a](https://github.com/useagendaflow/app-photo/commit/419a00aa8dc34e82917238c891bd8ca05528c676))
- **revalidate:** rota de invalidação de cache pro admin-photo ([1744381](https://github.com/useagendaflow/app-photo/commit/17443817cdc929bb0255f22e5b1c72fe58030cc1))
- rewrite WhatsApp pre-filled message template, cap description length ([d767d7e](https://github.com/useagendaflow/app-photo/commit/d767d7e4a5ff04bf8bd7fa0da7a23ae41eebdbf5))
- show caption-driven legend in NicheGallery ([c9b525b](https://github.com/useagendaflow/app-photo/commit/c9b525b8a35c8758e7812f4efb80ea13d219288e))
- show star ratings and wire up Addable/Editable on testimonials ([e2d53d6](https://github.com/useagendaflow/app-photo/commit/e2d53d6b9e5a348c4930f00c436830f8a4b68223))
- thread placementId through the public Photo type ([3083c87](https://github.com/useagendaflow/app-photo/commit/3083c876b561381ddf90f2578fa3d54185e00db5))

### Bug Fixes

- change "na data de" to "dia" in the WhatsApp message template ([3dc6f00](https://github.com/useagendaflow/app-photo/commit/3dc6f008d79f881818132f7a8b86c0223b36b092))
- compute getBoundingClientRect() once per icon, not twice ([38f2fe5](https://github.com/useagendaflow/app-photo/commit/38f2fe51bc1c0c9ef5649afd999d203ac0674d41))
- **ensaios:** renderizar /ensaios/[slug] dinamicamente ([b8c3301](https://github.com/useagendaflow/app-photo/commit/b8c33013b41613a97d85a6101647674a1772cf7b))
- env.server.ts crashes on empty (not absent) optional env vars ([b28426f](https://github.com/useagendaflow/app-photo/commit/b28426f6010c622c7fa7a7d5cfac61ae1b77020b))
- **eventos:** eliminar EventFormat, derivar de Niche ([9c05e9f](https://github.com/useagendaflow/app-photo/commit/9c05e9fae4923640089b567c4e6cfba23305e7f6))
- fall back to focus() when showPicker() is blocked in an iframe ([c466749](https://github.com/useagendaflow/app-photo/commit/c466749e36d053c7a578f486bdfe9b7f5447d515))
- **migração:** idempotência de placements e validação completa de credenciais ([85c8ce7](https://github.com/useagendaflow/app-photo/commit/85c8ce788cdd99523abc964ddca9899ba914ade8))
- niche hero's title/subtitle overlay blocked clicks on the photo ([fdf610e](https://github.com/useagendaflow/app-photo/commit/fdf610e400bf474e08068b475bc3baacdc0236ee))
- remove unused package value from PhotoSurface union ([af92017](https://github.com/useagendaflow/app-photo/commit/af92017f12f19219a444ff60a04afde2fafc5c93))
- restore the actual gold color, not the pink light-theme override ([7334e63](https://github.com/useagendaflow/app-photo/commit/7334e637387a01af554ee63658d35d7a8fd11f64))
- use next/link instead of raw <a> in the error boundary ([d42d98f](https://github.com/useagendaflow/app-photo/commit/d42d98fe188168543599b3eb8075820bc1d449b5))

### [0.1.4](https://github.com/useagendaflow/pixel-perfect-portfolio/compare/v0.1.3...v0.1.4) (2026-08-18)

### Features

- **hero:** atualizar estatísticas e tipografia dos números ([f5fe182](https://github.com/useagendaflow/pixel-perfect-portfolio/commit/f5fe1820f256440945c0ec9f78d0dead7578ed86))
- **quem-sou:** reescrever copy, reordenar blocos e destacar a foto do altar ([cbf89a6](https://github.com/useagendaflow/pixel-perfect-portfolio/commit/cbf89a6560fd0846d73191f6b335ed0e31d8fde2))

### Bug Fixes

- **dev:** liberar acesso ao dev server pelo IP da rede local ([a4d58cf](https://github.com/useagendaflow/pixel-perfect-portfolio/commit/a4d58cf3d23a8aa9a45f6588fdabccfdb7a10273))
- **galeria:** restaurar portfólio variado e legendar pela categoria ([55d6920](https://github.com/useagendaflow/pixel-perfect-portfolio/commit/55d69202412b11f78a0699e3db1dfcb776b0329d))
- **hero:** sincronizar o flash com o dissolve na troca do film strip ([5005181](https://github.com/useagendaflow/pixel-perfect-portfolio/commit/50051815a9fc6e2df8b7ac9b1b66328ad3a991b5))

### [0.1.3](https://github.com/useagendaflow/pixel-perfect-portfolio/compare/v0.1.2...v0.1.3) (2026-08-05)

### Bug Fixes

- **netlify:** remove duplicate plugin already configured in netlify ui ([6bdbc59](https://github.com/useagendaflow/pixel-perfect-portfolio/commit/6bdbc59f7b9975d561bc0be4551e273917420b58))

### [0.1.2](https://github.com/useagendaflow/pixel-perfect-portfolio/compare/v0.1.1...v0.1.2) (2026-08-05)

### Bug Fixes

- **contact:** contain date input to prevent mobile overflow ([e2cc80c](https://github.com/useagendaflow/pixel-perfect-portfolio/commit/e2cc80c99e621b83f48ae26420c512f98e786e62))
- **hero:** center film strip vertically on mobile ([06ff4e3](https://github.com/useagendaflow/pixel-perfect-portfolio/commit/06ff4e3625bae31b9a3ba07930fa84099a46ac24))
- **niches:** shorten cta label on mobile niche card ([0464e98](https://github.com/useagendaflow/pixel-perfect-portfolio/commit/0464e9853740c82e389b4aa60c226bfbe51d4752))

### 0.1.1 (2026-08-05)

### Features

- adicionar footer global e reordenar secoes da home ([f4dee5c](https://github.com/useagendaflow/pixel-perfect-portfolio/commit/f4dee5c3475dc7a913f925ec9da972df8254ff38))
- adicionar fotos otimizadas e manifesto gerado ([d363af1](https://github.com/useagendaflow/pixel-perfect-portfolio/commit/d363af1850208211495b4d4cc6dc7e8519b43af4))
- adicionar layout raiz com next/font e shell provisório ([6b3585f](https://github.com/useagendaflow/pixel-perfect-portfolio/commit/6b3585f601a81a12d781c1f76a92931e9c6467bb))
- adicionar paginas de nicho em /ensaios/[slug] ([45bb2fe](https://github.com/useagendaflow/pixel-perfect-portfolio/commit/45bb2fe616f4854371d98c591f71234521652ec0))
- adicionar rotas de seo e paginas de erro ([188ba77](https://github.com/useagendaflow/pixel-perfect-portfolio/commit/188ba7715137cf9a2a960091a3ff999ec33a4082))
- adicionar script de otimização de fotos e gerar manifesto de 83 fotos reais (saída gitignored) ([3349248](https://github.com/useagendaflow/pixel-perfect-portfolio/commit/33492486be0d7ab406655ba3d993c90c16c906e9))
- adicionar secoes niches, events e contato ([8bce5d5](https://github.com/useagendaflow/pixel-perfect-portfolio/commit/8bce5d5defdb1bdc6a5f6039c8a5e30b20e04664))
- adicionar toggle de tema claro/escuro com next-themes ([b25c753](https://github.com/useagendaflow/pixel-perfect-portfolio/commit/b25c753365620af983dc780fd5e788264c5b598c))
- atualizar dados reais de contato da cliente ([5dcc7d1](https://github.com/useagendaflow/pixel-perfect-portfolio/commit/5dcc7d1dd943dbf3ae9dedc050bbba8ee80f4b74))
- converter logo vetorial da cliente e portar componente Logo ([a220505](https://github.com/useagendaflow/pixel-perfect-portfolio/commit/a220505f8a0cba4860cb68db0f00ee31af38a1d3))
- extrair useSwipe e useSlideshow compartilhados com testes ([a7042e3](https://github.com/useagendaflow/pixel-perfect-portfolio/commit/a7042e35bcf48ff6aed67014ca54ff1611dca1c7))
- portar actions de brand, packages, events e testimonials com dados mockados e testes ([e7b12ad](https://github.com/useagendaflow/pixel-perfect-portfolio/commit/e7b12adce81fa3b01b91030da06b11b76c120e9f))
- portar actions de gallery e niches com os 7 nichos, fotos reais e testes ([a91b125](https://github.com/useagendaflow/pixel-perfect-portfolio/commit/a91b1254046e78e73723abecf32364c643a34fac))
- portar Hero com film strip client e ThemeToggle ([250e4c5](https://github.com/useagendaflow/pixel-perfect-portfolio/commit/250e4c5048f219dcafdac424f26332f2c4632a84))
- portar secao About usando Polaroid compartilhado ([318108c](https://github.com/useagendaflow/pixel-perfect-portfolio/commit/318108cd69f3b9d4f11e8112d671172c691fe2da))
- portar secao Gallery com album paginado usando hooks compartilhados ([a25c722](https://github.com/useagendaflow/pixel-perfect-portfolio/commit/a25c722ab1f18eef50650c05fb4bccac66e21de2))
- portar Section e extrair Polaroid e CtaLink compartilhados ([5c079d3](https://github.com/useagendaflow/pixel-perfect-portfolio/commit/5c079d33ac2da64efaa8c0fec03bb2ecf8f3b482))
- portar tokens de tema e utilities do design system para Tailwind v4 ([02e5bf1](https://github.com/useagendaflow/pixel-perfect-portfolio/commit/02e5bf15f3928aa4881d3b7262fbb3d36dc48d22))
- reconstruir hero e film strip ([9320715](https://github.com/useagendaflow/pixel-perfect-portfolio/commit/932071589d179d7c05241c5034745ce3c90fa9b3))
- redirecionar making-of-da-noiva para casamento-civil ([01d99cd](https://github.com/useagendaflow/pixel-perfect-portfolio/commit/01d99cda9da4577f21b7c6ed055fd629051bfcae))

### Bug Fixes

- **eslint:** use eslint-config-next flat exports, drop FlatCompat ([0740562](https://github.com/useagendaflow/pixel-perfect-portfolio/commit/07405622a5b75e35fb8407e243a3edd2c9442d85))
