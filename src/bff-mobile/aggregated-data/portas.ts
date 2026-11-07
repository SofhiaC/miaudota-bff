/** Portas do caso de uso "agregar dados": de onde vêm os dados. Os adaptadores HTTP ficam ao lado. */
export type Usuario = { id: string; tipo: string };

export type IndicadorAdocao = {
  animaisDisponiveis: number;
  feirasAtivas: number;
  animaisPorFeira: number | null;
  pontuacao: number;
  nivel: 'BAIXA' | 'MEDIA' | 'ALTA';
  mensagem: string;
  geradoEm: string;
};

/** Microsserviço de adoção (MongoDB). PESSOA vê os animais disponíveis; ONG vê os seus. */
export abstract class AnimaisFonte {
  abstract listar(usuario: Usuario): Promise<any[]>;
}

/** Microsserviço de geolocalização (Azure SQL): feiras em andamento ou futuras. */
export abstract class FeirasFonte {
  abstract listar(usuario: Usuario): Promise<any[]>;
}

/** Azure Function (HTTP Trigger) que calcula o indicador de oportunidade de adoção. */
export abstract class IndicadorFonte {
  abstract calcular(animaisDisponiveis: number, feirasAtivas: number): Promise<IndicadorAdocao>;
}
