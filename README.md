# Miaudota - BFF e API Gateway

Camada de borda do Miaudota: o **API Gateway** (JWT, limite de requisições, proxy) e o **BFF Mobile**, que agrega dados de vários microsserviços. Inclui o **worker de notificação** (RabbitMQ → n8n → e-mail).

> Arquitetura de Soluções em Nuvem (PUCPR) - PJBL Miaudota - Entrega 3. Integrantes em [GRUPO.md](GRUPO.md).

## Arquitetura

Clean Architecture (Domain / Application / Infrastructure / Presentation) combinada com **Vertical Slice**: cada funcionalidade fica em `src/<serviço>/casos-de-uso/<feature>/`, com o caso de uso e o controller lado a lado.

O BFF e o gateway não importam código dos microsserviços: falam com eles só por HTTP (portas e adaptadores em `bff-mobile/aggregated-data`). O caso de uso `AgregarDados` depende de portas (`AnimaisFonte`, `FeirasFonte`, `IndicadorFonte`) e não sabe se a resposta vem de HTTP ou da Azure Function.

As regras de dependência são verificadas automaticamente pelos **testes de arquitetura** (`src/testes/arquitetura.test.ts`): o domínio não importa frameworks, os casos de uso não dependem de infraestrutura, uma fatia não importa outra, e um serviço não importa outro.

```
src/
  shared/            erros de domínio, eventos, autenticação interna, configuração
  bff-mobile/
  api-gateway/
  notificacao/
  testes/            testes unitários e de arquitetura
```

## Tecnologias

Node.js 20, TypeScript, NestJS 10, Swagger (`@nestjs/swagger`), class-validator, RabbitMQ (eventos), Docker, testes com `node:test`.


## Endpoints principais

- `GET /aggregated-data` — junta animais (MongoDB), feiras (Azure SQL) e o indicador da Azure Function numa resposta só
- `/usuarios/*`, `/animais/*`, `/favoritos/*`, `/solicitacoes/*`, `/feiras/*` — encaminhados aos microsserviços
- Swagger do BFF em `/docs`

## Como executar

### 1. Pelas imagens do Docker Hub (recomendado)

| Serviço | Imagem no Docker Hub |
|---|---|
| BFF Mobile (`GET /aggregated-data` + rotas proxy) | `sofhiachromiec/pjbl-bff:v1` |
| API Gateway | `sofhiachromiec/pjbl-gateway:v1` |
| Worker de notificação (sem porta HTTP) | `sofhiachromiec/pjbl-notificacao:v1` |

Crie um `.env` a partir de `.env.example` (chaves, banco e RabbitMQ) e rode:

```bash
docker run --rm -p 3001:3001 --env-file .env sofhiachromiec/pjbl-bff:v1   # BFF Mobile (`GET /aggregated-data` + rotas proxy)
docker run --rm -p 3000:3000 --env-file .env sofhiachromiec/pjbl-gateway:v1   # API Gateway
docker run --rm --env-file .env sofhiachromiec/pjbl-notificacao:v1   # Worker de notificação (sem porta HTTP)
```

URLs na nuvem: *(preencher após o deploy)*

| Serviço | URL pública | Swagger |
|---|---|---|
| BFF Mobile (`GET /aggregated-data` + rotas proxy) | _a preencher_ | _a preencher_/docs |

### 2. Localmente com Node

```bash
cp .env.example .env     # preencha os valores
npm install
npm run start:all        # compila e sobe os serviços deste repositório
```

O Swagger de cada serviço fica em `http://localhost:<porta>/docs` (use o botão **Authorize** para informar `chave-interna` e, quando pedido, `usuario-id` e `usuario-tipo`).

## Testes

```bash
npm test
```

Executa os testes unitários (regras de negócio e casos de uso, com dublês em memória) e os testes de arquitetura.

## Publicar as imagens

```bash
docker login
./publicar.sh
```

## Integrantes

- Sofhia Chromiec
- Fernanda Giacobbo
- Júlia Melo
- Pedro Serafim
