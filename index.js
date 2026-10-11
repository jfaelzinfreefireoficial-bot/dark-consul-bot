const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const fs = require('fs');
const { MercadoPagoConfig, Payment } = require('mercadopago');

// ========== VARIÁVEIS DE AMBIENTE ==========
const BOT_TOKEN = process.env.BOT_TOKEN;
const RENDER_URL = process.env.RENDER_EXTERNAL_URL;
const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;
const ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID;
const PORT = process.env.PORT || 3000;
const PASTA_BASE = './arquivos/';
const WEBHOOK_PATH = `/bot${BOT_TOKEN}`;

// ========== INICIALIZAÇÃO ==========
if (!fs.existsSync(PASTA_BASE)) fs.mkdirSync(PASTA_BASE, { recursive: true });

const mpClient = new MercadoPagoConfig({ accessToken: MP_ACCESS_TOKEN });
const bot = new TelegramBot(BOT_TOKEN, { webHook: { port: PORT, host: '0.0.0.0' } });
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

// ✅ EDITE SEU PRODUTO AQUI
let produto = lerArquivo(PRODUTO_ARQUIVO) || {
  imagemUrl: 'https://files.catbox.moe/6d2b14.jpeg',
  nome: 'Sens7x FreeFire',
  valor: 5.00,
  descricao: 'Tenha melhor calibração de Mira no Free Fire',
  linkEntrega: 'https://files.catbox.moe/6d2b14.jpeg'
};
let pedidos = lerArquivo(PEDIDOS_ARQUIVO);

// ========== ROTAS DO SERVIDOR ==========
app.post(WEBHOOK_PATH, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

// 📩 WEBHOOK — RECEBE AVISO DO MERCADO PAGO
app.post('/mercado-pago-webhook', async (req, res) => {
  try {
    const { type, data } = req.body;
    
    if (type === 'payment') {
      const paymentId = data.id;
      console.log(`📩 Notificação recebida — Pagamento ID: ${paymentId}`);
      
      const payment = await new Payment(mpClient).get({ id: paymentId });
      const pedidoId = payment.external_reference;
      const compradorChatId = pedidos[pedidoId]?.chatId;
      
      if (payment.status === 'approved' && compradorChatId && !pedidos[pedidoId]?.entregue) {
        await bot.sendMessage(compradorChatId,
          '✅ *Pagamento confirmado!*\n\n' +
          'Obrigado pela sua compra! 🎉\n\n' +
          '🔗 Aqui está seu produto:\n' +
          produto.linkEntrega + '\n\n' +
          'Qualquer dúvida, é só chamar! 😊',
          { parse_mode: 'Markdown' }
        );
        
        if (ADMIN_CHAT_ID) {
          await bot.sendMessage(ADMIN_CHAT_ID,
            '💰 *VENDA REALIZADA!*\n\n' +
            '📦 Produto: ' + produto.nome + '\n' +
            '💲 Valor: R$ ' + produto.valor.toFixed(2) + '\n' +
            '✅ Pagamento: APROVADO\n' +
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
    console.error('❌ Erro no webhook:', erro.message);
    res.sendStatus(500);
  }
});

app.get('/', (req, res) => {
  res.end('Bot Online ✅ — Pagamento automático com Mercado Pago');
});

// ========== COMANDOS DO BOT ==========

bot.onText(/\/start/, async (msg) => {
  await bot.sendPhoto(msg.chat.id, produto.imagemUrl, {
    caption:
      '🛒 Sejam bem-vindo ao nosso canal oficial de vendas!\n\n' +
      'Confira o que temos para você em nossa Loja Telegram.\n\n' +
      'Digite /produto para ver nosso produto disponível!',
    parse_mode: 'Markdown'
  });
});

// 🛒 /PRODUTO — GERA PAGAMENTO AUTOMATICAMENTE
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

    if (!pixCode || !qrCodeBase64) {
      throw new Error('Mercado Pago não retornou dados do Pix');
    }

    pedidos[pedidoId] = { chatId, pago: false, entregue: false, paymentId: payment.id };
    salvarArquivo(PEDIDOS_ARQUIVO, pedidos);

    // 📦 Dados do produto
    await bot.sendPhoto(chatId, produto.imagemUrl, {
      caption:
        `📦 *${produto.nome}*\n\n` +
        `💲 Valor: R$ ${valorFormatado}\n\n` +
        `${produto.descricao}\n\n` +
        '👇 Pague com Pix abaixo:',
      parse_mode: 'Markdown'
    });

    // 📸 QR Code — CORRIGIDO ✅
    const qrCodeBuffer = Buffer.from(qrCodeBase64, 'base64');
    await bot.sendPhoto(chatId, qrCodeBuffer, {
      caption:
        '📸 *QR Code Pix* ✅\n\n' +
        '📋 Código Copia e Cola:\n\n' +
        pixCode + '\n\n' +
        `🔗 Link de pagamento: ${ticketUrl}\n\n` +
        '⏳ Após pagar, aguarde — eu envio seu produto automaticamente! 🚀',
      parse_mode: 'Markdown'
    });

  } catch (erro) {
    console.error('❌ Erro ao criar pagamento:', erro.message);
    await bot.sendMessage(chatId,
      '⚠️ Erro ao gerar pagamento. Tente novamente em instantes ou contate o suporte.'
    );
  }
});

bot.onText(/Informações sobre BOT/, (msg) => {
  bot.sendMessage(msg.chat.id,
    'Olá! 😊\n\n' +
    'Sou assistente virtual criado por *Faelzin Vendas*.\n\n' +
    'Atendo 24h, sem fila de espera. Pagamentos automáticos via Pix — confirmação instantânea e entrega automática do produto! 🚀',
    { parse_mode: 'Markdown' }
  );
});

bot.onText(/\/suporte/, (msg) => {
  bot.sendMessage(msg.chat.id,
    '📞 Suporte — Faelzin Vendas\n\n' +
    'Precisando de ajuda com produtos ou serviços?\n\n' +
    '📷 Instagram oficial:\n' +
    '@faelzin_100k\n\n' +
    'Atendimento direto com o dono! 😊'
  );
});

bot.onText(/\/status/, (msg) => {
  const qtd = fs.existsSync(PASTA_BASE) ? fs.readdirSync(PASTA_BASE).length : 0;
  const vendas = Object.values(pedidos).filter(p => p.entregue).length;
  bot.sendMessage(msg.chat.id,
    '✅ Bot ONLINE — Webhook ativo\n' +
    '💳 Mercado Pago: Conectado\n' +
    '📊 Vendas realizadas: ' + vendas + '\n' +
    '📁 Arquivos: ' + qtd
  );
});

// ========== INICIAR SERVIDOR ==========
app.listen(PORT, async () => {
  console.log(`✅ Servidor rodando na porta ${PORT}`);
  await bot.setWebHook(`${RENDER_URL}${WEBHOOK_PATH}`);
  console.log(`✅ Webhook Telegram: ${RENDER_URL}${WEBHOOK_PATH}`);
  console.log(`✅ Webhook MP: ${RENDER_URL}/mercado-pago-webhook`);
  console.log('✅ Bot pronto para uso! 🚀');
});
