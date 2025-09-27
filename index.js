// index.js
import makeWASocket from '@adiwajshing/baileys';
import useSingleFileAuthState from './useSingleFileAuthState.js'; // função que criamos
import P from 'pino';

const authFile = './auth_info.json';
const { state, saveState } = useSingleFileAuthState(authFile);

// Cria o socket
const sock = makeWASocket({
    auth: state,
    printQRInTerminal: true,
    logger: P({ level: 'silent' }) // reduz logs
});

// Evento de atualização da conexão
sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect } = update;

    if (connection === 'close') {
        console.log('❌ Desconectado, motivo:', lastDisconnect?.error?.output?.statusCode);
    } else if (connection === 'open') {
        console.log('✅ Conectado ao WhatsApp!');
    }
});

// Evento para salvar credenciais
sock.ev.on('creds.update', saveState);

// Evento para mensagens recebidas (exemplo)
sock.ev.on('messages.upsert', async (m) => {
    console.log('📩 Nova mensagem:', JSON.stringify(m, null, 2));

    // Exemplo de resposta automática
    if (m.messages[0].message?.conversation) {
        const msg = m.messages[0];
        const from = msg.key.remoteJid;
        await sock.sendMessage(from, { text: 'Olá! Recebi sua mensagem 😄' });
    }
});

console.log('🤖 Bot iniciado. Escaneie o QR Code no terminal.');
