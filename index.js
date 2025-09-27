import express from 'express';
import { create } from 'venom-bot';

const app = express();
const port = process.env.PORT || 3000;

let client;

// Cria a sessão do WhatsApp
create('evolution-session')
  .then((c) => {
    client = c;
    console.log('WhatsApp conectado!');
  })
  .catch((err) => console.log(err));

// Endpoint para mostrar QR Code
app.get('/qr', async (req, res) => {
  if (!client) return res.send('Aguardando conexão do WhatsApp...');
  const qr = await client.getQRCode(); // retorna o QR Code
  res.send(`<img src="${qr}" />`);
});

// Servidor rodando
app.listen(port, () => {
  console.log(`Servidor Evolution rodando na porta ${port}`);
});
