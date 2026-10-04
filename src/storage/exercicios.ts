import AsyncStorage from "@react-native-async-storage/async-storage";
import { Exercicio } from "../types/gym";

const CHAVE = "exercicios";

export async function carregarExercicios(): Promise<Exercicio[]> {
    const texto = await AsyncStorage.getItem(CHAVE);

    if (texto === null) {
        return [];
    }

    return JSON.parse(texto);
}

export async function salvarExercicios(exercicios: Exercicio[]): Promise<void> {
    await AsyncStorage.setItem(CHAVE, JSON.stringify(exercicios));
}
