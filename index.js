import pkg from '@adiwajshing/baileys';
import P from 'pino';
import fs from 'fs';

const { default: makeWASocket, DisconnectReason, useSingleFileAuthState } = pkg;

// Caminho do arquivo de autenticação
const authFile = './auth_info.json';

// Cria/usa o estado de autenticação
const { state, saveState } = useSingleFileAuthState(authFile);

let sock;

async function startBot() {
    sock = makeWASocket({
        auth: state,
        printQRInTerminal: true,
        logger: P({ level: 'silent' })
    });

    // Evento de atualização de conexão
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) console.log('📸 Escaneie o QR Code acima no terminal!');
        if (connection === 'close') {
            console.log('❌ Desconectado:', lastDisconnect?.error?.output?.statusCode || lastDisconnect?.error);
            console.log('🔄 Tentando reconectar em 5s...');
            setTimeout(startBot, 5000);
        } else if (connection === 'open') {
            console.log('✅ Conectado ao WhatsApp!');
        }
    });

    // Atualiza estado de autenticação
    sock.ev.on('creds.update', saveState);

    // Recebimento de mensagens
    sock.ev.on('messages.upsert', async (m) => {
        const msg = m.messages[0];
        if (!msg.message) return;

        const from = msg.key.remoteJid;
        const text = msg.message.conversation || msg.message.extendedTextMessage?.text;

        console.log('📩 Mensagem de', from, ':', text);

        // Resposta automática simples
        if (text?.toLowerCase().includes('oi')) {
            await sock.sendMessage(from, { text: 'Olá! Recebi sua mensagem 😄' });
        }
    });

    console.log('🤖 Bot iniciado. Escaneie o QR Code no terminal se necessário.');
}

// Verifica se o arquivo de autenticação existe, se não cria vazio
if (!fs.existsSync(authFile)) fs.writeFileSync(authFile, JSON.stringify({}));

startBot();
