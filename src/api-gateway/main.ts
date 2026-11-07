import 'dotenv/config'; // precisa ser o primeiro import
import { iniciarServico } from '../shared/http/iniciar-servico';
import { ApiGatewayModule } from './api-gateway.module';

// Porta 3000: a mesma que o app mobile já usa, então o app não muda.
iniciarServico(ApiGatewayModule, 'api-gateway', Number(process.env.PORTA_GATEWAY || process.env.PORT) || 3000, { cors: true });
