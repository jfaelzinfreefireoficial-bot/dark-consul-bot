const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const path = require('path');

const BOT_TOKEN = process.env.BOT_TOKEN;
const PASTA_BASE = path.join(__dirname, 'arquivos');

const bot = new TelegramBot(BOT_TOKEN, { polling: true });

if (!fs.existsSync(PASTA_BASE)) fs.mkdirSync(PASTA_BASE, { recursive: true });

bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id,
'Bem-vindo ao DARK-CONSUL Bot.\n\n' +
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
'Bot ONLINE - Hospedado no Render\n' +
'Arquivos: ' + qtd
  );
});

bot.onText(/\/zip (.+)/, (msg, match) => {
  const nome = match[1];
  bot.sendMessage(msg.chat.id,
'1. Abra o ZArchiver no seu celular\n' +
'2. Va em: Download -> DARK-CONSUL - Bot\n' +
'3. Toque e segure: ' + nome + '\n' +
'4. Selecione: Comprimir\n' +
'Pasta no celular: Download/DARK-CONSUL - Bot'
  );
});

bot.onText(/\/unzip (.+)/, (msg, match) => {
  const arq = match[1];
  bot.sendMessage(msg.chat.id,
'1. Abra o ZArchiver no seu celular\n' +
'2. Va em: Download -> DARK-CONSUL - Bot\n' +
'3. Toque e segure: ' + arq + '\n' +
'4. Selecione: Extrair aqui\n' +
'Pasta no celular: Download/DARK-CONSUL - Bot'
  );
});

bot.onText(/\/github/, (msg) => {
  bot.sendMessage(msg.chat.id,
'1. Abra github.com\n' +
'2. Entre no repositorio\n' +
'3. Add file -> Upload files\n' +
'4. Selecione os arquivos\n' +
'5. Commit changes\n' +
'O Render atualiza automaticamente.'
  );
});

setInterval(() => {
  console.log('Ativo');
}, 300000);

const PORT = process.env.PORT || 3000;
require('http').createServer((req, res) => {
  res.end('Bot Online');
}).lis
           ten(PORT);
