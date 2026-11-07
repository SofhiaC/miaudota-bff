import { Controller, Get, Req } from '@nestjs/common';
import { ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { Public } from '../../shared/auth/auth';
import { NaoAutenticadoError } from '../../shared/errors';
import { AgregarDados } from './agregar-dados.use-case';

@ApiTags('agregação')
@ApiSecurity('chave-interna')
@ApiSecurity('usuario-id')
@ApiSecurity('usuario-tipo')
@Public() // quem identifica o usuário é o gateway (JWT); aqui só exigimos a chave interna
@Controller()
export class AgregarDadosController {
  constructor(private caso: AgregarDados) {}

  @ApiOperation({
    summary: 'Agrega animais (MongoDB), feiras (Azure SQL) e o indicador da Azure Function numa única resposta',
  })
  @Get('aggregated-data')
  async agregar(@Req() req: Request) {
    const id = req.headers['x-usuario-id'];
    const tipo = req.headers['x-usuario-tipo'];
    if (typeof id !== 'string' || typeof tipo !== 'string') throw new NaoAutenticadoError('Usuário não identificado');
    return this.caso.executar({ id, tipo });
  }
}
