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

// ========== SUA IMAGEM/LOGO DO BOT ✅ ==========
const IMAGEM_LOGO_URL = "https://i.postimg.cc/RZxcB0mF/1791726554389.jpg";

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

// ========== SEUS PRODUTOS ✅ ==========
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
                "Canal oficial: https://youtube.com/@fael_100k_yt?si=Kb48mzTeHsbmRhk7",
    imagemUrl: "https://i.postimg.cc/TwBc5qzw/1791720026046.jpg",
    linkEntrega: "https://www.mediafire.com/file/sjnmojlnhi0kga5/REAL_SENS7X_PRO_-_FREE_FIRE_CLIENTE.7z/file"
  },
  "jogo-gg": {
    id: "jogo-gg",
    nome: "jogo-gg",
    valor: 5.00,
    descricao: "VENHA ADQUIRIR O MELHOR APLICATIVO EDITÁVEL COMPLETO\n\n" +
                "Lembrando não me responsabilizo por uso de forma errado , fique ciente de seus atos!\n\n" +
                "✅ Simulador\n" +
                "✅ pode compartilhar com diversas plataformas e amigos\n" +
                "✅ Perfil , foto , nome 100% editáveis\n" +
                "✅ GG\n\n" +
                "Não fique pra trás, melhore aplicativo de simulador real!\n" +
                "👉 Garanta já o seu aplicativo simulador com muito mais facilidade! Vem comigo! 🚀\n\n" +
                "Canal oficial: https://youtube.com/@fael_100k_yt?si=Kb48mzTeHsbmRhk7",
    imagemUrl: "https://i.postimg.cc/0Q7zZY6r/download-(1).png",
    linkEntrega: "https://www.mediafire.com/file/gpilqf0igtacjvh/Base_-_Banco_Inter_100%2525_Editavel.7z/file"
  }
};

let pedidos = lerArquivo(PEDIDOS_ARQUIVO);

// ========== FUNÇÃO: GERAR TECLADO FIXO ✅ ==========
function gerarTecladoFixo() {
  return {
    keyboard: [
      ['Ver Produtos'],
      ['Sobre', '💬 Suporte'],
      ['Inf. Compras', '📦 Inf. Produto', '💰 Pagamento']
    ],
    resize_keyboard: true,
    one_time_keyboard: false
  };
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
          '👉 Aqui está seu produto:\n' + pedido.linkEntrega + '\n\n' +
          'Não deixe de visitar nosso canal no YouTube:\n' +
          'https://youtube.com/@fael_100k_yt?si=Kb48mzTeHsbmRhk7\n\n' +
          'Bom jogo e resultados nas partidas!'
        );
        
        if (ADMIN_CHAT_ID) {
          await bot.sendMessage(ADMIN_CHAT_ID,
            '👉 VENDA REALIZADA!\n\n' +
            '👉 Produto: ' + pedido.produtoNome + '\n' +
            '👉 Valor: R$ ' + payment.transaction_amount.toFixed(2) + '\n' +
            '📥Pedido: ' + pedidoId + '\n' +
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

// ========== COMANDO /start ==========
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  
  const textoBoasVindas =
    'Bem-vindo(a) à SENS7X MAX!\n\n' +
    'É um prazer enorme receber você aqui! 🎉 Você acabou de chegar no lugar certo pra turbinar sua jogabilidade no Free Fire e alcançar resultados que antes pareciam impossíveis.\n\n' +
    'Aqui na SENS7X MAX nós oferecemos os melhores packs de sensibilidade, cuidadosamente calibrados e testados para você dar muito mais tiros na cabeça, ter movimentos mais precisos e dominar todas as suas partidas!\n\n' +
    'O que você encontra por aqui:\n' +
    '✅ Packs de sensibilidade otimizados para qualquer celular\n' +
    '✅ Configurações atualizadas constantemente\n' +
    '✅ Dicas exclusivas para melhorar ainda mais seu jogo\n' +
    '✅ Suporte sempre que precisar\n\n' +
    'Fique à vontade, explore tudo e aproveite ao máximo! Se tiver qualquer dúvida, é só chamar que eu te ajudo em instantes.\n\n' +
    'Obrigado pela confiança e preferência! 🙏❤️';

  try {
    await bot.sendPhoto(chatId, IMAGEM_LOGO_URL, { caption: '' });
    console.log('✅ Imagem do bot enviada com sucesso!');
  } catch (e) {
    console.log('⚠️ Não foi possível carregar a imagem:', e.message);
  }

  setTimeout(async () => {
    await bot.sendMessage(chatId, textoBoasVindas, {
      reply_markup: gerarTecladoFixo()
    });
  }, 500);
});

// ======================================
// 🆃 NOVOS COMANDOS DE DÚVIDAS FREQUENTES ✅
// ======================================

// ℹ️ /Infcompras — SOBRE COMPRAS
bot.onText(/\/Infcompras|ℹ️ Inf\. Compras/, async (msg) => {
  await bot.sendMessage(msg.chat.id,
    'SOBRE AS COMPRAS:\n\n' +
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
    'Como faço para comprar?\n' +
    '👉 É bem simples! Escolha seu produto, digite /comprar [nome-do-produto], pague com Pix e receba o link na hora aqui no bot! 🚀\n\n' +
    'O pagamento é seguro?\n' +
    '👉 Sim! Processado pelo Mercado Pago, um dos sistemas mais seguros do Brasil. Seus dados estão protegidos! 🔒\n\n' +
    'Quanto tempo demora para chegar?\n' +
    '👉 Na hora! Assim que o pagamento é confirmado, o link aparece automaticamente aqui! ⏳✅\n\n' +
    'Não recebi meu produto, o que faço?\n' +
    '👉 Confirme se o pagamento foi aprovado. Se sim e não chegou, mande mensagem pra gente que reenviamos ou resolvemos em até 24h! 💬\n' +
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
  );
});

// 📦 /InfProduto — SOBRE OS PRODUTOS
bot.onText(/\/InfProduto|📦 Inf\. Produto/, async (msg) => {
  await bot.sendMessage(msg.chat.id,
    'SOBRE OS PRODUTOS:\n\n' +
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
    'Funciona no Android?\n' +
    '✅ Sim! Funciona em qualquer celular Android! 📱\n\n' +
    'Funciona no iOS/iPhone?\n' +
    '⚠️ No momento os packs são otimizados para Android.\n\n' +
    'Funciona no emulador?\n' +
    '❌ Não funciona no emulador.\n\n' +
    'Precisa reiniciar o jogo?\n' +
    '👉 Se for arquivo sim, caso seja somente pack não é necessário reiniciar o dispositivo!\n\n' +
    'Tem risco de banimento?\n' +
    '👉 Não! Caso use arquivos de terceiros há riscos, mas sendo somente packs de sensibilidade não há nenhum risco! ✅🔒\n\n' +
    'Pode usar em mais de um dispositivo?\n' +
    '👉 Pode usar, mas por favor não compartilhe com outras pessoas — cada compra é para uso pessoal. Obrigado! 🙏❤️\n' +
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
  );
});

// 💰 /pay — SOBRE O PAGAMENTO
bot.onText(/\/pay|💰 Pagamento/, async (msg) => {
  await bot.sendMessage(msg.chat.id,
    'SOBRE O PAGAMENTO:\n\n' +
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
    'Quais formas de pagamento?\n' +
    '👉 Pix no momento! Mas também aceitamos cartão em até 2x para produtos acima de R$ 50,00 💳\n\n' +
    'Posso pagar com cartão?\n' +
    '👉 Sim, para produtos acima de R$ 50,00 em até 2x sem juros!\n\n' +
    'Preciso criar conta no Mercado Pago?\n' +
    '👉 Não! Paga direto pelo QR Code ou código Pix, sem cadastro extra ✅\n\n' +
    'O que fazer se a sensibilidade não ficar boa?\n' +
    '👉 Cada celular é único! Nosso pack é o ponto de partida — ajuste um pouquinho conforme seu aparelho e estilo de jogo, com o tempo deixa perfeito! 🎯🔥\n\n' +
    'Posso pedir reembolso?\n' +
    '👉 Como é produto digital e envio imediato, não fazemos reembolso após envio do link. Mas se tiver qualquer problema com o produto, nos avise que resolvemos! 💬\n' +
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
  );
});

// ======================================
// DEMAIS COMANDOS DO BOT ✅
// ======================================

// 🛒 Botão: Ver Produtos
bot.onText(/Ver Produtos/, async (msg) => {
  const chatId = msg.chat.id;
  let mensagem = '😃NOSSA LOJA — PRODUTOS DISPONÍVEIS:\n\n';
  
  for (const [chave, prod] of Object.entries(PRODUTOS)) {
    mensagem += `━━━━━━━━━━━━━━━━\n`;
    mensagem += `📥${prod.nome}\n`;
    mensagem += `Valor: R$ ${prod.valor.toFixed(2)}\n`;
    mensagem += `Digite /comprar ${chave}\n\n`;
  }
  
  mensagem += '━━━━━━━━━━━━━━━━\n' +
              '💡 Como comprar:\n' +
              'Digite /comprar [código do produto]';
  
  await bot.sendMessage(chatId, mensagem);
});

// 💬 Botão: Suporte
bot.onText(/💬 Suporte/, async (msg) => {
  await bot.sendMessage(msg.chat.id,
    'Suporte — SENS7X MAX\n\n' +
    'Canal YouTube: @fael_100k_yt\n' +
    '💬 Dúvidas? É só mandar mensagem!\n\n' +
    'Boa sorte nas partidas!'
  );
});

// 📖 Botão: Sobre
bot.onText(/Sobre/, async (msg) => {
  const vendas = Object.values(pedidos).filter(p => p.entregue).length;
  await bot.sendMessage(msg.chat.id,
    '✅ SENS7X MAX\n\n' +
    'Melhores packs de sensibilidade para Free Fire\n' +
    '📥Produtos: ' + Object.keys(PRODUTOS).length + '\n' +
    'Vendas realizadas: ' + vendas + '\n' +
    'Canal: @fael_100k_yt\n\n' +
    'Boa sorte nas partidas! '
  );
});

// 📋 /loja — Ver produtos
bot.onText(/\/loja/, async (msg) => {
  const chatId = msg.chat.id;
  let mensagem = '🛒 NOSSA LOJA — PRODUTOS DISPONÍVEIS:\n\n';
  
  for (const [chave, prod] of Object.entries(PRODUTOS)) {
    mensagem += `━━━━━━━━━━━━━━━━\n`;
    mensagem += `${prod.nome}\n`;
    mensagem += `Valor: R$ ${prod.valor.toFixed(2)}\n`;
    mensagem += `Digite /comprar ${chave}\n\n`;
  }
  
  mensagem += '━━━━━━━━━━━━━━━━\n' +
              '💡 Como comprar:\n' +
              'Digite /comprar [código do produto]';
  
  await bot.sendMessage(chatId, mensagem);
});

// 🛒 /comprar — Comprar produto
bot.onText(/\/comprar (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const codigo = match[1].trim();
  const produto = PRODUTOS[codigo];
  
  if (!produto) {
    await bot.sendMessage(chatId,
      '⚠️ Produto não encontrado!\n\n' +
      'Digite /loja para ver os produtos disponíveis.'
    );
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
          `📥${produto.nome}\n\n` +
          `👉Valor: R$ ${valorFormatado}\n\n` +
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
        '👉QR Code Pix ✅\n\n' +
        '👉Código Copia e Cola:\n\n' + pixCode + '\n\n' +
        '👉 Link de pagamento: ' + ticketUrl + '\n\n' +
        '⏳ Após pagar, aguarde — envio automático! 🚀'
    });

    console.log(`✅ Pedido criado: ${pedidoId} — ${produto.nome}`);

  } catch (erro) {
    console.error('❌ Erro:', erro.message);
    await bot.sendMessage(chatId, '⚠️ Erro ao gerar pagamento. Tente novamente.');
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
