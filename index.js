const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const express = require('express');

const BOT_TOKEN = process.env.BOT_TOKEN;
const PASTA_BASE = './arquivos/';
const WEBHOOK_PATH = `/bot${BOT_TOKEN}`;
const PORT = process.env.PORT || 3000;

if (!fs.existsSync(PASTA_BASE)) fs.mkdirSync(PASTA_BASE, { recursive: true });

const bot = new TelegramBot(BOT_TOKEN, { webHook: true });
const app = express();
app.use(express.json());

// Rota do webhook
app.post(WEBHOOK_PATH, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

// Página de status
app.get('/', (req, res) => {
  res.end('Bot Online ✅');
});

// Comandos — iguais aos seus
bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id,
'Bem-vindo ao DARK-CONSUL Bot.\n\n' +
'Pasta: ' + PASTA_BASE + '\n\n' +
'Comandos:\n' +
'/status\n' +
'/zip nome\n' +
'/unzip arquivo.zip\n' +
'/github'
  );
});

bot.onText(/\/status/, (msg) => {
  const qtd = fs.existsSync(PASTA_BASE) ? fs.readdirSync(PASTA_BASE).length : 0;
  bot.sendMessage(msg.chat.id,
'Bot ONLINE - Webhook ativo\n' +
'Pasta local: ' + PASTA_BASE + '\n' +
'Arquivos: ' + qtd
  );
});

bot.onText(/\/zip (.+)/, (msg, match) => {
  const nome = match[1];
  bot.sendMessage(msg.chat.id,
'📦 Arquivo: ' + nome + '\nCaminho: ' + PASTA_BASE
  );
});

bot.onText(/\/unzip (.+)/, (msg, match) => {
  const arq = match[1];
  bot.sendMessage(msg.chat.id,
'📂 Arquivo: ' + arq + '\nCaminho: ' + PASTA_BASE
  );
});

bot.onText(/\/github/, (msg) => {
  bot.sendMessage(msg.chat.id,
'🔄 1. Abra github.com\n2. Repositório\n3. Add file → Upload\n4. Commit\nRender atualiza sozinho ✅'
  );
});

// Inicia servidor
app.listen(PORT, () => {
  console.log('✅ Servidor na porta ' + PORT);
});

// Configura webhook
async function setWebhook() {
  const url = process.env.RENDER_EXTERNAL_URL;
  if (!url) return console.log('⚠️ Defina RENDER_EXTERNAL_URL nas variáveis');
  await bot.setWebHook(url + WEBHOOK_PATH);
  console.log('✅ Webhook:', url + WEBHOOK_PATH);
}
setWebhook();
