// Ponto de entrada do backend: carrega as variáveis de ambiente (.env) ANTES de
// importar o app (o app.ts valida JWT_SECRET na carga) e sobe o servidor HTTP.
import 'dotenv/config';
import { app } from './app.js';

// Porta configurável via env var PORT; padrão 3333 em desenvolvimento.
const port = Number(process.env.PORT) || 3333;

app.listen({ port, host: '0.0.0.0' }, (err, address) => {
  if (err) {
    app.log.error(err);
    process.exit(1);
  }
  console.log(`🚀 Servidor EnterLinhas rodando em ${address}`);
});
