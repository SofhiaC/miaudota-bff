import 'dotenv/config';
import * as amqp from 'amqplib';
import { urlRabbit } from '../shared/config';
import { Eventos } from '../shared/events/eventos';

/**
 * Reenvio manual: devolve para a fila de trabalho as notificações que foram para a fila de descarte
 * (por exemplo, quando o n8n estava fora do ar). Rode depois de resolver o problema:  npm run notificacao:reenviar
 */
async function reenviar() {
  const conexao = await amqp.connect(urlRabbit());
  const canal = await conexao.createChannel();
  let total = 0;

  for (const nome of [Eventos.UsuarioCadastrado, Eventos.SolicitacaoAdocaoCriada, Eventos.FeiraCadastrada]) {
    const fila = `notificacao.${nome}`;
    const descarte = `${fila}.dlq`;
    await canal.assertQueue(descarte, { durable: true });

    let msg = await canal.get(descarte, { noAck: false });
    while (msg) {
      canal.sendToQueue(fila, msg.content, { persistent: true, contentType: 'application/json' });
      canal.ack(msg);
      total += 1;
      msg = await canal.get(descarte, { noAck: false });
    }
  }

  await canal.close();
  await conexao.close();
  console.log(total ? `${total} mensagem(ns) devolvida(s) para reprocessamento.` : 'Nenhuma mensagem na fila de descarte.');
}

reenviar().catch((e) => {
  console.error('Falha ao reenviar:', e.message);
  process.exit(1);
});
