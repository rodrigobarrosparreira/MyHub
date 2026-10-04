import { Platform } from "react-native";
import Constants, { ExecutionEnvironment } from "expo-constants";

const rodandoNoExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

export const notificacoesDisponiveis = !(rodandoNoExpoGo && Platform.OS === "android");

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

        if (modulo !== null && !handlerConfigurado) {
            modulo.setNotificationHandler({
                handleNotification: async () => ({
                    shouldShowBanner: true,
                    shouldShowList: true,
                    shouldPlaySound: true,
                    shouldSetBadge: false,
                }),
            });
            handlerConfigurado = true;
        }

        return modulo;
    } catch {
        modulo = null;
        return null;
    }
}

export async function pedirPermissao(): Promise<boolean> {
    const notificacoes = obterModulo();
    if (notificacoes === null) {
        return false;
    }

    const { status } = await notificacoes.requestPermissionsAsync();
    return status === "granted";
}

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
