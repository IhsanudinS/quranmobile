/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Home from '../screens/Home';
import Detail from '../screens/Detail';
import AyatDetail from '../screens/ayatDetail';

const Stack = createNativeStackNavigator();

const Routes = () => {
  return (
    <Stack.Navigator initialRouteName="Home">
      <Stack.Screen
        name="Daftar Surat"
        component={Home}
        options={{ headerShown: true }}
      />
      <Stack.Screen
        name="Detail"
        component={Detail}
        options={({ route }) => ({
          headerTitle: route.params.surahName || 'Detail',
        })}
      />
      <Stack.Screen
        name="AyatDetail"
        component={AyatDetail}
        options={{ headerTitle: 'Cek Bacaan' }}
      />
    </Stack.Navigator>
  );
};
export default Routes;


