import React, {useState} from 'react';
import {StatusBar} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import HomeScreen from './src/screens/HomeScreen';
import QuizScreen from './src/screens/QuizScreen';
import CallingScreen from './src/screens/CallingScreen';
import ConfirmScreen from './src/screens/ConfirmScreen';

export type EmergencyType = 'police' | 'medical' | 'fire';

export type RootStackParamList = {
  Home: undefined;
  Quiz: {type: EmergencyType};
  Calling: {
    type: EmergencyType;
    answers: Record<string, any>;
    address: string;
    coords: {latitude: number; longitude: number} | null;
  };
  Confirm: {type: EmergencyType};
};

const Stack = createStackNavigator<RootStackParamList>();

export default function App() {
  const [address] = useState('200 University Ave W, Waterloo, Ontario');
  const [coords] = useState<{latitude: number; longitude: number} | null>(
    null,
  );
  const [locationStatus] = useState<
    'loading' | 'ready' | 'denied' | 'unavailable'
  >('ready');

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor="#0a0a0a" />
      <NavigationContainer
        theme={{
          dark: true,
          colors: {
            primary: '#ef4444',
            background: '#0a0a0a',
            card: '#0a0a0a',
            text: '#ffffff',
            border: 'transparent',
            notification: '#ef4444',
          },
          fonts: {
            regular: {fontFamily: 'System', fontWeight: '400'},
            medium: {fontFamily: 'System', fontWeight: '500'},
            bold: {fontFamily: 'System', fontWeight: '700'},
            heavy: {fontFamily: 'System', fontWeight: '800'},
          },
        }}>
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            cardStyle: {backgroundColor: '#0a0a0a'},
            animation: 'fade',
          }}>
          <Stack.Screen name="Home">
            {({navigation}) => (
              <HomeScreen
                onSelect={(type: EmergencyType) =>
                  navigation.navigate('Quiz', {type})
                }
                locationStatus={locationStatus}
                address={address}
              />
            )}
          </Stack.Screen>
          <Stack.Screen name="Quiz">
            {({navigation, route}) => (
              <QuizScreen
                type={route.params.type}
                onComplete={(quizAnswers: Record<string, any>) =>
                  navigation.navigate('Calling', {
                    type: route.params.type,
                    answers: quizAnswers,
                    address,
                    coords,
                  })
                }
                onBack={() => navigation.goBack()}
              />
            )}
          </Stack.Screen>
          <Stack.Screen name="Calling">
            {({navigation, route}) => (
              <CallingScreen
                type={route.params.type}
                answers={route.params.answers}
                address={route.params.address}
                coords={route.params.coords}
                onConfirm={() =>
                  navigation.navigate('Confirm', {type: route.params.type})
                }
                onBack={() => navigation.goBack()}
              />
            )}
          </Stack.Screen>
          <Stack.Screen name="Confirm">
            {({navigation, route}) => (
              <ConfirmScreen
                type={route.params.type}
                onHome={() =>
                  navigation.reset({index: 0, routes: [{name: 'Home'}]})
                }
              />
            )}
          </Stack.Screen>
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
