import http from 'http';

const server = http.createServer((req, res) => {
  res.end('Render rodando!');
});

server.listen(process.env.PORT || 3000, () => {
  console.log('Servidor rodando na porta', process.env.PORT || 3000);
});
