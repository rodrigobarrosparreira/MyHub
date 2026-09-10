import { View, Text, StyleSheet, Pressable } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { HealthStackParamList } from "../types/navigation";

type Props = NativeStackScreenProps<HealthStackParamList, "HealthMain">;

export default function Health( {navigation}: Props ){
    return(
        <View style={styles.container}>
            <Text style={styles.text}>TELA SAÚDE</Text>
            <Pressable style={styles.navButton} onPress={() => navigation.navigate("Gym")}>
                <Text>
                    Gym Page
                </Text>
            </Pressable>
        </View>
    )
}


const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center"
    },
    text:{
        fontSize: 20
    },
    navButton:{
        marginTop: 40,
        backgroundColor: "#7ea2e874",
        borderRadius: 8,
        padding: 12
    }
});