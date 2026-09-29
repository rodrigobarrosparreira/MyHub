import { useEffect, useState } from "react";
import { View, Text, TextInput, Pressable, FlatList, StyleSheet, Alert } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { RootStackParamList } from "../types/navigation";
import { Exercicio, Registro } from "../types/gym";
import { carregarExercicios, salvarExercicios } from "../storage/exercicios";

type Props = NativeStackScreenProps<RootStackParamList, "Exercise">;

export default function Exercise({ route }: Props) {
    const { id } = route.params; // id do exercício que foi clicado na tela Gym

    const [exercicios, setExercicios] = useState<Exercicio[]>([]);
    const [peso, setPeso] = useState("");
    const [series, setSeries] = useState("");
    const [repeticoes, setRepeticoes] = useState("");
    // id do registro sendo editado; null quando o formulário está sendo usado para adicionar
    const [editandoId, setEditandoId] = useState<string | null>(null);

    // carrega os dados salvos uma vez, quando a tela abre
    useEffect(() => {
        carregarExercicios().then(setExercicios);
    }, []);

    const exercicio = exercicios.find((e) => e.id === id);
    const registros = exercicio ? exercicio.registros : [];

    // histórico do mais novo pro mais antigo (reverse altera o array, por isso a cópia com [...])
    const historico = [...registros].reverse();

    // toda alteração nos registros passa por aqui:
    // troca os registros só do exercício atual, atualiza a tela e salva no celular
    async function atualizarRegistros(novosRegistros: Registro[]) {
        const novaLista = exercicios.map((e) =>
            e.id === id ? { ...e, registros: novosRegistros } : e
        );
        setExercicios(novaLista);
        await salvarExercicios(novaLista);
    }

    async function salvar() {
        // aceita vírgula ou ponto no peso (ex.: 12,5 ou 12.5)
        const pesoNumero = Number(peso.replace(",", "."));
        const seriesNumero = Number(series);
        const repeticoesNumero = Number(repeticoes);

        if (peso === "" || series === "" || repeticoes === ""
            || isNaN(pesoNumero) || isNaN(seriesNumero) || isNaN(repeticoesNumero)) {
            Alert.alert("Atenção", "Preencha peso, séries e repetições com números.");
            return;
        }

        if (editandoId === null) {
            // modo adicionar: cria um registro novo com a data de agora
            const novoRegistro: Registro = {
                id: Date.now().toString(),
                data: new Date().toISOString(),
                peso: pesoNumero,
                series: seriesNumero,
                repeticoes: repeticoesNumero,
            };
            await atualizarRegistros([...registros, novoRegistro]);
        } else {
            // modo editar: troca os valores do registro, mantendo o id e a data originais
            await atualizarRegistros(
                registros.map((r) =>
                    r.id === editandoId
                        ? { ...r, peso: pesoNumero, series: seriesNumero, repeticoes: repeticoesNumero }
                        : r
                )
            );
        }

        cancelarEdicao(); // limpa os campos e volta para o modo adicionar
    }

    function comecarEdicao(registro: Registro) {
        // os campos de texto guardam string, então convertemos os números
        setPeso(String(registro.peso));
        setSeries(String(registro.series));
        setRepeticoes(String(registro.repeticoes));
        setEditandoId(registro.id);
    }

    function cancelarEdicao() {
        setPeso("");
        setSeries("");
        setRepeticoes("");
        setEditandoId(null);
    }

    function apagarRegistro(registro: Registro) {
        Alert.alert("Apagar registro", "Tem certeza que quer apagar este registro?", [
            { text: "Cancelar", style: "cancel" },
            {
                text: "Apagar",
                style: "destructive",
                onPress: () => {
                    atualizarRegistros(registros.filter((r) => r.id !== registro.id));
                    if (editandoId === registro.id) {
                        cancelarEdicao();
                    }
                },
            },
        ]);
    }

    return (
        <View style={styles.container}>
            <View style={styles.form}>
                <View style={styles.campo}>
                    <Text style={styles.label}>Peso (kg)</Text>
                    <TextInput style={styles.input} keyboardType="decimal-pad" value={peso} onChangeText={setPeso} />
                </View>
                <View style={styles.campo}>
                    <Text style={styles.label}>Séries</Text>
                    <TextInput style={styles.input} keyboardType="number-pad" value={series} onChangeText={setSeries} />
                </View>
                <View style={styles.campo}>
                    <Text style={styles.label}>Repetições</Text>
                    <TextInput style={styles.input} keyboardType="number-pad" value={repeticoes} onChangeText={setRepeticoes} />
                </View>
            </View>

            <View style={styles.botoes}>
                <Pressable style={styles.botao} onPress={salvar}>
                    <Text style={styles.botaoTexto}>{editandoId === null ? "Registrar treino" : "Salvar alteração"}</Text>
                </Pressable>
                {editandoId !== null && (
                    <Pressable style={styles.botaoCancelar} onPress={cancelarEdicao}>
                        <Text style={styles.botaoCancelarTexto}>Cancelar</Text>
                    </Pressable>
                )}
            </View>

            <Text style={styles.titulo}>Histórico</Text>

            <FlatList
                data={historico}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.lista}
                ListEmptyComponent={<Text style={styles.vazio}>Nenhum registro ainda.</Text>}
                renderItem={({ item, index }) => {
                    // como a lista está invertida, o registro anterior (mais antigo) é o próximo índice
                    const anterior = historico[index + 1];
                    // arredonda para 2 casas, porque contas com decimais podem dar 2.1999999...
                    const diferenca = anterior ? Math.round((item.peso - anterior.peso) * 100) / 100 : 0;

                    return (
                        <View style={[styles.card, item.id === editandoId && styles.cardEditando]}>
                            <View style={styles.cardConteudo}>
                                <Text style={styles.cardData}>{new Date(item.data).toLocaleDateString("pt-BR")}</Text>
                                <Text style={styles.cardInfo}>
                                    {item.peso} kg · {item.series}x{item.repeticoes}
                                    {diferenca !== 0 && (
                                        <Text style={diferenca > 0 ? styles.subiu : styles.desceu}>
                                            {"  "}{diferenca > 0 ? "+" : ""}{diferenca} kg
                                        </Text>
                                    )}
                                </Text>
                            </View>

                            <Pressable style={styles.icone} onPress={() => comecarEdicao(item)}>
                                <Ionicons name="create-outline" size={22} color="#475569" />
                            </Pressable>
                            <Pressable style={styles.icone} onPress={() => apagarRegistro(item)}>
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
    },
    campo: {
        flex: 1,
    },
    label: {
        color: "#475569",
        marginBottom: 4,
    },
    input: {
        borderWidth: 1,
        borderColor: "#CBD5E1",
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        backgroundColor: "#FFFFFF",
    },
    botoes: {
        flexDirection: "row",
        gap: 8,
        marginTop: 12,
    },
    botao: {
        flex: 1,
        backgroundColor: "#0F172A",
        borderRadius: 8,
        padding: 14,
        alignItems: "center",
    },
    botaoTexto: {
        color: "#FFFFFF",
        fontWeight: "bold",
    },
    botaoCancelar: {
        borderWidth: 1,
        borderColor: "#CBD5E1",
        borderRadius: 8,
        padding: 14,
        alignItems: "center",
    },
    botaoCancelarTexto: {
        color: "#0F172A",
        fontWeight: "bold",
    },
    titulo: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#0F172A",
        marginTop: 24,
        marginBottom: 8,
    },
    lista: {
        gap: 8,
        paddingBottom: 120, // espaço para o menu radial não cobrir o último item
    },
    vazio: {
        textAlign: "center",
        color: "#64748B",
        marginTop: 16,
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
        borderColor: "#0F172A", // destaca o registro que está sendo editado
    },
    cardConteudo: {
        flex: 1,
        padding: 14,
    },
    cardData: {
        color: "#64748B",
    },
    cardInfo: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#0F172A",
        marginTop: 2,
    },
    subiu: {
        color: "#16A34A",
        fontWeight: "bold",
    },
    desceu: {
        color: "#DC2626",
        fontWeight: "bold",
    },
    icone: {
        padding: 12,
    },
});
