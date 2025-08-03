const express = require('express');
const { Client } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.json());

let client;
let isReady = false;

app.get('/', (req, res) => {
  res.send('🟢 Evolution API online!');
});

app.get('/status', (req, res) => {
  res.json({ whatsapp: isReady ? 'CONNECTED' : 'NOT CONNECTED' });
});

app.get('/start-session', (req, res) => {
  if (client) {
    return res.send('✅ Sessão já iniciada');
  }

  client = new Client({
    puppeteer: {
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    }
  });

  client.on('qr', qr => {
    console.log('🔐 Escaneie o QR Code abaixo:');
    qrcode.generate(qr, { small: true });
  });

  client.on('ready', () => {
    isReady = true;
    console.log('✅ Cliente WhatsApp pronto');
  });

  client.initialize();

  res.send('🟡 Sessão iniciando... veja o QR Code no terminal.');
});

app.post('/send-message', async (req, res) => {
  const { number, text } = req.body;

  if (!isReady) {
    return res.status(400).json({ error: 'Cliente não conectado' });
  }

  try {
    const formattedNumber = number.includes('@c.us') ? number : `${number}@c.us`;
    const msg = await client.sendMessage(formattedNumber, text);
    res.json({ status: 'Mensagem enviada', message: msg });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao enviar mensagem', details: error });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Evolution API rodando na porta ${PORT}`);
});
