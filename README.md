# Bot WhatsApp Frontend

[![Angular](https://img.shields.io/badge/Angular-20-DD0031?logo=angular&logoColor=white)](https://angular.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![RxJS](https://img.shields.io/badge/RxJS-7.8-B7178C?logo=reactivex&logoColor=white)](https://rxjs.dev/)
[![Node](https://img.shields.io/badge/Node.js-22%2B-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org/)

Painel administrativo para operação do bot de atendimento WhatsApp da ASB Telecom. A aplicação centraliza monitoramento de conversas, métricas operacionais e gestão de templates com histórico de auditoria.

## Funcionalidades

- Dashboard com contadores por estado do bot
- Listagem de conversas e visualização de histórico por telefone
- Gestão de templates de mensagem
- Edição de templates com auditoria de alterações
- Tratamento centralizado de chamadas HTTP e alertas de UI

## Stack

| Tecnologia | Versão |
|---|---|
| Angular | 20 |
| TypeScript | 5.8 |
| RxJS | 7.8 |
| Zone.js | 0.15 |

## Pré-requisitos

- Node.js 22+
- npm 10+
- Angular CLI 20 (opcional, já incluído nas dependências de desenvolvimento)

## Configuração de ambiente

As URLs da API estão definidas em:

- `src/environments/environment.development.ts`: `http://localhost:8080/api/v1`
- `src/environments/environment.ts`: `https://api-bot-whatsapp.cesaravb.com.br/api/v1`

## Como executar localmente

```bash
npm install
npm start
```

Aplicação disponível em `http://localhost:4200`.

## Scripts

| Script | Descrição |
|---|---|
| `npm start` | Sobe o servidor de desenvolvimento (`ng serve`) |
| `npm run build` | Gera build da aplicação |
| `npm run build:prod` | Gera build de produção |
| `npm run watch` | Build em modo watch para desenvolvimento |

## Rotas principais

| Rota | Descrição |
|---|---|
| `/dashboard` | Métricas operacionais por estado do bot |
| `/conversas` | Lista de conversas |
| `/conversas/:phone` | Histórico completo de uma conversa |
| `/templates` | Lista de templates de mensagens |
| `/templates/:chave/editar` | Edição e auditoria de template |

## Estrutura do projeto

```text
src/app/
   components/
   pages/
      dashboard/
      conversas/
      templates/
   services/
   shared/
      enums/
      models/
```

## Qualidade e build

```bash
npm run build
```

Se o comando finalizar sem erros, o bundle é gerado em `dist/bot-whatsapp-frontend`.
