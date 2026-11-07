import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { segredoJwt } from '../shared/config';
import { correlacao } from '../shared/http/correlacao.middleware';
import { limitarRequisicoes } from './limitar-requisicoes.middleware';
import { ProxyController } from './proxy.controller';

@Module({
  imports: [JwtModule.register({ secret: segredoJwt() })],
  controllers: [ProxyController],
})
export class ApiGatewayModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(correlacao('api-gateway'), limitarRequisicoes).forRoutes('*');
  }
}
