// um lembrete é uma anotação com data e hora marcadas, que avisa por notificação
export type Lembrete = {
    id: string;
    titulo: string;
    texto: string;
    quando: string; // data e hora em formato ISO, ex.: "2026-10-05T18:30:00.000Z"
    concluido: boolean;
    // id devolvido pelo expo-notifications ao agendar;
    // guardamos para conseguir cancelar esse aviso específico depois
    notificacaoId: string | null;
};
