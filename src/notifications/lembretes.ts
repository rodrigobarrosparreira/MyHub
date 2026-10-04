import { Platform } from "react-native";
import Constants, { ExecutionEnvironment } from "expo-constants";

// o Expo Go do Android não embute o módulo nativo de notificações desde o SDK 53.
// nesse ambiente, qualquer uso do expo-notifications lança exceção e derruba o app,
// então detectamos onde estamos rodando e desligamos o recurso.
const rodandoNoExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

export const notificacoesDisponiveis = !(rodandoNoExpoGo && Platform.OS === "android");

// o módulo é carregado sob demanda, dentro da função.
// um "import" no topo do arquivo rodaria sempre, inclusive no Expo Go,
// que é exatamente o que precisamos evitar.
let modulo: typeof import("expo-notifications") | null = null;
let handlerConfigurado = false;

function obterModulo() {
    if (!notificacoesDisponiveis) {
        return null;
    }
    if (modulo !== null) {
        return modulo;
    }

    try {
        modulo = require("expo-notifications");

        // define como a notificação se comporta quando dispara
        // com o app aberto na frente do usuário. só precisa ser feito uma vez.
        if (modulo !== null && !handlerConfigurado) {
            modulo.setNotificationHandler({
                handleNotification: async () => ({
                    shouldShowBanner: true, // mostra a tarja no topo da tela
                    shouldShowList: true, // deixa o aviso na central de notificações
                    shouldPlaySound: true,
                    shouldSetBadge: false, // número na bolinha do ícone do app (só iOS)
                }),
            });
            handlerConfigurado = true;
        }

        return modulo;
    } catch {
        // se o módulo não puder ser carregado, o app segue funcionando sem avisos
        modulo = null;
        return null;
    }
}

// no Android 13 ou superior o usuário precisa autorizar as notificações.
// devolve false quando não há como notificar neste ambiente.
export async function pedirPermissao(): Promise<boolean> {
    const notificacoes = obterModulo();
    if (notificacoes === null) {
        return false;
    }

    const { status } = await notificacoes.requestPermissionsAsync();
    return status === "granted";
}

// agenda o aviso e devolve o id do agendamento, que é o que permite
// cancelar depois. devolve null quando não há notificação disponível:
// o lembrete continua sendo salvo, só não avisa.
export async function agendarNotificacao(
    titulo: string,
    texto: string,
    quando: Date
): Promise<string | null> {
    const notificacoes = obterModulo();
    if (notificacoes === null) {
        return null;
    }

    return notificacoes.scheduleNotificationAsync({
        content: {
            title: titulo,
            body: texto,
        },
        trigger: {
            // DATE = dispara uma única vez, na data e hora indicadas
            type: notificacoes.SchedulableTriggerInputTypes.DATE,
            date: quando,
        },
    });
}

export async function cancelarNotificacao(id: string): Promise<void> {
    const notificacoes = obterModulo();
    if (notificacoes === null) {
        return;
    }

    await notificacoes.cancelScheduledNotificationAsync(id);
}
