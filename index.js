// index.js (Baileys - leve, sem navegador)
import express from 'express';
import fs from 'fs';
import path from 'path';
import { Boom } from '@hapi/boom';
import makeWASocket, {
  DisconnectReason,
  useSingleFileAuthState,
  fetchLatestBaileysVersion,
  makeInMemoryStore
} from '@adiwajshing/baileys';

const app = express();
const port = process.env.PORT || 3000;

const AUTH_FILE = './auth_info.json';

// usa arquivo único para salvar sessão
const { state, saveState } = useSingleFileAuthState(AUTH_FILE);

// opcional: in-memory store para mensagens/metadados
const store = makeInMemoryStore({});

// função para iniciar socket
async function startSocket() {
  const { version, isLatest } = await fetchLatestBaileysVersion();
  console.log('Baileys version', version.join('.'), 'isLatest:', isLatest);

  const sock = makeWASocket({
    version,
    printQRInTerminal: false,
    auth: state,
    // logger: P({ level: 'silent' }) // se quiser logs menores
  });

  // salva credenciais quando mudam
  sock.ev.on('creds.update', saveState);
  // guarda no store
  store.bind(sock.ev);

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update;
    if (qr) {
      // guarda QR para exibir via endpoint /qr
      lastQrBase64 = qr;
      console.log('QR recebido (base64) — abra /qr para ver');
    }
    if (connection === 'close') {
      const reason = new Boom((lastDisconnect?.error) || 'unknown');
      console.log('Connection closed, reason:', reason.output?.payload || lastDisconnect);
      // tentar reconectar automaticamente
      if ((lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut) {
        console.log('Tentando reconectar em 3s...');
        setTimeout(() => startSocket(), 3000);
      } else {
        console.log('Sessão desconectada (logged out). Apague auth_info.json e gere novo QR.');
      }
    } else if (connection === 'open') {
      console.log('Conectado ao WhatsApp com sucesso!');
    }
  });

  // eventos de mensagens (apenas exemplo)
  sock.ev.on('messages.upsert', (m) => {
    // aqui você pode processar mensagens recebidas
    // console.log('mensagens:', m);
  });

  return sock;
}

let lastQrBase64 = null;
let sockPromise = startSocket();

// endpoint para retornar o QR (se for necessário)
app.get('/qr', (req, res) => {
  if (!lastQrBase64) return res.send('QR ainda não recebido — aguarde alguns segundos e atualize.');
  // Baileys envia QR como string normal (data para QR generator) — precisamos gerar imagem:
  // lastQrBase64 pode ser o string QR (raw), então transformaremos para PNG usando api de third-party não necessário.
  // Baileys fornece QR em plain text; aqui vamos mostrar como imagem via google chart (qrcode)
  const qrText = lastQrBase64;
  const encoded = encodeURIComponent(qrText);
  const imgUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encoded}`;
  return res.send(`<img src="${imgUrl}" /><p>Escaneie com WhatsApp (Aparelhos conectados → Conectar dispositivo)</p>`);
});

app.get('/', (req, res) => res.send('Baileys server rodando'));

app.listen(port, () => {
  console.log(`Servidor (Baileys) rodando na porta ${port}`);
});
