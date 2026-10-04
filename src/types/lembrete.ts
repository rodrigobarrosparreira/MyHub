export type Lembrete = {
    id: string;
    titulo: string;
    texto: string;
    quando: string;
    concluido: boolean;
    notificacaoId: string | null;
};
