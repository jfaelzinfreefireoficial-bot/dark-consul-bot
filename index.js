const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const fs = require('fs');
const { MercadoPagoConfig, Payment } = require('mercadopago');

// ========== VARIÁVEIS ==========
const BOT_TOKEN = process.env.BOT_TOKEN;
const RENDER_URL = process.env.RENDER_EXTERNAL_URL;
const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;
const ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID || '';
const PORT = process.env.PORT || 3000;
const PASTA_BASE = './arquivos/';
const WEBHOOK_PATH = `/bot${BOT_TOKEN}`;

// ========== VALIDAÇÃO INICIAL ==========
if (!BOT_TOKEN || !RENDER_URL || !MP_ACCESS_TOKEN) {
  console.error('❌ Faltam variáveis de ambiente!');
  process.exit(1);
}

// ========== INICIALIZAÇÃO ==========
if (!fs.existsSync(PASTA_BASE)) fs.mkdirSync(PASTA_BASE, { recursive: true });
const mpClient = new MercadoPagoConfig({ accessToken: MP_ACCESS_TOKEN });
const bot = new TelegramBot(BOT_TOKEN, { webHook: true });
const app = express();
app.use(express.json());

// ========== BANCO DE DADOS ==========
const PRODUTO_ARQUIVO = `${PASTA_BASE}produto.json`;
const PEDIDOS_ARQUIVO = `${PASTA_BASE}pedidos.json`;

function lerArquivo(caminho) {
  try { return JSON.parse(fs.readFileSync(caminho, 'utf8')); }
  catch { return caminho === PRODUTO_ARQUIVO ? null : {}; }
}
function salvarArquivo(caminho, dados) {
  fs.writeFileSync(caminho, JSON.stringify(dados, null, 2));
}

// ✅ SEU PRODUTO
let produto = lerArquivo(PRODUTO_ARQUIVO) || {
  imagemUrl: 'https://files.catbox.moe/6d2b14.jpeg',
  nome: 'Sens7x FreeFire',
  valor: 5.00,
  descricao: 'Tenha melhor calibração de Mira no Free Fire',
  linkEntrega: 'https://files.catbox.moe/6d2b14.jpeg'
};
let pedidos = lerArquivo(PEDIDOS_ARQUIVO);

// ========== ROTAS ==========
app.post(WEBHOOK_PATH, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

// 📩 WEBHOOK DO MERCADO PAGO
app.post('/mercado-pago-webhook', async (req, res) => {
  try {
    const { type, data } = req.body;
    if (type === 'payment') {
      const paymentId = data.id;
      console.log(`📩 Notificação — Pagamento: ${paymentId}`);
      
      const payment = await new Payment(mpClient).get({ id: paymentId });
      const pedidoId = payment.external_reference;
      const compradorChatId = pedidos[pedidoId]?.chatId;
      
      if (payment.status === 'approved' && compradorChatId && !pedidos[pedidoId]?.entregue) {
        await bot.sendMessage(compradorChatId,
          '✅ *Pagamento confirmado!*\n\n' +
          'Obrigado pela compra! 🎉\n\n' +
          '🔗 Seu produto:\n' + produto.linkEntrega + '\n\n' +
          'Qualquer dúvida, é só chamar! 😊',
          { parse_mode: 'Markdown' }
        );
        
        // Avisa o dono SOMENTE se tiver o ID do admin
        if (ADMIN_CHAT_ID) {
          await bot.sendMessage(ADMIN_CHAT_ID,
            '💰 *VENDA REALIZADA!*\n\n' +
            '📦 Produto: ' + produto.nome + '\n' +
            '💲 Valor: R$ ' + produto.valor.toFixed(2) + '\n' +
            '🆔 Pedido: ' + pedidoId,
            { parse_mode: 'Markdown' }
          );
        }
        
        pedidos[pedidoId].entregue = true;
        salvarArquivo(PEDIDOS_ARQUIVO, pedidos);
      }
    }
    res.sendStatus(200);
  } catch (erro) {
    console.error('❌ Erro webhook:', erro.message);
    res.sendStatus(500);
  }
});

app.get('/', (req, res) => res.send('✅ Bot Online — Mercado Pago Pix'));

// ========== COMANDOS ==========
bot.onText(/\/start/, async (msg) => {
  await bot.sendPhoto(msg.chat.id, produto.imagemUrl, {
    caption:
      '🛒 Bem-vindo ao nosso canal de vendas!\n\n' +
      'Digite /produto para ver nosso produto disponível!',
    parse_mode: 'Markdown'
  });
});

bot.onText(/\/produto/, async (msg) => {
  const chatId = msg.chat.id;
  const pedidoId = `pedido_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
  const valorFormatado = produto.valor.toFixed(2);

  try {
    const payment = await new Payment(mpClient).create({
      body: {
        transaction_amount: produto.valor,
        description: produto.nome,
        payment_method_id: 'pix',
        external_reference: pedidoId,
        notification_url: `${RENDER_URL}/mercado-pago-webhook`,
        payer: { email: 'cliente@exemplo.com' }
      }
    });

    const pixCode = payment.point_of_interaction?.transaction_data?.qr_code;
    const qrCodeBase64 = payment.point_of_interaction?.transaction_data?.qr_code_base64;
    const ticketUrl = payment.point_of_interaction?.transaction_data?.ticket_url;

    if (!pixCode || !qrCodeBase64) throw new Error('Dados do Pix não retornados');

    pedidos[pedidoId] = { chatId, entregue: false, paymentId: payment.id };
    salvarArquivo(PEDIDOS_ARQUIVO, pedidos);

    await bot.sendPhoto(chatId, produto.imagemUrl, {
      caption: `📦 *${produto.nome}*\n\n💲 Valor: R$ ${valorFormatado}\n\n👇 Pague com Pix abaixo:`,
      parse_mode: 'Markdown'
    });

    const qrCodeBuffer = Buffer.from(qrCodeBase64, 'base64');
    await bot.sendPhoto(chatId, qrCodeBuffer, {
      caption:
        '📸 *QR Code Pix* ✅\n\n' +
        '📋 Código Copia e Cola:\n\n' + pixCode + '\n\n' +
        `🔗 Link: ${ticketUrl}\n\n` +
        '⏳ Após pagar, aguarde — envio automático! 🚀',
      parse_mode: 'Markdown'
    });

  } catch (erro) {
    console.error('❌ Erro pagamento:', erro.message);
    await bot.sendMessage(chatId, '⚠️ Erro ao gerar pagamento. Tente novamente.');
  }
});

bot.onText(/\/suporte/, (msg) => {
  bot.sendMessage(msg.chat.id, '📞 Suporte — @faelzin_100k 😊');
});

bot.onText(/\/status/, (msg) => {
  const vendas = Object.values(pedidos).filter(p => p.entregue).length;
  bot.sendMessage(msg.chat.id,
    '✅ Bot ONLINE\n💳 Mercado Pago: Conectado\n📊 Vendas: ' + vendas
  );
});

// ========== INICIAR SERVIDOR ==========
app.listen(PORT, async () => {
  console.log(`✅ Servidor na porta ${PORT}`);
  await bot.setWebHook(`${RENDER_URL}${WEBHOOK_PATH}`);
  console.log(`✅ Webhook Telegram: ${RENDER_URL}${WEBHOOK_PATH}`);
  console.log('✅ Bot pronto! 🚀');
});
