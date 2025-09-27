import pkg from '@adiwajshing/baileys';
import fs from 'fs';
import path from 'path';

const __dirname = path.resolve();

// Pega tudo do pacote
const makeWASocket = pkg.default;
const { useSingleFileAuthState, fetchLatestBaileysVersion, DisconnectReason } = pkg;

// Caminho do arquivo de autenticação
const authFile = path.join(__dirname, 'auth_info.json');
const { state, saveState } = useSingleFileAuthState(authFile);

// Função principal
async function startSock() {
    const { version } = await fetchLatestBaileysVersion();
    
    const sock = makeWASocket({
        auth: state,
        version,
        printQRInTerminal: true,
        browser: ['EvolutionBot','Chrome','1.0.0']
    });

    sock.ev.on('creds.update', saveState);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if(connection === 'close') {
            const statusCode = lastDisconnect?.error?.output?.statusCode;
            console.log('Desconectado, tentando reconectar...', statusCode);
            if(statusCode !== DisconnectReason.loggedOut) startSock();
        } else if(connection === 'open') {
            console.log('✅ Conectado ao WhatsApp!');
        }
    });

    sock.ev.on('messages.upsert', (m) => {
        console.log('Mensagem recebida:', m);
    });
}

startSock();
