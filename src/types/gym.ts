export type Registro = {
    id: string;
    data: string;
    peso: number;
    series: number;
    repeticoes: number;
};

export type Exercicio = {
    id: string;
    nome: string;
    registros: Registro[];
};
