import express from 'express';
import BaileysPkg from '@adiwajshing/baileys';
import fs from 'fs';
import path from 'path';

const {
  default: makeWASocket,
  useSingleFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeInMemoryStore
} = BaileysPkg;

const __dirname = path.resolve();

const app = express();
const port = process.env.PORT || 3000;

// Pasta para salvar o estado de autenticação
const authFile = path.join(__dirname, 'auth_info.json');
const { state, saveState } = useSingleFileAuthState(authFile);

let sock;

// Função para inicializar o WhatsApp
async function startWhatsApp() {
  const { version } = await fetchLatestBaileysVersion();

  sock = makeWASocket({
    auth: state,
    version,
    printQRInTerminal: true
  });

  sock.ev.on('creds.update', saveState);

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      console.log('QR Code gerado. Escaneie com o WhatsApp!');
    }

    if (connection === 'close') {
      const reason = lastDisconnect?.error?.output?.statusCode;
      console.log('Conexão fechada, tentando reconectar...', reason);
      startWhatsApp(); // tenta reconectar automaticamente
    }

    if (connection === 'open') {
      console.log('WhatsApp conectado com sucesso!');
    }
  });
}

startWhatsApp().catch(console.error);

// Endpoint para ver status do WhatsApp
app.get('/status', (req, res) => {
  if (!sock) return res.send('Aguardando conexão do WhatsApp...');
  res.send('WhatsApp conectado! ✅');
});

// Servidor rodando
app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});
