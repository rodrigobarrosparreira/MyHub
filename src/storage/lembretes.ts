import AsyncStorage from "@react-native-async-storage/async-storage";
import { Lembrete } from "../types/lembrete";

// mesma ideia do storage de exercícios: guarda textos associados a uma chave,
// salvos no próprio celular
const CHAVE = "lembretes";

export async function carregarLembretes(): Promise<Lembrete[]> {
    const texto = await AsyncStorage.getItem(CHAVE);

    // primeira vez abrindo a tela: ainda não tem nada salvo
    if (texto === null) {
        return [];
    }

    // converte o texto salvo de volta para uma lista de objetos
    return JSON.parse(texto);
}

export async function salvarLembretes(lembretes: Lembrete[]): Promise<void> {
    // o AsyncStorage só guarda texto, então convertemos a lista para JSON
    await AsyncStorage.setItem(CHAVE, JSON.stringify(lembretes));
}
