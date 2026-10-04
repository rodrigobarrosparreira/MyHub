import AsyncStorage from "@react-native-async-storage/async-storage";
import { Lembrete } from "../types/lembrete";

const CHAVE = "lembretes";

export async function carregarLembretes(): Promise<Lembrete[]> {
    const texto = await AsyncStorage.getItem(CHAVE);

    if (texto === null) {
        return [];
    }

    return JSON.parse(texto);
}

export async function salvarLembretes(lembretes: Lembrete[]): Promise<void> {
    await AsyncStorage.setItem(CHAVE, JSON.stringify(lembretes));
}
