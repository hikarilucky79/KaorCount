import 'react-native-gesture-handler';
import React from 'react';
import { Text, Image } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator, CardStyleInterpolators } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

// ↓ Importando os providers de autenticação e tema
import { AuthProvider } from './src/contexts/AuthContext';
import { ThemeProvider } from './src/contexts/ThemeContext';
import useTheme from './src/hooks/useTheme';

// ↓ Importando as telas (screens)
import AuthScreen from './src/screens/AuthScreen';
import HomeScreen from './src/screens/HomeScreen';
import DiarioAlimentarScreen from './src/screens/DiarioAlimentar';
import PerfilScreen from './src/screens/PerfilScreen';
import ConfiguracaoScreen from './src/screens/ConfiguracaoScreen';

// ↓ Importando a biblioteca dos ícones em SVG
import { Home, Book, User, Settings } from 'lucide-react-native';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function AppTabs() {
  const { cores } = useTheme();

  return (
    <Tab.Navigator
      lazy={false}
      detachInactiveScreens={false}
      screenOptions={{
        headerShown: false,
        unmountOnBlur: false,
        tabBarStyle: {
          backgroundColor: cores.branco,
          borderTopColor: cores.borda,
          height: 60,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: cores.primaria,
        tabBarInactiveTintColor: cores.textoSuave,
        tabBarLabelStyle: {
          fontWeight: 'bold',
          fontSize: 10,
        },
      }}
    >
      <Tab.Screen
        name="Início"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Home color={color} size={22} />,
        }}
      />
      <Tab.Screen
        name="Diário"
        component={DiarioAlimentarScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Book color={color} size={22} />,
        }}
      />
      <Tab.Screen
        name="Perfil"
        component={PerfilScreen}
        options={{
          tabBarIcon: ({ color, size }) => <User color={color} size={22} />,
        }}
      />
      <Tab.Screen
        name="Configuração"
        component={ConfiguracaoScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Settings color={color} size={22} />,
        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NavigationContainer>
          <Stack.Navigator
            screenOptions={{
              headerShown: false,
              cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
            }}
          >
            <Stack.Screen
              name="Auth"
              component={AuthScreen}
              options={{ animationEnabled: false }}
            />
            <Stack.Screen name="AppTabs" component={AppTabs} />
            <Stack.Screen name="Configuracao" component={ConfiguracaoScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </AuthProvider>
    </ThemeProvider>
  );
}
