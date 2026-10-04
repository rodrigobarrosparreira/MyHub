import { useEffect, useState } from "react";
import { View, Text, TextInput, Pressable, FlatList, StyleSheet, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Lembrete } from "../types/lembrete";
import { carregarLembretes, salvarLembretes } from "../storage/lembretes";
import {
    pedirPermissao,
    agendarNotificacao,
    cancelarNotificacao,
    notificacoesDisponiveis,
} from "../notifications/lembretes";

// transforma o que foi digitado nos campos em uma data de verdade.
// devolve null quando o texto não forma uma data válida.
function montarData(dataTexto: string, horaTexto: string): Date | null {
    const [dia, mes, ano] = dataTexto.split("/").map(Number);
    const [hora, minuto] = horaTexto.split(":").map(Number);

    // em JavaScript os meses vão de 0 (janeiro) a 11 (dezembro), por isso o mes - 1
    const data = new Date(ano, mes - 1, dia, hora, minuto);

    // se qualquer campo estiver errado, a data criada é inválida
    if (isNaN(data.getTime())) {
        return null;
    }
    return data;
}

// mostra a data no formato brasileiro, ex.: "05/10/2026 às 18:30"
function formatarData(iso: string): string {
    const data = new Date(iso);
    const dia = data.toLocaleDateString("pt-BR");
    const hora = data.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    return dia + " às " + hora;
}

export default function Reminders() {
    const [lembretes, setLembretes] = useState<Lembrete[]>([]);
    const [titulo, setTitulo] = useState("");
    const [texto, setTexto] = useState("");
    const [data, setData] = useState("");
    const [hora, setHora] = useState("");

    // carrega os lembretes salvos e pede permissão de notificação, uma vez só
    useEffect(() => {
        carregarLembretes().then(setLembretes);
        pedirPermissao();
    }, []);

    // a lista é exibida em ordem cronológica: o lembrete mais próximo primeiro.
    // a cópia com [...] é necessária porque o sort altera o array original.
    const ordenados = [...lembretes].sort(
        (a, b) => new Date(a.quando).getTime() - new Date(b.quando).getTime()
    );

    // toda alteração na lista passa por aqui: atualiza a tela e salva no celular
    async function atualizarLista(novaLista: Lembrete[]) {
        setLembretes(novaLista);
        await salvarLembretes(novaLista);
    }

    async function adicionar() {
        const tituloLimpo = titulo.trim();
        if (tituloLimpo === "") {
            Alert.alert("Atenção", "O lembrete precisa de um título.");
            return;
        }

        const quando = montarData(data, hora);
        if (quando === null) {
            Alert.alert("Atenção", "Use data no formato DD/MM/AAAA e hora no formato HH:MM.");
            return;
        }

        // uma notificação só pode ser agendada para o futuro
        if (quando.getTime() <= Date.now()) {
            Alert.alert("Atenção", "Escolha uma data e hora que ainda não passaram.");
            return;
        }

        const textoLimpo = texto.trim();

        // agenda o aviso e guarda o id devolvido, para poder cancelar depois
        const notificacaoId = await agendarNotificacao(tituloLimpo, textoLimpo, quando);

        const novo: Lembrete = {
            id: Date.now().toString(),
            titulo: tituloLimpo,
            texto: textoLimpo,
            quando: quando.toISOString(),
            concluido: false,
            notificacaoId,
        };

        await atualizarLista([...lembretes, novo]);
        limparFormulario();
    }

    function limparFormulario() {
        setTitulo("");
        setTexto("");
        setData("");
        setHora("");
    }

    async function alternarConcluido(lembrete: Lembrete) {
        // ao concluir, cancela o aviso que ainda não disparou
        if (!lembrete.concluido && lembrete.notificacaoId !== null) {
            await cancelarNotificacao(lembrete.notificacaoId);
        }

        // desmarcar não reagenda o aviso de propósito: assim não precisamos
        // decidir o que fazer quando a data já passou
        await atualizarLista(
            lembretes.map((l) =>
                l.id === lembrete.id ? { ...l, concluido: !l.concluido, notificacaoId: null } : l
            )
        );
    }

    function apagar(lembrete: Lembrete) {
        Alert.alert("Apagar lembrete", "Apagar \"" + lembrete.titulo + "\"?", [
            { text: "Cancelar", style: "cancel" },
            {
                text: "Apagar",
                style: "destructive",
                onPress: async () => {
                    // cancela antes de apagar, senão o aviso dispara
                    // para um lembrete que não existe mais
                    if (lembrete.notificacaoId !== null) {
                        await cancelarNotificacao(lembrete.notificacaoId);
                    }
                    await atualizarLista(lembretes.filter((l) => l.id !== lembrete.id));
                },
            },
        ]);
    }

    return (
        <View style={styles.container}>
            {!notificacoesDisponiveis && (
                <View style={styles.aviso}>
                    <Ionicons name="warning-outline" size={18} color="#92400E" />
                    <Text style={styles.avisoTexto}>
                        Neste ambiente os avisos não disparam. Os lembretes são salvos
                        normalmente.
                    </Text>
                </View>
            )}

            <TextInput
                style={styles.input}
                placeholder="Título (ex.: Tomar remédio)"
                value={titulo}
                onChangeText={setTitulo}
            />

            <TextInput
                style={[styles.input, styles.inputTexto]}
                placeholder="Detalhes (opcional)"
                value={texto}
                onChangeText={setTexto}
                multiline
            />

            <View style={styles.linha}>
                <View style={styles.campo}>
                    <Text style={styles.label}>Data</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="DD/MM/AAAA"
                        keyboardType="number-pad"
                        value={data}
                        onChangeText={setData}
                    />
                </View>
                <View style={styles.campo}>
                    <Text style={styles.label}>Hora</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="HH:MM"
                        keyboardType="number-pad"
                        value={hora}
                        onChangeText={setHora}
                    />
                </View>
            </View>

            <Pressable style={styles.botao} onPress={adicionar}>
                <Text style={styles.botaoTexto}>Adicionar lembrete</Text>
            </Pressable>

            <Text style={styles.titulo}>Próximos</Text>

            <FlatList
                data={ordenados}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.lista}
                ListEmptyComponent={<Text style={styles.vazio}>Nenhum lembrete ainda.</Text>}
                renderItem={({ item }) => (
                    <View style={[styles.card, item.concluido && styles.cardConcluido]}>
                        <Pressable style={styles.icone} onPress={() => alternarConcluido(item)}>
                            <Ionicons
                                name={item.concluido ? "checkmark-circle" : "ellipse-outline"}
                                size={26}
                                color={item.concluido ? "#16A34A" : "#94A3B8"}
                            />
                        </Pressable>

                        <View style={styles.cardConteudo}>
                            <Text style={[styles.cardTitulo, item.concluido && styles.textoConcluido]}>
                                {item.titulo}
                            </Text>
                            {item.texto !== "" && (
                                <Text style={styles.cardTexto}>{item.texto}</Text>
                            )}
                            <Text style={styles.cardData}>{formatarData(item.quando)}</Text>
                        </View>

                        <Pressable style={styles.icone} onPress={() => apagar(item)}>
                            <Ionicons name="trash-outline" size={22} color="#DC2626" />
                        </Pressable>
                    </View>
                )}
            />
        </View>
    );
}


const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
    },
    aviso: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        backgroundColor: "#FEF3C7",
        borderRadius: 8,
        padding: 12,
        marginBottom: 12,
    },
    avisoTexto: {
        flex: 1,
        color: "#92400E",
        fontSize: 13,
    },
    input: {
        borderWidth: 1,
        borderColor: "#CBD5E1",
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        backgroundColor: "#FFFFFF",
        marginBottom: 8,
    },
    inputTexto: {
        minHeight: 60,
        textAlignVertical: "top", // no Android o texto começa no topo da caixa
    },
    linha: {
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
    botao: {
        backgroundColor: "#0F172A",
        borderRadius: 8,
        padding: 14,
        alignItems: "center",
        marginTop: 4,
    },
    botaoTexto: {
        color: "#FFFFFF",
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
    cardConcluido: {
        backgroundColor: "#F8FAFC", // fica mais apagado que os pendentes
    },
    cardConteudo: {
        flex: 1,
        paddingVertical: 14,
    },
    cardTitulo: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#0F172A",
    },
    textoConcluido: {
        textDecorationLine: "line-through",
        color: "#94A3B8",
    },
    cardTexto: {
        color: "#475569",
        marginTop: 2,
    },
    cardData: {
        color: "#64748B",
        marginTop: 4,
    },
    icone: {
        padding: 12,
    },
});
