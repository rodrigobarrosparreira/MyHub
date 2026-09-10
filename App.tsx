import 'react-native-gesture-handler'; 
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createDrawerNavigator, DrawerToggleButton } from '@react-navigation/drawer';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import Home from './src/screens/Home';
import Health from './src/screens/Health';
import Gym from './src/screens/Gym';
import { HealthStackParamList, RootDrawerParamList } from './src/types/navigation';




const Drawer = createDrawerNavigator<RootDrawerParamList>();
const Stack = createNativeStackNavigator<HealthStackParamList>();

function HealthStackNavigator() {
    return(
        <Stack.Navigator>
            <Stack.Screen name="HealthMain" component={Health} options={{title: 'Fitness', headerLeft: ({ tintColor }) => <DrawerToggleButton tintColor={tintColor} />,}}/>
            <Stack.Screen name="Gym" component={Gym} options={{ title: 'Gym'}}></Stack.Screen>
        </Stack.Navigator>
    );
};

export default function App(){
    return(
        <NavigationContainer>
            <Drawer.Navigator initialRouteName="Home">
                <Drawer.Screen name='Home' component={Home}/>
                <Drawer.Screen name='Health' component={HealthStackNavigator} options={{ title: 'Fitness', headerShown: false}}/>
            </Drawer.Navigator>
        </NavigationContainer>
    )
}