import { useEffect, useState } from "react";
import { View, Text, TextInput, Pressable, FlatList, StyleSheet, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { Lembrete } from "../types/lembrete";
import { carregarLembretes, salvarLembretes } from "../storage/lembretes";
import {
    pedirPermissao,
    agendarNotificacao,
    cancelarNotificacao,
    notificacoesDisponiveis,
} from "../notifications/lembretes";

function daquiUmaHora(): Date {
    const data = new Date(Date.now() + 60 * 60 * 1000);
    data.setSeconds(0, 0);
    return data;
}

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
    const [quando, setQuando] = useState<Date>(daquiUmaHora());
    const [seletorAberto, setSeletorAberto] = useState<"date" | "time" | null>(null);

    useEffect(() => {
        carregarLembretes().then(setLembretes);
        pedirPermissao();
    }, []);

    const ordenados = [...lembretes].sort(
        (a, b) => new Date(a.quando).getTime() - new Date(b.quando).getTime()
    );

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

        if (quando.getTime() <= Date.now()) {
            Alert.alert("Atenção", "Escolha uma data e hora que ainda não passaram.");
            return;
        }

        const textoLimpo = texto.trim();

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
        setQuando(daquiUmaHora());
    }

    function aoEscolher(evento: DateTimePickerEvent, escolhida?: Date) {
        setSeletorAberto(null);
        if (evento.type === "set" && escolhida !== undefined) {
            setQuando(escolhida);
        }
    }

    async function alternarConcluido(lembrete: Lembrete) {
        if (!lembrete.concluido && lembrete.notificacaoId !== null) {
            await cancelarNotificacao(lembrete.notificacaoId);
        }

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
                    <Pressable style={[styles.input, styles.seletor]} onPress={() => setSeletorAberto("date")}>
                        <Ionicons name="calendar-outline" size={18} color="#475569" />
                        <Text>{quando.toLocaleDateString("pt-BR")}</Text>
                    </Pressable>
                </View>
                <View style={styles.campo}>
                    <Text style={styles.label}>Hora</Text>
                    <Pressable style={[styles.input, styles.seletor]} onPress={() => setSeletorAberto("time")}>
                        <Ionicons name="time-outline" size={18} color="#475569" />
                        <Text>
                            {quando.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                        </Text>
                    </Pressable>
                </View>
            </View>

            {seletorAberto !== null && (
                <DateTimePicker
                    value={quando}
                    mode={seletorAberto}
                    is24Hour
                    minimumDate={new Date()}
                    onChange={aoEscolher}
                />
            )}

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
        textAlignVertical: "top",
    },
    linha: {
        flexDirection: "row",
        gap: 8,
    },
    campo: {
        flex: 1,
    },
    seletor: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
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
        paddingBottom: 120,
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
        backgroundColor: "#F8FAFC",
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
