import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AuthInternoModule } from '../shared/auth/interno.guard';
import { correlacao } from '../shared/http/correlacao.middleware';
import { AgregarDadosController } from './aggregated-data/agregar-dados.controller';
import { AgregarDados } from './aggregated-data/agregar-dados.use-case';
import { AnimaisFonteHttp } from './aggregated-data/animais.fonte-http';
import { FeirasFonteHttp } from './aggregated-data/feiras.fonte-http';
import { IndicadorFonteAzureFunction } from './aggregated-data/indicador.fonte-azure-function';
import { AnimaisFonte, FeirasFonte, IndicadorFonte } from './aggregated-data/portas';
import { BffController } from './bff.controller';

@Module({
  imports: [AuthInternoModule],
  // ATENÇÃO À ORDEM: a rota específica (/aggregated-data) vem antes do proxy genérico (@All('*'))
  controllers: [AgregarDadosController, BffController],
  providers: [
    AgregarDados,
    { provide: AnimaisFonte, useClass: AnimaisFonteHttp },
    { provide: FeirasFonte, useClass: FeirasFonteHttp },
    { provide: IndicadorFonte, useClass: IndicadorFonteAzureFunction },
  ],
})
export class BffMobileModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(correlacao('bff-mobile')).forRoutes('*');
  }
}
