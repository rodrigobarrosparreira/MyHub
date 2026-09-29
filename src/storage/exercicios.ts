import AsyncStorage from "@react-native-async-storage/async-storage";
import { Exercicio } from "../types/gym";

// o AsyncStorage funciona como o localStorage do navegador:
// guarda textos associados a uma chave, salvos no próprio celular
const CHAVE = "exercicios";

export async function carregarExercicios(): Promise<Exercicio[]> {
    const texto = await AsyncStorage.getItem(CHAVE);

    // primeira vez abrindo o app: ainda não tem nada salvo
    if (texto === null) {
        return [];
    }

    // converte o texto salvo de volta para uma lista de objetos
    return JSON.parse(texto);
}

export async function salvarExercicios(exercicios: Exercicio[]): Promise<void> {
    // o AsyncStorage só guarda texto, então convertemos a lista para JSON
    await AsyncStorage.setItem(CHAVE, JSON.stringify(exercicios));
}
