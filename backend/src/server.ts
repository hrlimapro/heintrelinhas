import 'dotenv/config';
import { app } from './app.js';

const port = Number(process.env.PORT) || 3333;

app.listen({ port, host: '0.0.0.0' }, (err, address) => {
  if (err) {
    app.log.error(err);
    process.exit(1);
  }
  console.log(`🚀 Servidor Antigravity Literário rodando em ${address}`);
});
