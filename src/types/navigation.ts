// mapa da pilha de telas principal do app (navegação pelo menu radial)
export type RootStackParamList = {
    Home: undefined;
    Health: undefined;
    Gym: undefined;
};

//mapa da pilha da parte de saúde (quais as telas que vão ficar dentro da tela de Health)
export type HealthStackParamList = {
    HealthMain: undefined;
    Gym: undefined;
};