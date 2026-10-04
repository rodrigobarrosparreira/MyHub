import 'react-native-gesture-handler';
import React from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import Home from './src/screens/Home';
import Health from './src/screens/Health';
import Gym from './src/screens/Gym';
import Exercise from './src/screens/Exercise';
import Reminders from './src/screens/Reminders';

import RadialMenu, { RadialMenuItem } from './src/components/RadialMenu';
import { navigationRef, navigate } from './src/navigation/navigationRef';
import { RootStackParamList } from './src/types/navigation';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const menuItems: RadialMenuItem[] = [
    {
      id: 'home',
      name: 'Início',
      icon: 'home-outline',
      onPress: () => navigate('Home'),
    },
    {
      id: 'health',
      name: 'Saúde',
      icon: 'heart-outline',
      onPress: () => navigate('Health'),
    },
    {
      id: 'gym',
      name: 'Treino',
      icon: 'barbell-outline',
      onPress: () => navigate('Gym'),
    },
    {
      id: 'reminders',
      name: 'Lembretes',
      icon: 'alarm-outline',
      onPress: () => navigate('Reminders'),
    },
  ];

  return (
    <GestureHandlerRootView style={styles.root}>
      <NavigationContainer ref={navigationRef}>
        <Stack.Navigator
          initialRouteName="Home"
          screenOptions={{
            headerStyle: { backgroundColor: '#F8FAFC' },
            headerTintColor: '#0F172A',
            headerTitleAlign: 'center',
          }}
        >
          <Stack.Screen name="Home" component={Home} options={{ title: 'Início' }} />
          <Stack.Screen name="Health" component={Health} options={{ title: 'Saúde / Fitness' }} />
          <Stack.Screen name="Gym" component={Gym} options={{ title: 'Treino' }} />
          <Stack.Screen name="Reminders" component={Reminders} options={{ title: 'Lembretes' }} />
          <Stack.Screen
            name="Exercise"
            component={Exercise}
            options={({ route }) => ({ title: route.params.nome })}
          />
        </Stack.Navigator>
      </NavigationContainer>

      <RadialMenu items={menuItems} />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});