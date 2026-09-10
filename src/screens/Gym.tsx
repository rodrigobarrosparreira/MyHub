import { View, Text, StyleSheet } from "react-native";


export default function Gym(){
    return(
        <View style={styles.container}>
            <Text>TELA ACADEMIA</Text>
        </View>
    )
}


const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center"
    }
});