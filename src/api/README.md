# src/api

Backend do site: `domain` (entidades + contratos de repositório),
`application` (DTOs + casos de uso), `infrastructure` (Firestore, Cloudinary,
repositórios mock). `src/actions/*.ts` chama os casos de uso via
`RepositoryFactory`, que cai pro mock quando não há credenciais do Firebase
(dev/test/CI) — ver `infrastructure/repositories/RepositoryFactory.ts`.
