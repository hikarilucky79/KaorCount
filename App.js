import 'react-native-gesture-handler';
import React from 'react';
import { Text, Image, View, ActivityIndicator } from 'react-native';
import { Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator, CardStyleInterpolators } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useFonts } from 'expo-font';

// ↓ Importando os providers de autenticação e tema
import { AuthProvider } from './src/contexts/AuthContext';
import { ThemeProvider } from './src/contexts/ThemeContext';
import useTheme from './src/hooks/useTheme';
import useAuth from './src/hooks/useAuth';

// ↓ Importando as telas (screens)
import AuthScreen from './src/screens/AuthScreen';
import HomeScreen from './src/screens/HomeScreen';
import DiarioAlimentarScreen from './src/screens/DiarioAlimentar';
import PerfilScreen from './src/screens/PerfilScreen';
import ConfiguracaoScreen, { ITENS_MENU_CONFIGURACAO } from './src/screens/ConfiguracaoScreen';
import QuizCadastroScreen from './src/screens/QuizCadastroScreen';

// ↓ Importando a biblioteca dos ícones em SVG
import { Home, Book, User } from 'lucide-react-native';

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
          height: Platform.OS === 'ios' ? 84 : 64,
          paddingBottom: Platform.OS === 'ios' ? 24 : 4,
          paddingTop: 4,
        },
        tabBarActiveTintColor: cores.primaria,
        tabBarInactiveTintColor: cores.textoSuave,
        tabBarLabelStyle: {
          fontFamily: 'PlusJakartaSansSemiBold',
          fontSize: 11,
          lineHeight: 16,
          marginTop: 2,
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
    </Tab.Navigator>
  );
}

function NavegacaoRaiz() {
  const { carregando, logado } = useAuth();
  const { cores } = useTheme();
  const [fontesCarregadas] = useFonts({
    PlusJakartaSansSemiBold: require('./assets/fonts/PlusJakartaSans-SemiBold.ttf'),
    PoppinsBlack: require('./assets/fonts/Poppins-Black.ttf'),
  });

  // Aguarda a leitura da sessão antes de montar a navegação para evitar
  // mostrar a tela de login por um instante a cada abertura do app.
  if (carregando || !fontesCarregadas) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: cores.fundo }}>
        <ActivityIndicator size="large" color={cores.primaria} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={logado ? 'AppTabs' : 'Auth'}
        screenOptions={{
          headerShown: false,
          cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
          cardStyle: { flex: 1, minHeight: 0 },
        }}
      >
        <Stack.Screen name="Auth" component={AuthScreen} options={{ animationEnabled: false }} />
        <Stack.Screen name="QuizCadastro" component={QuizCadastroScreen} />
        <Stack.Screen name="AppTabs" component={AppTabs} />
        <Stack.Screen name="Configuracao" component={ConfiguracaoScreen} />
        {ITENS_MENU_CONFIGURACAO.filter(({ rota }) => rota).map(({ id, rota }) => (
          <Stack.Screen
            key={rota}
            name={rota}
            component={id === 'perfil' ? PerfilScreen : ConfiguracaoScreen}
            initialParams={{ secao: id, abrirEdicao: id === 'perfil' }}
          />
        ))}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NavegacaoRaiz />
      </AuthProvider>
    </ThemeProvider>
  );
}
