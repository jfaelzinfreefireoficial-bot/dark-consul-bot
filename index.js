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

// ========== SEU VÍDEO ANIMADO ==========
const VIDEO_LOGO_URL = "https://files.catbox.moe/ntf9me.mp4";

// ========== ARQUIVOS DE DADOS ==========
const PRODUTOS_ARQUIVO = `${PASTA_BASE}produtos.json`;
const PEDIDOS_ARQUIVO = `${PASTA_BASE}pedidos.json`;

// ========== FUNÇÕES DE LEITURA E SALVAMENTO ==========
function lerArquivo(caminho, padrao) {
  try { 
    if (!fs.existsSync(caminho)) return padrao;
    return JSON.parse(fs.readFileSync(caminho, 'utf8')); 
  }
  catch { return padrao; }
}
function salvarArquivo(caminho, dados) {
  fs.writeFileSync(caminho, JSON.stringify(dados, null, 2));
}

// ========== INICIALIZAR PASTA E ARQUIVOS ==========
if (!fs.existsSync(PASTA_BASE)) fs.mkdirSync(PASTA_BASE, { recursive: true });

// ========== 📂 CATEGORIAS E PRODUTOS ==========
let PRODUTOS = lerArquivo(PRODUTOS_ARQUIVO, {
  "sens7x-freefire": {
    id: "sens7x-freefire",
    nome: "SENS7X FREE FIRE",
    valor: 5.00,
    estoque: 999,
    categoria: "sensibilidade",
    descricao: "VENHA ADQUIRIR O MELHOR PACK DE SENSIBILIDADE FREE FIRE!\n\n" +
                "✅ Sensibilidade completa\n" +
                "✅ Funciona em qualquer celular\n" +
                "✅ Mais precisão e menos tiros perdidos\n" +
                "✅ Resultado já na primeira partida!\n\n" +
                "Garanta já o seu!\n\n" +
                "Canal oficial: https://youtube.com/@fael_100k_yt?si=Kb48mzTeHsbmRhk7",
    imagemUrl: "https://i.postimg.cc/TwBc5qzw/1791720026046.jpg",
    linkEntrega: "https://www.mediafire.com/file/sjnmojlnhi0kga5/REAL_SENS7X_PRO_-_FREE_FIRE_CLIENTE.7z/file"
  },
  "jogo-gg": {
    id: "jogo-gg",
    nome: "jogo-gg",
    valor: 5.00,
    estoque: 999,
    categoria: "aplicativos",
    descricao: "VENHA ADQUIRIR O MELHOR APLICATIVO EDITÁVEL COMPLETO\n\n" +
                "⚠️ Não me responsabilizo por uso indevido!\n\n" +
                "✅ Simulador\n" +
                "✅ Compartilhável\n" +
                "✅ Perfil 100% editável\n" +
                "✅ GG\n\n" +
                "Garanta já o seu!\n\n" +
                "Canal oficial: https://youtube.com/@fael_100k_yt?si=Kb48mzTeHsbmRhk7",
    imagemUrl: "https://i.postimg.cc/0Q7zZY6r/download-(1).png",
    linkEntrega: "https://www.mediafire.com/file/gpilqf0igtacjvh/Base_-_Banco_Inter_100%2525_Editavel.7z/file"
  },
  "capcut-pro": {
    id: "capcut-pro",
    nome: "CapCut Pro",
    valor: 5.00,
    estoque: 999,
    categoria: "aplicativos",
    descricao: "VENHA ADQUIRIR O MELHOR APLICATIVO EDITÁVEL COMPLETO\n\n" +
                "⚠️ Não me responsabilizo por uso indevido!\n\n" +
                "✅ Simulador\n" +
                "✅ Compartilhável\n" +
                "✅ Perfil 100% editável\n" +
                "✅ GG\n\n" +
                "Garanta já o seu!\n\n" +
                "Canal oficial: https://youtube.com/@fael_100k_yt?si=Kb48mzTeHsbmRhk7",
    imagemUrl: "https://i.postimg.cc/0Q7zZY6r/download-(1).png",
    linkEntrega: "https://www.mediafire.com/file/gpilqf0igtacjvh/Base_-_Banco_Inter_100%2525_Editavel.7z/file"
  }
});

// 📋 DEFINIÇÃO DAS CATEGORIAS
const CATEGORIAS = {
  sensibilidade: {
    nome: "🎯 Packs de Sensibilidade",
    descricao: "Melhores calibrações para você dar mais tiros na cabeça!"
  },
  aplicativos: {
    nome: "📱 Aplicativos Editáveis",
    descricao: "Apps completos para editar e personalizar!"
  }
};

let pedidos = lerArquivo(PEDIDOS_ARQUIVO, {});

// ========== VALIDAÇÃO ==========
if (!BOT_TOKEN || !RENDER_URL || !MP_ACCESS_TOKEN) {
  console.error('Faltam variáveis de ambiente!');
  process.exit(1);
}

// ========== INICIALIZAÇÃO ==========
const mpClient = new MercadoPagoConfig({ accessToken: MP_ACCESS_TOKEN });
const bot = new TelegramBot(BOT_TOKEN, { webHook: true });
const app = express();
app.use(express.json());

// ========== FUNÇÃO: GERAR TECLADO FIXO ==========
function gerarTecladoFixo() {
  return {
    keyboard: [
      ['🏪 Categorias'],
      ['Sobre', 'Suporte'],
      ['Inf. Compras', 'Inf. Produto', 'Pagamento']
    ],
    resize_keyboard: true,
    one_time_keyboard: false
  };
}

// ========== FUNÇÃO: DIMINUIR ESTOQUE ==========
function diminuirEstoque(produtoId) {
  if (PRODUTOS[produtoId] && PRODUTOS[produtoId].estoque > 0) {
    PRODUTOS[produtoId].estoque -= 1;
    salvarArquivo(PRODUTOS_ARQUIVO, PRODUTOS);
    return true;
  }
  return false;
}

// ========== FUNÇÃO: ADICIONAR ESTOQUE (ADMIN) ==========
function adicionarEstoque(produtoId, quantidade) {
  if (PRODUTOS[produtoId]) {
    PRODUTOS[produtoId].estoque += quantidade;
    salvarArquivo(PRODUTOS_ARQUIVO, PRODUTOS);
    return true;
  }
  return false;
}

// ========== ROTAS DO SERVIDOR ==========
app.post(WEBHOOK_PATH, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

// WEBHOOK — CONFIRMAÇÃO DE PAGAMENTO
app.post('/mercado-pago-webhook', async (req, res) => {
  try {
    const { type, data } = req.body;
    if (type === 'payment') {
      const paymentId = data.id;
      console.log('Notificação — Pagamento:', paymentId);
      
      const payment = await new Payment(mpClient).get({ id: paymentId });
      const pedidoId = payment.external_reference;
      const compradorChatId = pedidos[pedidoId]?.chatId;
      const produtoId = pedidos[pedidoId]?.produtoId;
      
      if (payment.status === 'approved' && compradorChatId && !pedidos[pedidoId]?.entregue) {
        const produto = PRODUTOS[produtoId];
        
        diminuirEstoque(produtoId);
        
        await bot.sendMessage(compradorChatId,
          '✅ Pagamento confirmado!\n\n' +
          '🎉 Parabéns pela sua compra!\n\n' +
          '📦 Aqui está seu produto:\n' + produto.linkEntrega + '\n\n' +
          '📺 Não deixe de visitar nosso canal no YouTube:\n' +
          'https://youtube.com/@fael_100k_yt?si=Kb48mzTeHsbmRhk7\n\n' +
          'Bom jogo e resultados nas partidas!'
        );
        
        if (ADMIN_CHAT_ID) {
          await bot.sendMessage(ADMIN_CHAT_ID,
            '📦 VENDA REALIZADA!\n\n' +
            'Produto: ' + produto.nome + '\n' +
            'Valor: R$ ' + payment.transaction_amount.toFixed(2) + '\n' +
            'Pedido: ' + pedidoId + '\n' +
            'Estoque restante: ' + produto.estoque
          );
        }
        
        pedidos[pedidoId].entregue = true;
        salvarArquivo(PEDIDOS_ARQUIVO, pedidos);
        console.log('Pedido', pedidoId, 'entregue! Estoque atualizado:', produto.estoque);
      }
    }
    res.sendStatus(200);
  } catch (erro) {
    console.error('Erro webhook:', erro.message);
    res.sendStatus(500);
  }
});

app.get('/', (req, res) => res.send('SENS7X MAX — Bot Online'));

// ========== COMANDO /start ==========
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  
  const textoBoasVindas =
    'Bem-vindo(a) à SENS7X MAX!\n\n' +
    'É um prazer enorme receber você aqui! Você chegou no lugar certo pra turbinar sua jogabilidade no Free Fire!\n\n' +
    'Explore nossas categorias abaixo e aproveite ao máximo!\n' +
    'Toque em "🏪 Categorias" para ver tudo que temos!';

  try {
    await bot.sendVideo(chatId, VIDEO_LOGO_URL, { caption: '' });
  } catch (e) {
    console.log('Não foi possível carregar o vídeo:', e.message);
  }

  setTimeout(async () => {
    await bot.sendMessage(chatId, textoBoasVindas, {
      reply_markup: gerarTecladoFixo()
    });
  }, 800);
});

// ========== 🏪 VER CATEGORIAS ==========
async function mostrarCategorias(chatId) {
  let mensagem = '🏪 NOSSA LOJA — ESCOLHA UMA CATEGORIA:\n\n';
  
  for (const [chave, cat] of Object.entries(CATEGORIAS)) {
    mensagem += `${cat.nome}\n`;
    mensagem += `${cat.descricao}\n`;
    mensagem += `Ver produtos: /cat_${chave}\n\n`;
  }
  
  mensagem += '──────────────────────\n' +
              '💡 Escolha uma categoria acima para ver os produtos disponíveis!';
  
  await bot.sendMessage(chatId, mensagem);
}

bot.onText(/🏪 Categorias|\/loja|\/categorias/, async (msg) => {
  await mostrarCategorias(msg.chat.id);
});

// ========== 📂 VER PRODUTOS DE UMA CATEGORIA ==========
bot.onText(/\/cat_(.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const catChave = match[1].trim();
  const categoria = CATEGORIAS[catChave];
  
  if (!categoria) {
    await bot.sendMessage(chatId, '❌ Categoria não encontrada!\n\nDigite /loja para ver todas as categorias.');
    return;
  }
  
  // Filtrar produtos da categoria que tem estoque > 0
  const produtosCategoria = Object.values(PRODUTOS).filter(
    p => p.categoria === catChave && p.estoque > 0
  );
  
  let mensagem = `${categoria.nome.toUpperCase()}\n\n`;
  
  if (produtosCategoria.length === 0) {
    mensagem += '😢 Nenhum produto disponível no momento!\n\nVolte mais tarde, estamos repondo! 📦✨';
  } else {
    for (const prod of produtosCategoria) {
      const avisoEstoque = prod.estoque <= 5 
        ? `⚠️ Últimas ${prod.estoque} unidades!`
        : `✅ Em estoque: ${prod.estoque}`;
      
      mensagem += '──────────────────────\n';
      mensagem += `📦 ${prod.nome}\n`;
      mensagem += `💰 Valor: R$ ${prod.valor.toFixed(2)}\n`;
      mensagem += `${avisoEstoque}\n`;
      mensagem += `Comprar: /comprar ${prod.id}\n\n`;
    }
    mensagem += '──────────────────────\n' +
                '⬅️ /loja — Ver todas as categorias';
  }
  
  await bot.sendMessage(chatId, mensagem);
});

// ========== COMPRAR PRODUTO ==========
bot.onText(/\/comprar (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const codigo = match[1].trim();
  const produto = PRODUTOS[codigo];
  
  if (!produto) {
    await bot.sendMessage(chatId, '❌ Produto não encontrado!\n\nDigite /loja para ver as categorias.');
    return;
  }
  
  if (produto.estoque <= 0) {
    await bot.sendMessage(chatId, 
      `😢 ${produto.nome}\n\n` +
      '❌ Esse produto não está disponível no momento!\n\n' +
      'Escolha outro na loja ou volte mais tarde.'
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
      produtoId: codigo,
      produtoNome: produto.nome,
      linkEntrega: produto.linkEntrega,
      entregue: false,
      paymentId: payment.id
    };
    salvarArquivo(PEDIDOS_ARQUIVO, pedidos);

    const avisoEstoque = produto.estoque <= 5 
      ? `⚠️ Últimas ${produto.estoque} unidades!`
      : `✅ Em estoque: ${produto.estoque}`;

    try {
      await bot.sendPhoto(chatId, produto.imagemUrl, {
        caption:
          `📦 ${produto.nome}\n` +
          `💰 Valor: R$ ${valorFormatado}\n` +
          `${avisoEstoque}\n\n` +
          produto.descricao + '\n\n' +
          '💳 Pague com Pix abaixo:'
      });
    } catch (e) {
      await bot.sendMessage(chatId,
        `📦 ${produto.nome}\n` +
        `💰 Valor: R$ ${valorFormatado}\n` +
        `${avisoEstoque}\n\n` +
        produto.descricao + '\n\n' +
        '💳 Pague com Pix abaixo:'
      );
    }

    const qrCodeBuffer = Buffer.from(qrCodeBase64, 'base64');
    await bot.sendPhoto(chatId, qrCodeBuffer, {
      caption:
        '📱 QR Code Pix\n\n' +
        '📋 Código Copia e Cola:\n\n' + pixCode + '\n\n' +
        '🔗 Link de pagamento: ' + ticketUrl + '\n\n' +
        '⏳ Após pagar, aguarde — envio automático!'
    });

    console.log('Pedido criado:', pedidoId, '-', produto.nome);

  } catch (erro) {
    console.error('Erro:', erro.message);
    await bot.sendMessage(chatId, '❌ Erro ao gerar pagamento. Tente novamente.');
  }
});

// ========== ADMIN — ADICIONAR ESTOQUE ==========
bot.onText(/\/repor (.+) (\d+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  
  if (ADMIN_CHAT_ID && chatId.toString() !== ADMIN_CHAT_ID) {
    await bot.sendMessage(chatId, '❌ Sem permissão.');
    return;
  }
  
  const produtoId = match[1].trim();
  const quantidade = parseInt(match[2]);
  
  if (adicionarEstoque(produtoId, quantidade)) {
    await bot.sendMessage(chatId, 
      `✅ Estoque atualizado!\n\n` +
      `Produto: ${PRODUTOS[produtoId].nome}\n` +
      `Adicionado: +${quantidade}\n` +
      `Total disponível: ${PRODUTOS[produtoId].estoque}\n\n` +
      '📦 Já aparece na categoria automaticamente!'
    );
  } else {
    await bot.sendMessage(chatId, '❌ Produto não encontrado.');
  }
});

// ========== ADMIN — VER ESTOQUE ==========
bot.onText(/\/estoque/, async (msg) => {
  const chatId = msg.chat.id;
  
  if (ADMIN_CHAT_ID && chatId.toString() !== ADMIN_CHAT_ID) {
    await bot.sendMessage(chatId, '❌ Sem permissão.');
    return;
  }
  
  let texto = '📊 CONTROLE DE ESTOQUE:\n\n';
  for (const [id, prod] of Object.entries(PRODUTOS)) {
    const status = prod.estoque > 0 ? '✅' : '❌';
    const catNome = CATEGORIAS[prod.categoria]?.nome || prod.categoria;
    const visibilidade = prod.estoque > 0 ? '✅ Visível' : '❌ Escondido';
    texto += `${status} ${prod.nome} | ${catNome}\n` +
             `   Estoque: ${prod.estoque} | ${visibilidade}\n\n`;
  }
  await bot.sendMessage(chatId, texto);
});

// ========== COMANDOS DE INFORMAÇÃO ==========
bot.onText(/\/Infcompras|Inf\. Compras/, async (msg) => {
  await bot.sendMessage(msg.chat.id,
    '🛒 SOBRE AS COMPRAS:\n\n' +
    '──────────────────────\n' +
    '❓ Como comprar?\n' +
    '/loja → escolha categoria → /comprar [produto] → pague → receba automaticamente!\n\n' +
    '❓ Pagamento seguro? Sim, processado pelo Mercado Pago.\n' +
    '❓ Chega na hora! Assim que aprovado, o link aparece aqui!\n' +
    '❓ Dúvidas? Entre em contato com nosso suporte!'
  );
});

bot.onText(/\/InfProduto|Inf\. Produto/, async (msg) => {
  await bot.sendMessage(msg.chat.id,
    '📦 SOBRE OS PRODUTOS:\n\n' +
    '──────────────────────\n' +
    '✅ Funciona no Android\n' +
    '⚠️ Não funciona emulador\n' +
    '✅ Sem risco de banimento\n' +
    '📺 youtube.com/@fael_100k_yt'
  );
});

bot.onText(/\/pay|Pagamento/, async (msg) => {
  await bot.sendMessage(msg.chat.id,
    '💳 SOBRE O PAGAMENTO:\n\n' +
    '──────────────────────\n' +
    '✅ Aceitamos Pix\n' +
    '✅ Processado pelo Mercado Pago\n' +
    '✅ Entrega automática após confirmação'
  );
});

bot.onText(/Sobre/, async (msg) => {
  const totalVendas = Object.values(pedidos).filter(p => p.entregue).length;
  await bot.sendMessage(msg.chat.id,
    '🏪 SENS7X MAX\n\n' +
    'Melhores packs de sensibilidade para Free Fire!\n' +
    'Categorias disponíveis: ' + Object.keys(CATEGORIAS).length + '\n' +
    'Produtos ativos: ' + Object.values(PRODUTOS).filter(p => p.estoque > 0).length + '\n' +
    'Vendas realizadas: ' + totalVendas + '\n\n' +
    '📺 Canal: youtube.com/@fael_100k_yt\n\n' +
    'Obrigado pela confiança! 💙'
  );
});

bot.onText(/Suporte/, async (msg) => {
  await bot.sendMessage(msg.chat.id,
    '📞 SUPORTE\n\n' +
    '📺 YouTube: youtube.com/@fael_100k_yt\n' +
    '💬 Dúvidas? É só mandar mensagem!\n\n' +
    'Boa sorte nas partidas! 🔥'
  );
});

// ========== INICIAR SERVIDOR ==========
app.listen(PORT, async () => {
  console.log('✅ Servidor rodando na porta', PORT);
  await bot.setWebHook(`${RENDER_URL}${WEBHOOK_PATH}`);
  console.log('✅ Webhook Telegram:', RENDER_URL + WEBHOOK_PATH);
  console.log('✅ Webhook Mercado Pago:', RENDER_URL + '/mercado-pago-webhook');
  console.log('✅ SISTEMA DE CATEGORIAS ATIVADO! 📂');
  console.log('✅ SENS7X MAX — Online! 🚀');
});