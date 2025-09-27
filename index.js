import express from 'express';
import { create } from 'venom-bot';

const app = express();
const port = process.env.PORT || 3000;

let client;
let lastQr = null; // Guarda o último QR Code gerado

// Cria a sessão do WhatsApp
create(
  'evolution-session',
  (base64Qr, asciiQR, attempts, urlCode) => {
    lastQr = base64Qr;
    console.log('QR Code gerado, escaneie no WhatsApp!');
  },
  {
    headless: true,               // Rodar sem interface gráfica
    useChrome: true,              // Usa o Chromium
    browserArgs: ['--no-sandbox', '--disable-setuid-sandbox'],
    logQR: false                  // Evita imprimir QR no terminal
  }
)
  .then((c) => {
    client = c;
    console.log('WhatsApp conectado!');
  })
  .catch((err) => console.log('Erro ao criar sessão:', err));

// Endpoint para mostrar o QR Code
app.get('/qr', (req, res) => {
  if (!lastQr) return res.send('QR Code ainda não gerado...');
  res.send(`<img src="data:image/png;base64,${lastQr}" />`);
});

// Teste simples do servidor
app.get('/', (req, res) =>
