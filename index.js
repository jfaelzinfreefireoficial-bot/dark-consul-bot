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
const USUARIOS_GERAR_ARQUIVO = `${PASTA_BASE}usuarios_gerar.json`;

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
    valor: 11.99,
    estoque: 50,
    categoria: "sensibilidade",
    descricao: "VENHA ADQUIRIR O MELHOR PACK DE SENSIBILIDADE FREE FIRE!\n\n" +
                "Quer dar aquele salto de qualidade nas suas partidas? Esse pack foi testado e ajustado pra voce acertar muito mais tiros na cabeca!\n\n" +
                "Sensibilidade completa\n" +
                "Funciona em qualquer celular\n" +
                "Mais precisao e menos tiros perdidos\n" +
                "Resultado ja na primeira partida!\n\n" +
                "Nao fique pra tras, melhore seu jogo HOJE!\n" +
                "Garanta ja o seu e suba de rank com muito mais facilidade! Vem comigo!\n\n" +
                "Canal oficial: https://youtube.com/@fael_100k_yt?si=Kb48mzTeHsbmRhk7",
    imagemUrl: "https://i.postimg.cc/TwBc5qzw/1791720026046.jpg",
    linkEntrega: "https://www.mediafire.com/file/sjnmojlnhi0kga5/REAL_SENS7X_PRO_-_FREE_FIRE_CLIENTE.7z/file"
  },
  "nubank-entretenimento": {
    id: "nubank-entretenimento",
    nome: "NUBANK BANCO ENTRETENIMENTO",
    valor: 11.99,
    estoque: 50,
    categoria: "aplicativos",
    descricao: "Venha adquirir o melhor aplicativo completo editavel\n\n" +
                "Lembrando que nao me responsabilizo por uso indevido, use por sua conta e risco!\n\n" +
                "Simulador de transferencias, comprovantes, editar perfil e muito mais\n" +
                "Compartilhe comprovantes com amigos com hora e data em tempo real\n" +
                "Edite saldo, foto de perfil, destinatario\n" +
                "Suporte direto no WhatsApp\n\n" +
                "Nao fique pra tras, garanta ja o seu!\n\n" +
                "Canal oficial: https://youtube.com/@fael_100k_yt?si=Kb48mzTeHsbmRhk7",
    imagemUrl: "https://i.postimg.cc/nzkvYxVt/NUBANK.png",
    linkEntrega: "https://www.mediafire.com/file/06tr2nywlodysjb/NUBANK_EDIT_C3%81VEL_CLIENTE_%C2%AEFAEL_VENDAS_OFICIAL.7z/file"
  },
  "inter-entretenimento": {
    id: "inter-entretenimento",
    nome: "INTER BANCO ENTRETENIMENTO",
    valor: 11.99,
    estoque: 50,
    categoria: "aplicativos",
    descricao: "VENHA ADQUIRIR O MELHOR APLICATIVO EDITAVEL COMPLETO\n\n" +
                "Lembrando que nao me responsabilizo por uso indevido, use por sua conta e risco!\n\n" +
                "Simulador completo 100% editavel\n" +
                "Edite saldo, foto de perfil, nome, comprovantes e muito mais\n" +
                "Edite dados do destinatario\n" +
                "Aplicativo seguro, rapido e confiavel\n\n" +
                "Nao fique pra tras, garanta ja o seu!\n\n" +
                "Canal oficial: https://youtube.com/@fael_100k_yt?si=Kb48mzTeHsbmRhk7",
    imagemUrl: "https://i.postimg.cc/0Q7zZY6r/download-(1).png",
    linkEntrega: "https://www.mediafire.com/file/uf1nhkkev88v380/INTER_EDIT_C3%81VEL_CLIENTE_%C2%AEFAEL_VENDAS_OFICIAL.7z/file"
  }
});

const CATEGORIAS = {
  sensibilidade: {
    nome: "Sensibilidade Free Fire",
    descricao: "Melhores calibracoes e ajuste de mira para o seu Free Fire"
  },
  aplicativos: {
    nome: "Aplicativos Premium",
    descricao: "Aplicativos completos e atualizados"
  }
};

let pedidos = lerArquivo(PEDIDOS_ARQUIVO, {});
let usuariosGerar = lerArquivo(USUARIOS_GERAR_ARQUIVO, {});

// ========== VALIDAÇÃO ==========
if (!BOT_TOKEN || !RENDER_URL || !MP_ACCESS_TOKEN) {
  console.error('Faltam variaveis de ambiente!');
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
      ['Categorias'],
      ['Gerar Sensibilidade'],
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

// ========== FUNÇÃO: ADICIONAR ESTOQUE ==========
function adicionarEstoque(produtoId, quantidade) {
  if (PRODUTOS[produtoId]) {
    PRODUTOS[produtoId].estoque += quantidade;
    salvarArquivo(PRODUTOS_ARQUIVO, PRODUTOS);
    return true;
  }
  return false;
}

// ========== FUNÇÃO: GERAR SENSIBILIDADE ALEATORIA ==========
function gerarSensibilidade() {
  const geral = Math.floor(Math.random() * 101) + 100;
  const pontoVermelho = Math.floor(Math.random() * 61) + 40;
  const mira2x = Math.floor(Math.random() * 81) + 60;
  const mira4x = Math.floor(Math.random() * 81) + 60;
  const awm = Math.floor(Math.random() * 101) + 50;
  const olhadinha = Math.floor(Math.random() * 81) + 40;
  const dpi = [320, 360, 390, 411, 450, 480, 520, 576, 600, 720][Math.floor(Math.random() * 10)];
  const botaoAtirar = Math.floor(Math.random() * 31) + 45;

  return `Geral: ${geral}
Ponto vermelho: ${pontoVermelho}
Mira 2x: ${mira2x}
Mira 4x: ${mira4x}
Awm: ${awm}
Olhadinha: ${olhadinha}
DPI recomendado: ${dpi}
Tamanho Botao Atirar: ${botaoAtirar}%

Aviso: Sensibilidade gerada aleatoriamente. Ajuste conforme seu celular e seu estilo de jogo. Bom jogo!`;
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
      console.log('Notificacao — Pagamento:', paymentId);
      
      const payment = await new Payment(mpClient).get({ id: paymentId });
      const pedidoId = payment.external_reference;
      const compradorChatId = pedidos[pedidoId]?.chatId;
      const tipo = pedidos[pedidoId]?.tipo;
      
      if (payment.status === 'approved' && compradorChatId && !pedidos[pedidoId]?.entregue) {
        
        if (tipo === 'gerar_sensibilidade') {
          const sensibilidade = gerarSensibilidade();
          
          await bot.sendMessage(compradorChatId,
            'Pagamento efetuado com sucesso!\n\n' + sensibilidade
          );
          
          usuariosGerar[compradorChatId] = {
            podeGerar: true,
            ultimaGeracao: null
          };
          salvarArquivo(USUARIOS_GERAR_ARQUIVO, usuariosGerar);
          
          if (ADMIN_CHAT_ID) {
            await bot.sendMessage(ADMIN_CHAT_ID,
              'GERACAO DE SENSIBILIDADE PAGA!\n\n' +
              'Pedido: ' + pedidoId + '\n' +
              'Valor: R$ 0,80'
            );
          }
        } else {
          const produtoId = pedidos[pedidoId]?.produtoId;
          const produto = PRODUTOS[produtoId];
          
          diminuirEstoque(produtoId);
          
          await bot.sendMessage(compradorChatId,
            'Pagamento confirmado!\n\n' +
            'Parabens pela sua compra!\n\n' +
            'Aqui esta seu produto:\n' + produto.linkEntrega + '\n\n' +
            'Nao deixe de visitar nosso canal no YouTube:\n' +
            'https://youtube.com/@fael_100k_yt?si=Kb48mzTeHsbmRhk7\n\n' +
            'Obrigado pela compra e referencias!'
          );
          
          if (ADMIN_CHAT_ID) {
            await bot.sendMessage(ADMIN_CHAT_ID,
              'VENDA REALIZADA!\n\n' +
              'Produto: ' + produto.nome + '\n' +
              'Valor: R$ ' + payment.transaction_amount.toFixed(2) + '\n' +
              'Pedido: ' + pedidoId + '\n' +
              'Estoque restante: ' + produto.estoque
            );
          }
        }
        
        pedidos[pedidoId].entregue = true;
        salvarArquivo(PEDIDOS_ARQUIVO, pedidos);
        console.log('Pedido', pedidoId, 'concluido!');
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
    'Bem-vindo(a) a SENS7X MAX!\n\n' +
    'E um prazer enorme receber voce aqui! Voce acabou de chegar no lugar certo pra turbinar sua jogabilidade no Free Fire e alcancar resultados que antes pareciam impossiveis.\n\n' +
    'Aqui na SENS7X MAX nos oferecemos os melhores packs de sensibilidade, cuidadosamente calibrados e testados para voce dar muito mais tiros na cabeca, ter movimentos mais precisos e dominar todas as suas partidas!\n\n' +
    'O que voce encontra por aqui:\n' +
    'Packs de sensibilidade otimizados para qualquer celular\n' +
    'Configuracoes atualizadas constantemente\n' +
    'Dicas exclusivas para melhorar ainda mais seu jogo\n' +
    'Suporte sempre que precisar\n\n' +
    'Fique a vontade, explore tudo e aproveite ao maximo! Se tiver qualquer duvida, e so chamar que eu te ajudo em instantes.\n\n' +
    'Obrigado pela confianca e preferencia!';

  try {
    await bot.sendVideo(chatId, VIDEO_LOGO_URL, { caption: '' });
  } catch (e) {
    console.log('Nao foi possivel carregar o video:', e.message);
  }

  setTimeout(async () => {
    await bot.sendMessage(chatId, textoBoasVindas, {
      reply_markup: gerarTecladoFixo()
    });
  }, 800);
});

// ========== GERAR SENSIBILIDADE ==========
bot.onText(/Gerar Sensibilidade|\/gerar/, async (msg) => {
  const chatId = msg.chat.id;
  const usuario = usuariosGerar[chatId];

  if (usuario && usuario.podeGerar) {
    const sensibilidade = gerarSensibilidade();
    await bot.sendMessage(chatId, sensibilidade);
    return;
  }

  const pedidoId = `pedido_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;

  try {
    const payment = await new Payment(mpClient).create({
      body: {
        transaction_amount: 0.80,
        description: 'Gerar Sensibilidade Free Fire',
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
      throw new Error('Mercado Pago nao retornou dados do Pix');
    }

    pedidos[pedidoId] = {
      chatId,
      tipo: 'gerar_sensibilidade',
      entregue: false,
      paymentId: payment.id
    };
    salvarArquivo(PEDIDOS_ARQUIVO, pedidos);

    const qrCodeBuffer = Buffer.from(qrCodeBase64, 'base64');
    await bot.sendPhoto(chatId, qrCodeBuffer, {
      caption:
        'Gerar Sensibilidade Free Fire\n' +
        'Valor: R$ 0,80\n\n' +
        'Codigo Copia e Cola:\n\n' + pixCode + '\n\n' +
        'Link de pagamento: ' + ticketUrl + '\n\n' +
        'Apos pagar, sua sensibilidade aparecera automaticamente!'
    });

    console.log('Pedido gerar sensibilidade:', pedidoId);

  } catch (erro) {
    console.error('Erro:', erro.message);
    await bot.sendMessage(chatId, 'Erro ao gerar pagamento. Tente novamente.');
  }
});

// ========== MOSTRAR CATEGORIAS ==========
async function mostrarCategorias(chatId) {
  let mensagem = 'NOSSA LOJA — ESCOLHA UMA CATEGORIA:\n\n';
  
  for (const [chave, cat] of Object.entries(CATEGORIAS)) {
    mensagem += `${cat.nome}\n`;
    mensagem += `${cat.descricao}\n`;
    mensagem += `Ver produtos: /cat_${chave}\n\n`;
  }
  
  mensagem += '──────────────────────\n' +
              'Escolha uma categoria acima para ver os produtos disponiveis!';
  
  await bot.sendMessage(chatId, mensagem);
}

bot.onText(/Categorias|\/loja|\/categorias/, async (msg) => {
  await mostrarCategorias(msg.chat.id);
});

// ========== VER PRODUTOS POR CATEGORIA ==========
bot.onText(/\/cat_(.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const catChave = match[1].trim();
  const categoria = CATEGORIAS[catChave];
  
  if (!categoria) {
    await bot.sendMessage(chatId, 'Categoria nao encontrada!\n\nDigite /loja para ver todas as categorias.');
    return;
  }
  
  const produtosCategoria = Object.values(PRODUTOS).filter(
    p => p.categoria === catChave && p.estoque > 0
  );
  
  let mensagem = `${categoria.nome.toUpperCase()}\n\n`;
  
  if (produtosCategoria.length === 0) {
    mensagem += 'Nenhum produto disponivel no momento!\n\nVolte mais tarde, estamos repondo tudo pra voce!';
  } else {
    for (const prod of produtosCategoria) {
      const avisoEstoque = prod.estoque <= 5 
        ? `Ultimas ${prod.estoque} unidades!`
        : `Em estoque: ${prod.estoque}`;
      
      mensagem += '──────────────────────\n';
      mensagem += `${prod.nome}\n`;
      mensagem += `Valor: R$ ${prod.valor.toFixed(2)}\n`;
      mensagem += `${avisoEstoque}\n`;
      mensagem += `Comprar: /comprar ${prod.id}\n\n`;
    }
    mensagem += '──────────────────────\n' +
                '/loja — Ver todas as categorias';
  }
  
  await bot.sendMessage(chatId, mensagem);
});

// ========== COMPRAR PRODUTO ==========
bot.onText(/\/comprar (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const codigo = match[1].trim();
  const produto = PRODUTOS[codigo];
  
  if (!produto) {
    await bot.sendMessage(chatId, 'Produto nao encontrado!\n\nDigite /loja para ver as categorias.');
    return;
  }
  
  if (produto.estoque <= 0) {
    await bot.sendMessage(chatId, 
      `${produto.nome}\n\n` +
      'Esse produto nao esta disponivel no momento!\n\n' +
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
      throw new Error('Mercado Pago nao retornou dados do Pix');
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
      ? `Ultimas ${produto.estoque} unidades!`
      : `Em estoque: ${produto.estoque}`;

    try {
      await bot.sendPhoto(chatId, produto.imagemUrl, {
        caption:
          `${produto.nome}\n` +
          `Valor: R$ ${valorFormatado}\n` +
          `${avisoEstoque}\n\n` +
          produto.descricao + '\n\n' +
          'Pague com Pix abaixo:'
      });
    } catch (e) {
      await bot.sendMessage(chatId,
        `${produto.nome}\n` +
        `Valor: R$ ${valorFormatado}\n` +
        `${avisoEstoque}\n\n` +
        produto.descricao + '\n\n' +
        'Pague com Pix abaixo:'
      );
    }

    const qrCodeBuffer = Buffer.from(qrCodeBase64, 'base64');
    await bot.sendPhoto(chatId, qrCodeBuffer, {
      caption:
        'QR Code Pix\n\n' +
        'Codigo Copia e Cola:\n\n' + pixCode + '\n\n' +
        'Link de pagamento: ' + ticketUrl + '\n\n' +
        'Apos pagar, aguarde — envio automatico!'
    });

    console.log('Pedido criado:', pedidoId, '-', produto.nome);

  } catch (erro) {
    console.error('Erro:', erro.message);
    await bot.sendMessage(chatId, 'Erro ao gerar pagamento. Tente novamente.');
  }
});

// ========== ADMIN — REPOR ESTOQUE ==========
bot.onText(/\/repor (.+) (\d+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  
  if (ADMIN_CHAT_ID && chatId.toString() !== ADMIN_CHAT_ID) {
    await bot.sendMessage(chatId, 'Sem permissao.');
    return;
  }
  
  const produtoId = match[1].trim();
  const quantidade = parseInt(match[2]);
  
  if (adicionarEstoque(produtoId, quantidade)) {
    await bot.sendMessage(chatId, 
      'Estoque atualizado!\n\n' +
      `Produto: ${PRODUTOS[produtoId].nome}\n` +
      `Adicionado: +${quantidade}\n` +
      `Total disponivel: ${PRODUTOS[produtoId].estoque}\n\n` +
      'Ja aparece na loja automaticamente!'
    );
  } else {
    await bot.sendMessage(chatId, 'Produto nao encontrado.');
  }
});

// ========== ADMIN — VER ESTOQUE ==========
bot.onText(/\/estoque/, async (msg) => {
  const chatId = msg.chat.id;
  
  if (ADMIN_CHAT_ID && chatId.toString() !== ADMIN_CHAT_ID) {
    await bot.sendMessage(chatId, 'Sem permissao.');
    return;
  }
  
  let texto = 'CONTROLE DE ESTOQUE:\n\n';
  for (const [id, prod] of Object.entries(PRODUTOS)) {
    const status = prod.estoque > 0 ? 'Disponivel' : 'Esgotado';
    const catNome = CATEGORIAS[prod.categoria]?.nome || prod.categoria;
    const visibilidade = prod.estoque > 0 ? 'Visivel na loja' : 'Escondido da loja';
    texto += `${prod.nome} | ${catNome}\n` +
             `Estoque: ${prod.estoque} | ${status} | ${visibilidade}\n\n`;
  }
  await bot.sendMessage(chatId, texto);
});

// ========== COMANDOS DE INFORMACAO ==========
bot.onText(/\/Infcompras|Inf\. Compras/, async (msg) => {
  await bot.sendMessage(msg.chat.id,
    'SOBRE AS COMPRAS:\n\n' +
    'Como comprar?\n' +
    '/loja → escolha categoria → /comprar [produto] → pague com Pix → receba automaticamente!\n\n' +
    'Pagamento seguro? Sim, processado pelo Mercado Pago.\n' +
    'Quanto tempo chega? Na hora! Assim que aprovado, o link aparece aqui!\n' +
    'Nao recebi? Confirme o pagamento e nos avise!'
  );
});

bot.onText(/\/InfProduto|Inf\. Produto/, async (msg) => {
  await bot.sendMessage(msg.chat.id,
    'SOBRE OS PRODUTOS:\n\n' +
    'Funciona no Android\n' +
    'Nao funciona no emulador\n' +
    'Sem risco de banimento\n' +
    'Canal: youtube.com/@fael_100k_yt'
  );
});

bot.onText(/\/pay|Pagamento/, async (msg) => {
  await bot.sendMessage(msg.chat.id,
    'SOBRE O PAGAMENTO:\n\n' +
    'Aceitamos Pix\n' +
    'Processado pelo Mercado Pago\n' +
    'Entrega automatica apos confirmacao'
  );
});

bot.onText(/Sobre/, async (msg) => {
  const totalVendas = Object.values(pedidos).filter(p => p.entregue).length;
  await bot.sendMessage(msg.chat.id,
    'SENS7X MAX\n\n' +
    'Melhores produtos e packs de sensibilidade Free Fire!\n' +
    'Categorias disponiveis: ' + Object.keys(CATEGORIAS).length + '\n' +
    'Produtos ativos: ' + Object.values(PRODUTOS).filter(p => p.estoque > 0).length + '\n' +
    'Vendas realizadas: ' + totalVendas + '\n\n' +
    'Canal: youtube.com/@fael_100k_yt\n\n' +
    'Obrigado pela confianca e referencias!'
  );
});

bot.onText(/Suporte/, async (msg) => {
  await bot.sendMessage(msg.chat.id,
    'SUPORTE\n\n' +
    'Canal YouTube: youtube.com/@fael_100k_yt\n' +
    'WhatsApp: 555193767174\n\n' +
    'Atendimento rapido e seguro!'
  );
});

// ========== INICIAR SERVIDOR ==========
app.listen(PORT, async () => {
  console.log('Servidor rodando na porta', PORT);
  await bot.setWebHook(`${RENDER_URL}${WEBHOOK_PATH}`);
  console.log('Webhook Telegram:', RENDER_URL + WEBHOOK_PATH);
  console.log('Webhook Mercado Pago:', RENDER_URL + '/mercado-pago-webhook');
  console.log('Sistema de sensibilidade aleatoria ativado!');
  console.log('SENS7X MAX — Online!');
});