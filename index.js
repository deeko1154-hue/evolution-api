// index.js
import pkg from '@adiwajshing/baileys';
import fs from 'fs';
import path from 'path';

const __dirname = path.resolve();

// Pega as funções necessárias do pacote
const {
    default: makeWASocket,
    useSingleFileAuthState,
    fetchLatestBaileysVersion,
    DisconnectReason,
    delay
} = pkg;

// Caminho do arquivo de autenticação
const authFile = path.join(__dirname, 'auth_info.json');
const { state, saveState } = useSingleFileAuthState(authFile);

// Função principal
async function startSock() {
    try {
        const { version } = await fetchLatestBaileysVersion();
        
        const sock = makeWASocket({
            auth: state,
            version,
            printQRInTerminal: true,  // QR aparece no terminal
            browser: ['EvolutionBot','Chrome','1.0.0']
        });

        // Salva a sessão quando houver alteração
        sock.ev.on('creds.update', saveState);

        // Detecta desconexões
        sock.ev.on('connection.update', (update) => {
            const { connection, lastDisconnect } = update;
            if(connection === 'close') {
                const statusCode = lastDisconnect?.error?.output?.statusCode;
                console.log('Desconectado, tentando reconectar...', statusCode);
                // Reconecta automaticamente
                if(statusCode !== DisconnectReason.loggedOut) {
                    startSock();
                }
            } else if(connection === 'open') {
                console.log('✅ Conectado ao WhatsApp!');
            }
        });

        // Evento de mensagens recebidas
        sock.ev.on('messages.upsert', async (m) => {
            console.log('Mensagem recebida:', m);
        });

    } catch (err) {
        console.log('Erro na inicialização:', err);
        setTimeout(startSock, 5000); // tenta reiniciar em 5s
    }
}

// Inicia o socket
startSock();
