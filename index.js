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
const DEPOIMENTOS_ARQUIVO = `${PASTA_BASE}depoimentos.json`;
const ATENDIMENTOS_ARQUIVO = `${PASTA_BASE}atendimentos.json`;

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
    valor: 2.79,
    estoque: 500,
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
  "nubank-editavel": {
    id: "nubank-editavel",
    nome: "NUBANK ENTRETENIMENTO",
    valor: 11.99,
    estoque: 500,
    categoria: "aplicativos",
    descricao: "AVISO IMPORTANTE: Apenas para entretenimento. Nao tem valor real. Uso por conta e risco.\n\n" +
                "Venha adquirir o melhor aplicativo completo para entretenimento\n\n" +
                "Simulador de transferencias, comprovantes, editar perfil e muito mais\n" +
                "Compartilhe com seus amigos e divirta-se!\n" +
                "Edite dados como quiser — apenas para fins de brincadeira\n" +
                "Suporte direto no WhatsApp\n\n" +
                "Para entretenimento e brincadeira!\n\n" +
                "Canal oficial: https://youtube.com/@fael_100k_yt?si=Kb48mzTeHsbmRhk7",
    imagemUrl: "https://i.postimg.cc/nzkvYxVt/NUBANK.png",
    linkEntrega: "https://www.mediafire.com/file/06tr2nywlodysjb/NUBANK_EDIT_C3%81VEL_CLIENTE_%C2%AEFAEL_VENDAS_OFICIAL.7z/file"
  },
  "inter-editavel": {
    id: "inter-editavel",
    nome: "INTER ENTRETENIMENTO",
    valor: 11.99,
    estoque: 80,
    categoria: "aplicativos",
    descricao: "AVISO IMPORTANTE: Apenas para entretenimento. Nao tem valor real. Uso por conta e risco.\n\n" +
                "VENHA ADQUIRIR O MELHOR APLICATIVO EDITAVEL COMPLETO\n\n" +
                "Simulador completo 100% editavel\n" +
                "Edite saldo, foto de perfil, nome, comprovantes e muito mais\n" +
                "Edite dados do destinatario\n" +
                "Aplicativo seguro, rapido e confiavel\n\n" +
                "Nao fique pra tras, garanta ja o seu!\n\n" +
                "Canal oficial: https://youtube.com/@fael_100k_yt?si=Kb48mzTeHsbmRhk7",
    imagemUrl: "https://i.postimg.cc/0Q7zZY6r/download-(1).png",
    linkEntrega: "https://www.mediafire.com/file/uf1nhkkev88v380/INTER_EDIT_C3%81VEL_CLIENTE_%C2%AEFAEL_VENDAS_OFICIAL.7z/file"
  },
  "likes100-id": {
    id: "likes-id",
    nome: "LIKES ID 100",
    valor: 8.00,
    estoque: 500,
    categoria: "likes",
    descricao: "AVISO Importante\n\n" +
                "venha solicitar seus likes rápido e seguro\n\n" +
                "efetue pagamento\n" +
                "compartilhe comprovante\n" +
                "entre em contato com vendedor\n" +
                "logo em seguida envie seu ID\n\n" +
                "entregas imediato após pagamento confirmado\n\n" +
                "Canal oficial: https://youtube.com/@fael_100k_yt?si=Kb48mzTeHsbmRhk7",
    imagemUrl: "https://i.postimg.cc/HkmDGHwd/IMG-20261015-WA0012.jpg",
    linkEntrega: "https://wa.me/5571992297916"
  },
  "likes200-id": {
    id: "likes200-id",
    nome: "LIKES ID 200",
    valor: 10.00,
    estoque: 500,
    categoria: "likes",
    descricao: "AVISO IMPORTANTE\n\n" +
                "venha solicitar seus likes rápido e seguro\n\n" +
                "efetue pagamento\n" +
                "compartilhe comprovante\n" +
                "entre em contato com vendedor\n" +
                "logo em seguida envie seu ID\n\n" +
                "entregas imediato após pagamento confirmado\n\n" +
                "Canal oficial: https://youtube.com/@fael_100k_yt?si=Kb48mzTeHsbmRhk7",
    imagemUrl: "https://i.postimg.cc/HkmDGHwd/IMG-20261015-WA0012.jpg",
    linkEntrega: "https://wa.me/5571992297916"
  },
  "likes300-id": {
    id: "likes300-id",
    nome: "LIKES ID 300",
    valor: 15.00,
    estoque: 500,
    categoria: "likes",
    descricao: "AVISO IMPORTANTE\n\n" +
                "venha solicitar seus likes rápido e seguro\n\n" +
                "efetue pagamento\n" +
                "compartilhe comprovante\n" +
                "entre em contato com vendedor\n" +
                "logo em seguida envie seu ID\n\n" +
                "entregas imediato após pagamento confirmado\n\n" +
                "Canal oficial: https://youtube.com/@fael_100k_yt?si=Kb48mzTeHsbmRhk7",
    imagemUrl: "https://i.postimg.cc/HkmDGHwd/IMG-20261015-WA0012.jpg",
    linkEntrega: "https://wa.me/5571992297916"
  },
  likes400-id": {
    id: "likes400-id",
    nome: "LIKES ID 400",
    valor: 20.00,
    estoque: 500,
    categoria: "likes",
    descricao: "AVISO IMPORTANTE"\n\n" +
                "venha solicitar seus likes rápido e seguro\n\n" +
                "efetue pagamento\n" +
                "compartilhe comprovante\n" +
                "entre em contato com vendedor\n" +
                "logo em seguida envie seu ID\n\n" +
                "entregas imediato após pagamento confirmado\n\n" +
                "Canal oficial: https://youtube.com/@fael_100k_yt?si=Kb48mzTeHsbmRhk7",
    imagemUrl: "https://i.postimg.cc/HkmDGHwd/IMG-20261015-WA0012.jpg",
    linkEntrega: "https://wa.me/5571992297916"
  },
  likes500-id": {
    id: "likes500-id",
    nome: "LIKES ID 500",
    valor: 30.00,
    estoque: 500,
    categoria: "likes",
    descricao: "AVISO IMPORTANTE"\n\n" +
                "VENHA ADQUIRIR O MELHOR APLICATIVO EDITAVEL COMPLETO\n\n" +
                "venha solicitar seus likes rápido e seguro\n\n" +
                "efetue pagamento\n" +
                "compartilhe comprovante\n" +
                "entre em contato com vendedor\n" +
                "logo em seguida envie seu ID\n\n" +
                "entregas imediato após pagamento confirmado\n\n" +
                "Canal oficial: https://youtube.com/@fael_100k_yt?si=Kb48mzTeHsbmRhk7",
    imagemUrl: "https://i.postimg.cc/HkmDGHwd/IMG-20261015-WA0012.jpg",
    linkEntrega: "https://wa.me/5571992297916"
  },
  likes600-id": {
    id: "likes600-id",
    nome: "LIKES ID 600",
    valor: 40.00,
    estoque: 500,
    categoria: "likes",
    descricao: "AVISO IMPORTANTE" +
                "VENHA ADQUIRIR O MELHOR APLICATIVO EDITAVEL COMPLETO\n\n" +
                "venha solicitar seus likes rápido e seguro\n\n" +
                "efetue pagamento\n" +
                "compartilhe comprovante\n" +
                "entre em contato com vendedor\n" +
                "logo em seguida envie seu ID\n\n" +
                "entregas imediato após pagamento confirmado\n\n" +
                "Canal oficial: https://youtube.com/@fael_100k_yt?si=Kb48mzTeHsbmRhk7",
    imagemUrl: "https://i.postimg.cc/HkmDGHwd/IMG-20261015-WA0012.jpg",
    linkEntrega: "https://wa.me/5571992297916"
  },
  likes700-id": {
    id: "likes700-id",
    nome: "LIKES ID 700",
    valor: 50.00,
    estoque: 500,
    categoria: "likes",
    descricao: "AVISO IMPORTANTE"\n\n" +
                "VENHA ADQUIRIR O MELHOR APLICATIVO EDITAVEL COMPLETO\n\n" +
                "venha solicitar seus likes rápido e seguro\n\n" +
                "efetue pagamento\n" +
                "compartilhe comprovante\n" +
                "entre em contato com vendedor\n" +
                "logo em seguida envie seu ID\n\n" +
                "entregas imediato após pagamento confirmado\n\n" +
                "Canal oficial: https://youtube.com/@fael_100k_yt?si=Kb48mzTeHsbmRhk7",
    imagemUrl: "https://i.postimg.cc/HkmDGHwd/IMG-20261015-WA0012.jpg",
    linkEntrega: "https://wa.me/5571992297916"
  },
  likes800-id": {
    id: "likes800-id",
    nome: "LIKES ID 800",
    valor: 60.00,
    estoque: 500,
    categoria: "likes",
    descricao: "AVISO IMPORTANTE" +
                "VENHA ADQUIRIR O MELHOR APLICATIVO EDITAVEL COMPLETO\n\n" +
                "venha solicitar seus likes rápido e seguro\n\n" +
                "efetue pagamento\n" +
                "compartilhe comprovante\n" +
                "entre em contato com vendedor\n" +
                "logo em seguida envie seu ID\n\n" +
                "entregas imediato após pagamento confirmado\n\n" +
                "Canal oficial: https://youtube.com/@fael_100k_yt?si=Kb48mzTeHsbmRhk7",
    imagemUrl: "https://i.postimg.cc/HkmDGHwd/IMG-20261015-WA0012.jpg",
    linkEntrega: "https://wa.me/5571992297916"
  },
  likes900-id": {
    id: "likes900-id",
    nome: "LIKES ID 900",
    valor: 70.00,
    estoque: 500,
    categoria: "likes",
    descricao: "AVISO IMPORTANTE"\n\n" +
                "VENHA ADQUIRIR O MELHOR APLICATIVO EDITAVEL COMPLETO\n\n" +
                "venha solicitar seus likes rápido e seguro\n\n" +
                "efetue pagamento\n" +
                "compartilhe comprovante\n" +
                "entre em contato com vendedor\n" +
                "logo em seguida envie seu ID\n\n" +
                "entregas imediato após pagamento confirmado\n\n" +
                "Canal oficial: https://youtube.com/@fael_100k_yt?si=Kb48mzTeHsbmRhk7",
    imagemUrl: "https://i.postimg.cc/HkmDGHwd/IMG-20261015-WA0012.jpg",
    linkEntrega: "https://wa.me/5571992297916"
  },
  likes1000-id": {
    id: "likes1000-id",
    nome: "LIKES ID 1000",
    valor: 90.00,
    estoque: 500,
    categoria: "likes",
    descricao: "AVISO IMPORTANTE"\n\n" +
                "VENHA ADQUIRIR O MELHOR APLICATIVO EDITAVEL COMPLETO\n\n" +
                "venha solicitar seus likes rápido e seguro\n\n" +
                "efetue pagamento\n" +
                "compartilhe comprovante\n" +
                "entre em contato com vendedor\n" +
                "logo em seguida envie seu ID\n\n" +
                "entregas imediato após pagamento confirmado\n\n" +
                "Canal oficial: https://youtube.com/@fael_100k_yt?si=Kb48mzTeHsbmRhk7",
    imagemUrl: "https://i.postimg.cc/HkmDGHwd/IMG-20261015-WA0012.jpg",
    linkEntrega: "https://wa.me/5571992297916"
  }
});

const CATEGORIAS = {
  sensibilidade: {
    nome: "MELHORES PACK SENSIBILIDADE FREE FIRE",
    descricao: "desempenho, resultado e qualidade"
  },
  aplicativos: {
    nome: "APLICATIVOS CLIENTE",
    descricao: "ilimitados"
  },
  likes: {
    nome: "LIKES ID FREE FIRE",
    descricao: "Aplicativos completos e atualizados"
  }
};

// ========== DEPOIMENTOS ==========
let DEPOIMENTOS = lerArquivo(DEPOIMENTOS_ARQUIVO, [
  { nome: "Jogador Anonimo", mensagem: "Melhor investimento que fiz! Minha mira melhorou muito!", nota: 5 },
  { nome: "Cliente Satisfeito", mensagem: "Entrega instantanea e produto excelente!", nota: 5 },
  { nome: "Felipe Gamer", mensagem: "Suporte rapido e confiavel. Recomendo demais!", nota: 5 }
]);

let pedidos = lerArquivo(PEDIDOS_ARQUIVO, {});
let usuariosGerar = lerArquivo(USUARIOS_GERAR_ARQUIVO, {});
let atendimentos = lerArquivo(ATENDIMENTOS_ARQUIVO, {});

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
      ['Categorias', 'Buscar Produto'],
      ['Gerar Sensibilidade'],
      ['Meus Pedidos', 'Reenviar Produto'],
      ['Sobre', 'Suporte', 'Atendimento'],
      ['Inf. Compras', 'Inf. Produto', 'Pagamento'],
      ['Depoimentos', 'Garantia', 'Seguranca'],
      ['Termos', 'Privacidade']
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

// ========== FUNÇÃO: VERIFICAR SE CLIENTE COMPROU O PRODUTO ==========
function clienteJaComprou(chatId, produtoId) {
  return Object.values(pedidos).some(p => 
    p.chatId == chatId && 
    p.produtoId == produtoId && 
    p.entregue === true
  );
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

// ========== BUSCAR PRODUTO ==========
bot.onText(/Buscar Produto|\/buscar (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  let termo = '';
  
  if (match && match[1]) {
    termo = match[1].toLowerCase().trim();
  } else {
    await bot.sendMessage(chatId, 'Digite o nome ou palavra do produto:\n\nExemplo: /buscar sensibilidade');
    return;
  }
  
  const resultados = Object.values(PRODUTOS).filter(p => 
    p.estoque > 0 && (
      p.nome.toLowerCase().includes(termo) ||
      p.descricao.toLowerCase().includes(termo)
    )
  );
  
  if (resultados.length === 0) {
    await bot.sendMessage(chatId, 'Nenhum produto encontrado com esse termo.\n\nTente outra palavra ou veja todas as categorias com: /loja');
    return;
  }
  
  let mensagem = `ENCONTRAMOS ${resultados.length} PRODUTO(S):\n\n`;
  resultados.forEach(prod => {
    mensagem += '──────────────────────\n';
    mensagem += `${prod.nome}\n`;
    mensagem += `Valor: R$ ${prod.valor.toFixed(2)}\n`;
    mensagem += `Comprar: /comprar ${prod.id}\n\n`;
  });
  
  await bot.sendMessage(chatId, mensagem);
});

// ========== REENVIAR PRODUTO ==========
bot.onText(/Reenviar Produto|\/reenviar/, async (msg) => {
  const chatId = msg.chat.id;
  
  const meusPedidos = Object.entries(pedidos)
    .filter(([id, p]) => p.chatId == chatId && p.entregue === true && p.produtoId)
    .slice(-5);
  
  if (meusPedidos.length === 0) {
    await bot.sendMessage(chatId, 
      'Voce ainda nao tem compras confirmadas para reenviar.\n\n' +
      'Compre primeiro e depois volte aqui! Se acabou de pagar, aguarde um instante e o produto chegara automaticamente.'
    );
    return;
  }
  
  let mensagem = 'SEUS ULTIMOS PRODUTOS:\n\n';
  meusPedidos.forEach(([id, pedido]) => {
    mensagem += `${pedido.produtoNome}\n`;
    mensagem += `/reenviar_${id}\n\n`;
  });
  mensagem += 'Clique no comando do produto que deseja receber novamente!';
  
  await bot.sendMessage(chatId, mensagem);
});

bot.onText(/\/reenviar_(.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const pedidoId = match[1].trim();
  const pedido = pedidos[pedidoId];
  
  if (!pedido || pedido.chatId != chatId) {
    await bot.sendMessage(chatId, 
      'ERRO: Pedido nao encontrado ou nao pertence a voce.\n\n' +
      'Apenas quem comprou pode receber o produto. Se voce acabou de pagar, aguarde a confirmacao do pagamento e ele vira automaticamente!'
    );
    return;
  }
  
  if (!pedido.entregue) {
    await bot.sendMessage(chatId, 'Pagamento ainda nao confirmado. Aguarde um instante e tente novamente mais tarde.');
    return;
  }
  
  await bot.sendMessage(chatId,
    'Aqui esta seu produto novamente:\n\n' +
    pedido.linkEntrega + '\n\n' +
    'Aproveite! Se precisar de mais alguma coisa, e so chamar!'
  );
  
  if (ADMIN_CHAT_ID) {
    await bot.sendMessage(ADMIN_CHAT_ID,
      `REENVIADO:\n${pedido.produtoNome}\nCliente: ${chatId}`
    );
  }
});

// ========== MEUS PEDIDOS ==========
bot.onText(/Meus Pedidos|\/meuspedidos/, async (msg) => {
  const chatId = msg.chat.id;
  
  const minhasCompras = Object.entries(pedidos)
    .filter(([id, p]) => p.chatId == chatId && p.entregue === true)
    .sort((a, b) => b[0].localeCompare(a[0]));
  
  if (minhasCompras.length === 0) {
    await bot.sendMessage(chatId, 'Voce ainda nao tem compras registradas.\n\nFaca sua primeira compra e ela aparecera aqui!');
    return;
  }
  
  let mensagem = `SUAS COMPRAS (${minhasCompras.length}):\n\n`;
  minhasCompras.forEach(([id, pedido], index) => {
    mensagem += `${index + 1}. ${pedido.produtoNome}\n`;
    mensagem += `Status: Entregue ✅\n\n`;
  });
  mensagem += 'Use /reenviar para receber qualquer produto novamente!';
  
  await bot.sendMessage(chatId, mensagem);
});

// ========== DEPOIMENTOS ==========
bot.onText(/Depoimentos|\/depoimentos/, async (msg) => {
  let texto = 'DEPOIMENTOS DE CLIENTES:\n\n';
  DEPOIMENTOS.forEach(dep => {
    const estrelas = '⭐'.repeat(dep.nota);
    texto += `${dep.nome} — ${estrelas}\n"${dep.mensagem}"\n\n`;
  });
  texto += 'Voce tambem pode deixar seu depoimento com o atendimento! Obrigado por confiar em nos!';
  await bot.sendMessage(msg.chat.id, texto);
});

// ========== GARANTIA ==========
bot.onText(/Garantia|\/garantia/, async (msg) => {
  await bot.sendMessage(msg.chat.id,
    'GARANTIA E SATISFACAO\n\n' +
    'Nossa missao e sua satisfacao!\n\n' +
    'O que oferecemos:\n' +
    '- Entrega automatica apos pagamento confirmado\n' +
    '- Produtos testados e verificados antes da disponibilizacao\n' +
    '- Suporte para duvidas e dificuldades\n' +
    '- Atendimento rapido e respeitoso\n\n' +
    'Importante:\n' +
    '- Produtos digitais nao sao reembolsaveis apos entrega, pois voce recebe o arquivo imediatamente\n' +
    '- Se houver problema com o produto, nos contate que resolvemos!\n' +
    '- Para produtos de entretenimento: funcionamento e uso por conta e risco\n\n' +
    'Duvidas? Use /Atendimento que ajudamos voce!'
  );
});

// ========== SEGURANCA ==========
bot.onText(/Seguranca|\/seguranca/, async (msg) => {
  await bot.sendMessage(msg.chat.id,
    '⚠️ AVISOS DE SEGURANCA\n\n' +
    'COMO SE PROTEGER:\n\n' +
    '✅ Confie apenas neste bot oficial\n' +
    '✅ Nunca compartilhe seus dados pessoais com desconhecidos\n' +
    '✅ Nao clique em links suspeitos\n' +
    '✅ Ninguem da nossa equipe pede sua senha ou dados bancarios\n' +
    '✅ Verifique sempre se esta falando com o bot oficial\n\n' +
    '❌ Cuidado com golpes: alguem se passando por nos nao somos nos!\n' +
    '❌ Nao faca pagamentos fora deste bot oficial\n' +
    '❌ Nao compartilhe seu codigo de verificacao com ninguem\n\n' +
    'Este e nosso unico canal oficial. Qualquer duvida, nos contate!'
  );
});

// ========== TERMOS DE USO ==========
bot.onText(/Termos|\/termos/, async (msg) => {
  await bot.sendMessage(msg.chat.id,
    'TERMOS DE USO\n\n' +
    'Ao utilizar este bot, voce concorda com os seguintes termos:\n\n' +
    '1. Produtos digitais: Arquivos disponibilizados para uso pessoal. Nao revenda, nao distribua sem permissao.\n\n' +
    '2. Produtos de entretenimento: Apenas para fins de brincadeira e diversao. Sem valor real. Uso por conta e risco.\n\n' +
    '3. Pagamentos: Processados pelo Mercado Pago. Ao pagar, voce concorda com as politicas deles.\n\n' +
    '4. Entrega: Automatica apos confirmacao do pagamento. Verifique sua caixa de entrada.\n\n' +
    '5. Disponibilidade: Produtos sujeitos a estoque limitado.\n\n' +
    '6. Alterações: Reservamos o direito de alterar produtos e valores sem aviso previo.\n\n' +
    '7. Suporte: Disponivel pelos canais informados neste bot.\n\n' +
    'Ultima atualizacao: Outubro de 2026'
  );
});

// ========== POLITICA DE PRIVACIDADE ==========
bot.onText(/Privacidade|\/privacidade/, async (msg) => {
  await bot.sendMessage(msg.chat.id,
    '🔒 POLITICA DE PRIVACIDADE\n\n' +
    'Nos respeitamos sua privacidade e protegemos seus dados:\n\n' +
    'Quais dados coletamos:\n' +
    '- Apenas ID de chat do Telegram para processar seus pedidos\n' +
    '- Informacoes de compra para entrega do produto\n' +
    '- Nao acessamos suas mensagens pessoais\n\n' +
    'Como usamos seus dados:\n' +
    '- Apenas para processar e entregar suas compras\n' +
    '- Manter historico de seus pedidos para reenvio\n' +
    '- Nao vendemos, nao compartilhamos seus dados com terceiros\n' +
    '- Dados de pagamento sao processados diretamente pelo Mercado Pago\n\n' +
    'Armazenamento:\n' +
    '- Dados protegidos e armazenados de forma segura\n' +
    '- Se desejar excluir seus dados, contate-nos pelo suporte\n\n' +
    'Duvidas sobre privacidade? /Atendimento'
  );
});

// ========== ATENDIMENTO HUMANO ==========
bot.onText(/Atendimento|\/atendimento/, async (msg) => {
  const chatId = msg.chat.id;
  
  await bot.sendMessage(chatId,
    '📞 ATENDIMENTO HUMANO\n\n' +
    'Precisa de ajuda personalizada?\n\n' +
    'Nos contate diretamente:\n\n' +
    'WhatsApp: +555193767174\n' +
    'Canal YouTube: youtube.com/@fael_100k_yt\n\n' +
    'Horario de atendimento:\n' +
    'Segunda a Sabado — Horario comercial\n' +
    'Tentamos responder o mais rapido possivel!\n\n' +
    'Obrigado pela paciencia e confianca!'
  );
  
  if (ADMIN_CHAT_ID) {
    await bot.sendMessage(ADMIN_CHAT_ID,
      '📞 SOLICITACAO DE ATENDIMENTO\n' +
      `Cliente ID: ${chatId}\n` +
      'Aguardando atendimento!'
    );
  }
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
        transaction_amount: 1.00,
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
        'Valor: R$ 1,00\n\n' +
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
              'Escolha uma categoria acima para ver os produtos disponiveis!\n' +
              'Ou pesquise diretamente com: /buscar nome-do-produto';
  
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
    await bot.sendMessage(chatId, 'Produto nao encontrado!\n\nDigite /loja para ver as categorias ou use /buscar para pesquisar.');
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
        'Apos pagar, aguarde — envio automatico!\n' +
        'Se nao receber em 10 minutos, use /reenviar'
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
    'Nao recebi? Use /reenviar ou nos contate pelo /Atendimento'
  );
});

bot.onText(/\/InfProduto|Inf\. Produto/, async (msg) => {
  await bot.sendMessage(msg.chat.id,
    'SOBRE OS PRODUTOS:\n\n' +
    'Funciona no Android\n' +
    'Nao funciona no emulador\n' +
    'Sem risco de banimento\n' +
    'Canal: youtube.com/@fael_100k_yt\n\n' +
    'Duvidas? /Atendimento'
  );
});

bot.onText(/\/pay|Pagamento/, async (msg) => {
  await bot.sendMessage(msg.chat.id,
    'SOBRE O PAGAMENTO:\n\n' +
    'Aceitamos Pix\n' +
    'Processado pelo Mercado Pago\n' +
    'Entrega automatica apos confirmacao\n\n' +
    'Nao recebeu automaticamente? Use /reenviar'
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
    'WhatsApp: +555193767174\n\n' +
    'Ou clique em /Atendimento para solicitar ajuda personalizada!\n\n' +
    'Atendimento rapido e seguro!'
  );
});

// ========== INICIAR SERVIDOR ==========
app.listen(PORT, async () => {
  console.log('Servidor rodando na porta', PORT);
  await bot.setWebHook(`${RENDER_URL}${WEBHOOK_PATH}`);
  console.log('Webhook Telegram:', RENDER_URL + WEBHOOK_PATH);
  console.log('Webhook Mercado Pago:', RENDER_URL + '/mercado-pago-webhook');
  console.log('Sistema de busca ativado!');
  console.log('Sistema de reenvio com verificacao de compra ativado!');
  console.log('Depoimentos, Garantia, Seguranca, Termos, Privacidade e Atendimento ativados!');
  console.log('SENS7X MAX — Online!');
});