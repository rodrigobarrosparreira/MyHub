import { useCallback, useState } from "react";
import { View, Text, TextInput, Pressable, FlatList, StyleSheet, Alert } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { RootStackParamList } from "../types/navigation";
import { Exercicio } from "../types/gym";
import { carregarExercicios, salvarExercicios } from "../storage/exercicios";

type Props = NativeStackScreenProps<RootStackParamList, "Gym">;

export default function Gym({ navigation }: Props) {
    const [exercicios, setExercicios] = useState<Exercicio[]>([]);
    const [nome, setNome] = useState("");
    const [editandoId, setEditandoId] = useState<string | null>(null);

    useFocusEffect(
        useCallback(() => {
            carregarExercicios().then(setExercicios);
        }, [])
    );

    async function atualizarLista(novaLista: Exercicio[]) {
        setExercicios(novaLista);
        await salvarExercicios(novaLista);
    }

    async function salvar() {
        const nomeLimpo = nome.trim();
        if (nomeLimpo === "") {
            return;
        }

        if (editandoId === null) {
            const novo: Exercicio = {
                id: Date.now().toString(),
                nome: nomeLimpo,
                registros: [],
            };
            await atualizarLista([...exercicios, novo]);
        } else {
            await atualizarLista(
                exercicios.map((e) => (e.id === editandoId ? { ...e, nome: nomeLimpo } : e))
            );
        }

        cancelarEdicao();
    }

    function comecarEdicao(exercicio: Exercicio) {
        setNome(exercicio.nome);
        setEditandoId(exercicio.id);
    }

    function cancelarEdicao() {
        setNome("");
        setEditandoId(null);
    }

    function apagarExercicio(exercicio: Exercicio) {
        Alert.alert("Apagar exercício", `Apagar "${exercicio.nome}" e todo o histórico?`, [
            { text: "Cancelar", style: "cancel" },
            {
                text: "Apagar",
                style: "destructive",
                onPress: () => {
                    atualizarLista(exercicios.filter((e) => e.id !== exercicio.id));
                    if (editandoId === exercicio.id) {
                        cancelarEdicao();
                    }
                },
            },
        ]);
    }

    return (
        <View style={styles.container}>
            <View style={styles.form}>
                <TextInput
                    style={styles.input}
                    placeholder="Novo exercício (ex.: Supino)"
                    value={nome}
                    onChangeText={setNome}
                    onSubmitEditing={salvar}
                />
                <Pressable style={styles.botao} onPress={salvar}>
                    <Text style={styles.botaoTexto}>{editandoId === null ? "Adicionar" : "Salvar"}</Text>
                </Pressable>
                {editandoId !== null && (
                    <Pressable style={styles.botaoCancelar} onPress={cancelarEdicao}>
                        <Ionicons name="close" size={20} color="#0F172A" />
                    </Pressable>
                )}
            </View>

            <FlatList
                data={exercicios}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.lista}
                ListEmptyComponent={<Text style={styles.vazio}>Nenhum exercício cadastrado ainda.</Text>}
                renderItem={({ item }) => {
                    const ultimo = item.registros[item.registros.length - 1];

                    return (
                        <View style={[styles.card, item.id === editandoId && styles.cardEditando]}>
                            <Pressable
                                style={styles.cardConteudo}
                                onPress={() => navigation.navigate("Exercise", { id: item.id, nome: item.nome })}
                            >
                                <Text style={styles.cardTitulo}>{item.nome}</Text>
                                <Text style={styles.cardInfo}>
                                    {ultimo
                                        ? `Último: ${ultimo.peso} kg · ${ultimo.series}x${ultimo.repeticoes}`
                                        : "Sem registros"}
                                </Text>
                            </Pressable>

                            <Pressable style={styles.icone} onPress={() => comecarEdicao(item)}>
                                <Ionicons name="create-outline" size={22} color="#475569" />
                            </Pressable>
                            <Pressable style={styles.icone} onPress={() => apagarExercicio(item)}>
                                <Ionicons name="trash-outline" size={22} color="#DC2626" />
                            </Pressable>
                        </View>
                    );
                }}
            />
        </View>
    );
}


const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
    },
    form: {
        flexDirection: "row",
        gap: 8,
        marginBottom: 16,
    },
    input: {
        flex: 1,
        borderWidth: 1,
        borderColor: "#CBD5E1",
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        backgroundColor: "#FFFFFF",
    },
    botao: {
        backgroundColor: "#0F172A",
        borderRadius: 8,
        paddingHorizontal: 16,
        justifyContent: "center",
    },
    botaoTexto: {
        color: "#FFFFFF",
        fontWeight: "bold",
    },
    botaoCancelar: {
        borderWidth: 1,
        borderColor: "#CBD5E1",
        borderRadius: 8,
        paddingHorizontal: 10,
        justifyContent: "center",
    },
    lista: {
        gap: 8,
        paddingBottom: 120,
    },
    vazio: {
        textAlign: "center",
        color: "#64748B",
        marginTop: 32,
    },
    card: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FFFFFF",
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#E2E8F0",
    },
    cardEditando: {
        borderColor: "#0F172A",
    },
    cardConteudo: {
        flex: 1,
        padding: 14,
    },
    cardTitulo: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#0F172A",
    },
    cardInfo: {
        marginTop: 4,
        color: "#64748B",
    },
    icone: {
        padding: 12,
    },
});
