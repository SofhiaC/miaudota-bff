import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { FiltroDeExcecoes } from './filtro-excecoes';

/** Sobe um dos processos do sistema (cada serviço, o BFF e o gateway usam o mesmo roteiro). */
export async function iniciarServico(modulo: any, nome: string, porta: number, opcoes: { cors?: boolean; swagger?: { titulo: string; descricao: string; ajustar?: (documento: any) => void } } = {}) {
  const app = await NestFactory.create(modulo);
  if (opcoes.cors) app.enableCors();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // descarta campos que não estão no DTO
      forbidNonWhitelisted: true, // e rejeita a requisição se vierem campos extras
      transform: true,
      errorHttpStatusCode: 422,
    }),
  );
  app.useGlobalFilters(new FiltroDeExcecoes());
  if (opcoes.swagger) {
    // documentação interativa em /docs (e o JSON em /docs-json); os cabeçalhos entram pelo botão "Authorize"
    const config = new DocumentBuilder()
      .setTitle(opcoes.swagger.titulo)
      .setDescription(opcoes.swagger.descricao)
      .setVersion('1.0')
      .addApiKey({ type: 'apiKey', name: 'x-internal-key', in: 'header' }, 'chave-interna')
      .addApiKey({ type: 'apiKey', name: 'x-usuario-id', in: 'header' }, 'usuario-id')
      .addApiKey({ type: 'apiKey', name: 'x-usuario-tipo', in: 'header', description: 'PESSOA ou ONG' }, 'usuario-tipo')
      .build();
    const documento = SwaggerModule.createDocument(app, config);
    opcoes.swagger.ajustar?.(documento); // permite acrescentar rotas que não são controllers Nest (ex.: as encaminhadas pelo BFF)
    SwaggerModule.setup('docs', app, documento);
  }
  app.enableShutdownHooks();
  await app.listen(porta);
  new Logger(nome).log(`"${nome}" no ar em http://localhost:${porta}`);
}
