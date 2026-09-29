// mapa da pilha de telas principal do app (navegação pelo menu radial)
export type RootStackParamList = {
    Home: undefined;
    Health: undefined;
    Gym: undefined;
    // tela de um exercício específico: recebe o id (pra achar os dados) e o nome (pro título)
    Exercise: { id: string; nome: string };
};
