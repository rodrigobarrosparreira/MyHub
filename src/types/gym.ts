// um registro é uma "anotação" de treino: quanto peso, quantas séries e repetições, e quando
export type Registro = {
    id: string;
    data: string; // data em formato ISO, ex.: "2026-09-29T14:30:00.000Z"
    peso: number; // em kg
    series: number;
    repeticoes: number;
};

// um exercício guarda o nome e todo o histórico de registros (do mais antigo pro mais novo)
export type Exercicio = {
    id: string;
    nome: string;
    registros: Registro[];
};
