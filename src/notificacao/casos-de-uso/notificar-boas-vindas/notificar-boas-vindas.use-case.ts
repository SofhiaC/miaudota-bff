import { Injectable } from '@nestjs/common';
import { UsuarioCadastradoDados } from '../../../shared/events/eventos';
import { EnviadorDeEmail } from '../../application/enviador-de-email';
import { boasVindas } from '../../domain/mensagens';

@Injectable()
export class NotificarBoasVindas {
  constructor(private email: EnviadorDeEmail) {}

  executar(dados: UsuarioCadastradoDados) {
    return this.email.enviar(boasVindas(dados));
  }
}
