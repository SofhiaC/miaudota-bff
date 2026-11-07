import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import * as amqp from 'amqplib';
import { randomUUID } from 'crypto';
import { urlRabbit } from '../config';
import { EventPublisher, EventSubscriber, ManipuladorDeEvento, NomeEvento } from './eventos';

export const NOME_SERVICO = 'NOME_SERVICO';

const EXCHANGE = 'miaudota.eventos'; // tópico: a chave de roteamento é o nome do evento
const DESCARTE = 'miaudota.eventos.descarte'; // para onde vão as mensagens que o consumidor não conseguiu tratar
const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Adaptador RabbitMQ das portas EventPublisher/EventSubscriber.
 * - Cada serviço tem uma fila durável por evento que assina ("<servico>.<Evento>"), então vários serviços recebem o mesmo evento.
 * - Mensagem que falha vai para a fila de descarte ("<servico>.<Evento>.dlq") em vez de se perder ou travar a fila.
 * - Se o RabbitMQ estiver fora do ar, eventos ficam guardados em memória e saem quando ele voltar.
 */
@Injectable()
export class RabbitMqEventBus implements EventPublisher, EventSubscriber, OnModuleInit, OnModuleDestroy {
  private logger = new Logger('Eventos');
  private conexao: any;
  private canal: any;
  private encerrando = false;
  private pendentes: { nome: NomeEvento; dados: Record<string, unknown> }[] = [];
  private inscricoes: { nome: NomeEvento; manipulador: ManipuladorDeEvento }[] = [];
  private ativas = new Set<ManipuladorDeEvento>();

  constructor(@Inject(NOME_SERVICO) private servico: string) {}

  onModuleInit() {
    void this.conectar();
  }

  async onModuleDestroy() {
    this.encerrando = true;
    try {
      await this.canal?.close();
      await this.conexao?.close();
    } catch {}
  }

  private async conectar() {
    while (!this.encerrando) {
      let conexao: any;
      try {
        conexao = await amqp.connect(urlRabbit());
        conexao.on('error', (e: Error) => this.logger.warn(`RabbitMQ: ${e.message}`));
        conexao.on('close', () => {
          this.canal = undefined;
          this.ativas.clear();
          if (!this.encerrando) {
            this.logger.warn('Conexão com o RabbitMQ fechada; reconectando');
            void this.conectar();
          }
        });
        const canal = await conexao.createChannel();
        await canal.assertExchange(EXCHANGE, 'topic', { durable: true });
        await canal.assertExchange(DESCARTE, 'direct', { durable: true });
        await canal.prefetch(10);
        this.conexao = conexao;
        this.canal = canal;

        for (const i of this.inscricoes) await this.consumir(i.nome, i.manipulador);
        for (const p of this.pendentes.splice(0)) this.enviar(p.nome, p.dados);
        this.logger.log(`Conectado ao RabbitMQ (${this.servico})`);
        return;
      } catch (e: any) {
        this.canal = undefined;
        if (conexao) {
          conexao.removeAllListeners('close');
          await conexao.close().catch(() => undefined);
        }
        this.logger.warn(`RabbitMQ indisponível (${e?.message}); nova tentativa em 3s`);
        await esperar(3000);
      }
    }
  }

  inscrever(nome: NomeEvento, manipulador: ManipuladorDeEvento) {
    this.inscricoes.push({ nome, manipulador });
    if (this.canal) {
      this.consumir(nome, manipulador).catch((e) => this.logger.error(`Falha ao assinar ${nome}: ${e?.message}`));
    }
  }

  private async consumir(nome: NomeEvento, manipulador: ManipuladorDeEvento) {
    if (this.ativas.has(manipulador)) return;
    this.ativas.add(manipulador);

    const canal = this.canal;
    const fila = `${this.servico}.${nome}`;
    await canal.assertQueue(`${fila}.dlq`, { durable: true });
    await canal.bindQueue(`${fila}.dlq`, DESCARTE, fila);
    await canal.assertQueue(fila, {
      durable: true,
      arguments: { 'x-dead-letter-exchange': DESCARTE, 'x-dead-letter-routing-key': fila },
    });
    await canal.bindQueue(fila, EXCHANGE, nome);

    await canal.consume(fila, async (msg: any) => {
      if (!msg) return;
      try {
        const evento = JSON.parse(msg.content.toString());
        await manipulador(evento.dados);
        canal.ack(msg);
      } catch (e: any) {
        this.logger.error(`Falha ao tratar ${nome}: ${e?.message}; mensagem enviada para ${fila}.dlq`);
        canal.nack(msg, false, false); // sem reenfileirar: cai na fila de descarte
      }
    });
  }

  private enviar(nome: NomeEvento, dados: Record<string, unknown>) {
    const evento = { id: randomUUID(), nome, ocorridoEm: new Date().toISOString(), dados };
    this.canal.publish(EXCHANGE, nome, Buffer.from(JSON.stringify(evento)), {
      persistent: true,
      contentType: 'application/json',
    });
  }

  async publicar(nome: NomeEvento, dados: Record<string, unknown>) {
    this.logger.log(`Evento publicado: ${nome}`); // só o nome: dados pessoais não vão para o log
    if (!this.canal) {
      this.pendentes.push({ nome, dados });
      return;
    }
    try {
      this.enviar(nome, dados);
    } catch (e: any) {
      this.logger.error(`Não foi possível publicar ${nome}: ${e?.message}; será reenviado ao reconectar`);
      this.pendentes.push({ nome, dados });
    }
  }
}
