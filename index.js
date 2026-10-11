const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const fs = require('fs');
const { MercadoPagoConfig, Payment } = require('mercadopago');

// ========== VARIÁVEIS DE AMBIENTE ==========
const BOT_TOKEN = process.env.BOT_TOKEN;
const RENDER_URL = process.env.RENDER_EXTERNAL_URL;
const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;
const ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID || '';
const PORT = process.env.PORT || 3000;
const PASTA_BASE = './arquivos/';
const WEBHOOK_PATH = `/bot${BOT_TOKEN}`;

// ========== VALIDAÇÃO ==========
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
const PEDIDOS_ARQUIVO = `${PASTA_BASE}pedidos.json`;

function lerArquivo(caminho) {
  try { return JSON.parse(fs.readFileSync(caminho, 'utf8')); }
  catch { return {}; }
}
function salvarArquivo(caminho, dados) {
  fs.writeFileSync(caminho, JSON.stringify(dados, null, 2));
}

// ========== SUA LOJA — PRODUTOS ==========
const PRODUTOS = {
  "sens7x-freefire": {
    id: "sens7x-freefire",
    nome: "SENS7X FREE FIRE",
    valor: 5.00,
    descricao: "VENHA ADQUIRIR O MELHOR PACK DE SENSIBILIDADE FREE FIRE!\n\n" +
                "Quer dar aquele salto de qualidade nas suas partidas? Esse pack foi testado e ajustado pra você acertar muito mais tiros na cabeça!\n\n" +
                "✅ Sensibilidade completa\n" +
                "✅ Funciona em qualquer celular\n" +
                "✅ Mais precisão e menos tiros perdidos\n" +
                "✅ Resultado já na primeira partida!\n\n" +
                "Não fique pra trás, melhore seu jogo HOJE!\n" +
                "👉 Garanta já o seu e suba de rank com muito mais facilidade! Vem comigo! 🚀\n\n" +
                "📺 Canal oficial: https://youtube.com/@fael_100k_yt?si=Kb48mzTeHsbmRhk7",
    imagemUrl: "https://files.catbox.moe/5eehlb.png",
    linkEntrega: "https://www.mediafire.com/file/gpilqf0igtacjvh/Base_-_Banco_Inter_100%2525_Editavel.7z/file"
  },
  "produto-dois": {
    id: "produto-dois",
    nome: "NOME DO PRODUTO 2",
    valor: 10.00,
    descricao: "Descrição do seu segundo produto aqui.\n\n" +
                "✅ Ponto forte 1\n" +
                "✅ Ponto forte 2\n" +
                "✅ Ponto forte 3\n\n" +
                "Adquira já e melhore ainda mais seu jogo! 🚀",
    imagemUrl: "https://files.catbox.moe/6d2b14.jpeg",
    linkEntrega: "https://www.mediafire.com/file/kfl3oyqum2eicty/MediaFire_-_Getting_Started.pdf/file"
  },
  
};

let pedidos = lerArquivo(PEDIDOS_ARQUIVO);

// ========== FUNÇÃO: GERAR TECLADO DE PRODUTOS ==========
function gerarTecladoProdutos() {
  const botoes = [];
  for (const [chave, prod] of Object.entries(PRODUTOS)) {
    botoes.push([{
      text: `📦 ${prod.nome} — R$ ${prod.valor.toFixed(2)}`,
      callback_data: `comprar_${chave}`
    }]);
  }
  botoes.push([
    { text: '📺 Canal YouTube', callback_data: 'canal' },
    { text: '💬 Suporte', callback_data: 'suporte' }
  ]);
  return { inline_keyboard: botoes };
}

// ========== ROTAS DO SERVIDOR ==========
app.post(WEBHOOK_PATH, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

// 📩 WEBHOOK — CONFIRMAÇÃO DE PAGAMENTO
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
        const pedido = pedidos[pedidoId];
        
        await bot.sendMessage(compradorChatId,
          '✅ Pagamento confirmado!\n\n' +
          '🎉 Parabéns pela sua compra!\n\n' +
          '🔗 Aqui está seu produto:\n' + pedido.linkEntrega + '\n\n' +
          '📺 Não deixe de visitar nosso canal no YouTube:\n' +
          'https://youtube.com/@fael_100k_yt?si=Kb48mzTeHsbmRhk7\n\n' +
          'Boa sorte nas partidas e BOA CAÇÃO! 🎯🔥'
        );
        
        if (ADMIN_CHAT_ID) {
          await bot.sendMessage(ADMIN_CHAT_ID,
            '💰 VENDA REALIZADA!\n\n' +
            '📦 Produto: ' + pedido.produtoNome + '\n' +
            '💲 Valor: R$ ' + payment.transaction_amount.toFixed(2) + '\n' +
            '🆔 Pedido: ' + pedidoId + '\n' +
            '👤 Cliente ID: ' + compradorChatId
          );
        }
        
        pedido.entregue = true;
        salvarArquivo(PEDIDOS_ARQUIVO, pedidos);
        console.log(`✅ Pedido ${pedidoId} entregue!`);
      }
    }
    res.sendStatus(200);
  } catch (erro) {
    console.error('❌ Erro webhook:', erro.message);
    res.sendStatus(500);
  }
});

app.get('/', (req, res) => res.send('✅ SENS7X MAX — Bot Online'));

// ========== COMANDOS DO BOT ==========

// 👋 /start — Boas-vindas com teclado
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  
  const boasVindas =
    'Bem-vindo(a) à SENS7X MAX!\n\n' +
    'É um prazer enorme receber você aqui! 🎉 Você acabou de chegar no lugar certo pra turbinar sua jogabilidade no Free Fire e alcançar resultados que antes pareciam impossíveis.\n\n' +
    'Aqui na SENS7X MAX nós oferecemos os melhores packs de sensibilidade, cuidadosamente calibrados e testados para você dar muito mais tiros na cabeça, ter movimentos mais precisos e dominar todas as suas partidas!\n\n' +
    '👇 Escolha abaixo ou digite /loja para ver nossos produtos!';
  
  await bot.sendMessage(chatId, boasVindas, {
    reply_markup: gerarTecladoProdutos()
  });
});

// 📋 /loja — Mostra produtos com botões
bot.onText(/\/loja/, async (msg) => {
  const chatId = msg.chat.id;
  await bot.sendMessage(chatId, '🛒 NOSSA LOJA — Escolha um produto abaixo:', {
    reply_markup: gerarTecladoProdutos()
  });
});

// 📺 /canal
bot.onText(/\/canal/, async (msg) => {
  await bot.sendMessage(msg.chat.id,
    '📺 Nosso Canal no YouTube:\n\n' +
    'https://youtube.com/@fael_100k_yt?si=Kb48mzTeHsbmRhk7\n\n' +
    'Se inscreva e acompanhe nossas novidades! 🎬🔥'
  );
});

// ❓ /suporte
bot.onText(/\/suporte/, async (msg) => {
  await bot.sendMessage(msg.chat.id,
    '📞 Suporte — SENS7X MAX\n\n' +
    '📺 Canal YouTube: @fael_100k_yt\n' +
    '💬 Dúvidas? É só mandar mensagem!\n\n' +
    'Boa sorte nas partidas! 🎯🔥'
  );
});

// 📊 /status
bot.onText(/\/status/, async (msg) => {
  const vendas = Object.values(pedidos).filter(p => p.entregue).length;
  await bot.sendMessage(msg.chat.id,
    '✅ SENS7X MAX — Bot ONLINE\n' +
    '💳 Mercado Pago: Conectado\n' +
    '📦 Produtos cadastrados: ' + Object.keys(PRODUTOS).length + '\n' +
    '💰 Vendas realizadas: ' + vendas + '\n' +
    '📺 Canal: @fael_100k_yt'
  );
});

// ========== TRATAMENTO DE CLIQUES NOS BOTÕES ==========
bot.on('callback_query', async (query) => {
  const chatId = query.message.chat.id;
  const data = query.data;
  
  // Responde ao clique (fecha o "carregando" no botão)
  await bot.answerCallbackQuery(query.id);
  
  if (data.startsWith('comprar_')) {
    const codigo = data.replace('comprar_', '');
    const produto = PRODUTOS[codigo];
    
    if (!produto) {
      await bot.sendMessage(chatId, '⚠️ Produto não encontrado!');
      return;
    }
    
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

      pedidos[pedidoId] = {
        chatId,
        produtoNome: produto.nome,
        linkEntrega: produto.linkEntrega,
        entregue: false,
        paymentId: payment.id
      };
      salvarArquivo(PEDIDOS_ARQUIVO, pedidos);

      try {
        await bot.sendPhoto(chatId, produto.imagemUrl, {
          caption:
            `📦 ${produto.nome}\n\n` +
            `💲 Valor: R$ ${valorFormatado}\n\n` +
            `${produto.descricao}\n\n` +
            '👇 Pague com Pix abaixo:'
        });
      } catch (e) {
        await bot.sendMessage(chatId,
          `📦 ${produto.nome}\n` +
          `💲 Valor: R$ ${valorFormatado}\n\n` +
          `${produto.descricao}\n\n` +
          '👇 Pague com Pix abaixo:'
        );
      }

      const qrCodeBuffer = Buffer.from(qrCodeBase64, 'base64');
      await bot.sendPhoto(chatId, qrCodeBuffer, {
        caption:
          '📸 QR Code Pix ✅\n\n' +
          '📋 Código Copia e Cola:\n\n' + pixCode + '\n\n' +
          '🔗 Link de pagamento: ' + ticketUrl + '\n\n' +
          '⏳ Após pagar, aguarde — envio automático! 🚀'
      });

      console.log(`✅ Pedido criado: ${pedidoId} — ${produto.nome}`);

    } catch (erro) {
      console.error('❌ Erro:', erro.message);
      await bot.sendMessage(chatId, '⚠️ Erro ao gerar pagamento. Tente novamente.');
    }
  }
  else if (data === 'canal') {
    await bot.sendMessage(chatId,
      '📺 Nosso Canal no YouTube:\n\n' +
      'https://youtube.com/@fael_100k_yt?si=Kb48mzTeHsbmRhk7\n\n' +
      'Se inscreva e acompanhe nossas novidades! 🎬🔥'
    );
  }
  else if (data === 'suporte') {
    await bot.sendMessage(chatId,
      '📞 Suporte — SENS7X MAX\n\n' +
      '📺 Canal YouTube: @fael_100k_yt\n' +
      '💬 Dúvidas? É só mandar mensagem!\n\n' +
      'Boa sorte nas partidas! 🎯🔥'
    );
  }
});

// ========== INICIAR SERVIDOR ==========
app.listen(PORT, async () => {
  console.log(`✅ Servidor rodando na porta ${PORT}`);
  await bot.setWebHook(`${RENDER_URL}${WEBHOOK_PATH}`);
  console.log(`✅ Webhook Telegram: ${RENDER_URL}${WEBHOOK_PATH}`);
  console.log(`✅ Webhook Mercado Pago: ${RENDER_URL}/mercado-pago-webhook`);
  console.log('✅ SENS7X MAX — Bot pronto! 🚀🔥');
});
