# 💄 BeautyAI — Sistema de Atendimento WhatsApp para Clínicas de Estética

Dashboard completo para atendimento e agendamento via WhatsApp com IA, usando **Evolution API + N8N + Claude AI**, deployado na **Vercel**.

---

## 🏗️ Arquitetura do Sistema

```
Cliente WhatsApp
      ↓
Evolution API  (recebe mensagem)
      ↓
N8N Webhook    (processa e decide)
      ↓
Claude AI      (gera resposta inteligente)
      ↓
Evolution API  (envia resposta ao cliente)
      ↓
Dashboard      (visibilidade e controle)
```

---

## 📦 Estrutura do Projeto

```
clinica-estetica-whatsapp/
├── app/
│   ├── layout.tsx
│   ├── globals.css
│   └── page.tsx
├── components/
│   ├── Sidebar.tsx
│   ├── Dashboard.tsx
│   ├── Appointments.tsx
│   ├── Conversations.tsx
│   ├── Services.tsx
│   └── Settings.tsx
├── package.json
├── tsconfig.json
├── next.config.js
└── vercel.json
```

---

## 🚀 Deploy na Vercel

### 1. Suba o projeto para o GitHub

```bash
git init
git add .
git commit -m "feat: clinica estetica whatsapp system"
git remote add origin https://github.com/seu-usuario/clinica-estetica-wp
git push -u origin main
```

### 2. Importe no Vercel

1. Acesse [vercel.com](https://vercel.com) → **New Project**
2. Selecione o repositório
3. Configure as variáveis de ambiente (ver abaixo)
4. Clique em **Deploy**

### 3. Variáveis de Ambiente (Vercel → Settings → Environment Variables)

```env
EVOLUTION_API_URL=https://sua-evolution-api.com
EVOLUTION_API_KEY=sua-chave-aqui
EVOLUTION_INSTANCE=bella-estetica-wp
N8N_WEBHOOK_URL=https://seu-n8n.app.n8n.cloud/webhook/whatsapp-in
ANTHROPIC_API_KEY=sk-ant-...
```

---

## ⚡ Configurando a Evolution API

### Opção A — Self-hosted (VPS/Docker)

```bash
# docker-compose.yml
version: '3.8'
services:
  evolution-api:
    image: atendai/evolution-api:latest
    ports:
      - "8080:8080"
    environment:
      - SERVER_URL=https://sua-api.com
      - AUTHENTICATION_API_KEY=sua-chave
      - AUTHENTICATION_EXPOSE_IN_FETCH_INSTANCES=true
```

### Opção B — Evolution Cloud (recomendado para começar)

1. Acesse [evolution-api.com](https://evolution-api.com)
2. Crie uma conta e instância
3. Escaneie o QR Code com o WhatsApp da clínica
4. Copie a URL e API Key

### Configurar Webhook da Evolution

Após criar a instância, configure o webhook para apontar ao N8N:

```
POST https://sua-evolution-api.com/webhook/set/bella-estetica-wp

{
  "url": "https://seu-n8n.app.n8n.cloud/webhook/whatsapp-in",
  "webhook_by_events": false,
  "webhook_base64": false,
  "events": ["MESSAGES_UPSERT"]
}
```

---

## 🔄 Configurando o N8N

### 1. Crie uma conta em [n8n.io](https://n8n.io) (cloud) ou self-host

### 2. Importe o fluxo

Vá em **File → Import from clipboard** e cole o JSON abaixo:

```json
{
  "name": "BeautyBot - WhatsApp Atendimento Clínica",
  "nodes": [
    {
      "id": "1",
      "name": "Webhook - Receber Mensagem",
      "type": "n8n-nodes-base.webhook",
      "parameters": {
        "path": "whatsapp-in",
        "method": "POST",
        "responseMode": "onReceived"
      }
    },
    {
      "id": "2",
      "name": "Extrair Dados da Mensagem",
      "type": "n8n-nodes-base.set",
      "parameters": {
        "values": {
          "phone": "={{ $json.body.data.key.remoteJid }}",
          "message": "={{ $json.body.data.message.conversation || $json.body.data.message.extendedTextMessage.text }}",
          "name": "={{ $json.body.data.pushName }}"
        }
      }
    },
    {
      "id": "3",
      "name": "Verificar Tipo de Mensagem",
      "type": "n8n-nodes-base.if",
      "parameters": {
        "conditions": {
          "string": [{ "value1": "={{ $json.message }}", "operation": "isNotEmpty" }]
        }
      }
    },
    {
      "id": "4",
      "name": "Claude AI - Gerar Resposta",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "url": "https://api.anthropic.com/v1/messages",
        "method": "POST",
        "headers": {
          "x-api-key": "={{ $env.ANTHROPIC_API_KEY }}",
          "anthropic-version": "2023-06-01",
          "content-type": "application/json"
        },
        "body": {
          "model": "claude-sonnet-4-20250514",
          "max_tokens": 500,
          "system": "Você é a BeautyBot, assistente da Clínica Bella Estética. Seja gentil e profissional. Ajude com informações sobre serviços, preços e agendamentos. Para agendar, colete: nome, serviço desejado, data e horário preferidos. Responda sempre em português, de forma calorosa e feminina.",
          "messages": [{
            "role": "user",
            "content": "={{ $json.name }} diz: {{ $json.message }}"
          }]
        }
      }
    },
    {
      "id": "5",
      "name": "Extrair Resposta da IA",
      "type": "n8n-nodes-base.set",
      "parameters": {
        "values": {
          "resposta": "={{ $json.content[0].text }}",
          "phone": "={{ $('Extrair Dados da Mensagem').item.json.phone }}"
        }
      }
    },
    {
      "id": "6",
      "name": "Enviar Resposta via Evolution",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "url": "={{ $env.EVOLUTION_API_URL }}/message/sendText/={{ $env.EVOLUTION_INSTANCE }}",
        "method": "POST",
        "headers": {
          "apikey": "={{ $env.EVOLUTION_API_KEY }}",
          "content-type": "application/json"
        },
        "body": {
          "number": "={{ $json.phone }}",
          "text": "={{ $json.resposta }}"
        }
      }
    }
  ],
  "connections": {
    "Webhook - Receber Mensagem": { "main": [["Extrair Dados da Mensagem"]] },
    "Extrair Dados da Mensagem": { "main": [["Verificar Tipo de Mensagem"]] },
    "Verificar Tipo de Mensagem": { "main": [["Claude AI - Gerar Resposta"], []] },
    "Claude AI - Gerar Resposta": { "main": [["Extrair Resposta da IA"]] },
    "Extrair Resposta da IA": { "main": [["Enviar Resposta via Evolution"]] }
  }
}
```

### 3. Configure as variáveis no N8N

Vá em **Settings → Environment Variables**:

```
ANTHROPIC_API_KEY = sk-ant-...
EVOLUTION_API_URL = https://sua-evolution-api.com
EVOLUTION_API_KEY = sua-chave
EVOLUTION_INSTANCE = bella-estetica-wp
```

---

## 🤖 Personalizando a IA (System Prompt)

Edite o system prompt no nó "Claude AI" do N8N:

```
Você é a BeautyBot, assistente virtual da Clínica Bella Estética.

PERSONALIDADE: Gentil, feminina, profissional e acolhedora.

SERVIÇOS DISPONÍVEIS:
- Limpeza de Pele: 60min — R$ 180
- Preenchimento Labial: 45min — R$ 350 (avaliação gratuita)
- Botox: 30min — R$ 400–800 (avaliação gratuita)
- Microagulhamento: 90min — R$ 280
- Depilação a Laser: 60min — R$ 220

HORÁRIOS: Seg–Sex 8h–19h | Sáb 8h–14h

REGRAS:
- Para injetáveis (botox/preenchimento), convide para avaliação gratuita
- Para agendar, pergunte: nome, serviço, data preferida e horário
- Confirme agendamentos com entusiasmo ✨
- Fora do horário, informe quando voltarão a responder
```

---

## 📱 Fluxo de Atendimento Completo

```
1. Cliente manda mensagem no WhatsApp
2. Evolution API recebe e dispara webhook → N8N
3. N8N extrai a mensagem e envia ao Claude AI
4. Claude AI processa com o prompt da clínica
5. N8N recebe resposta e envia via Evolution API
6. Cliente recebe resposta em segundos
7. Dashboard atualiza conversas em tempo real
```

---

## 🛠️ Funcionalidades do Dashboard

- **Visão Geral**: métricas do dia, agendamentos, mensagens recentes
- **Agendamentos**: tabela completa com filtros, novo agendamento manual
- **Conversas**: interface WhatsApp-like com histórico e controle da IA
- **Serviços**: catálogo com preços e configuração do prompt da IA
- **Configurações**: conexão Evolution API, N8N e Claude AI

---

## 📞 Suporte

Para dúvidas sobre a integração, consulte:
- [Evolution API Docs](https://doc.evolution-api.com)
- [N8N Docs](https://docs.n8n.io)
- [Anthropic API Docs](https://docs.anthropic.com)
