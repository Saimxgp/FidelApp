import "react-native-gesture-handler";
import { useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { NavigationContainer, DarkTheme, DefaultTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { MD3DarkTheme, MD3LightTheme, PaperProvider } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";

import { Colors, moderateScale, scale, verticalScale } from "@/constants/styles";
import { useColorScheme } from "@/hooks/use-color-scheme";
import LoginScreen from "@/app/login";
import SignUpScreen from "@/app/signup";
import ForgotPasswordScreen from "@/app/forgotpassword";
import OnboardingScreen from "@/app/onboarding";
import EmpresasScreen from "@/app/(tabs)/Empresas";
import ClienteScreen from "@/app/(tabs)/Cliente";
import PerfilScreen from "@/app/(tabs)/Perfil";

const AuthStack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const paperLightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: Colors.primary,
    secondary: Colors.accent,
    background: Colors.background,
    surface: Colors.card,
    surfaceVariant: Colors.backgroundAlt,
    outline: Colors.border,
    onPrimary: Colors.textOnPrimary,
    onSurface: Colors.text,
    onSurfaceVariant: Colors.textMuted,
  },
};

const paperDarkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: Colors.accent,
    secondary: Colors.primary,
    background: "#051414",
    surface: "#0F2F2E",
    surfaceVariant: "#123736",
    outline: "#2B4E4D",
    onPrimary: Colors.textOnPrimary,
    onSurface: Colors.secondary,
    onSurfaceVariant: Colors.secondary,
  },
};

function AuthNavigator({ onAuthSuccess }) {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login">
        {(props) => (
          <LoginScreen
            {...props}
            onLogin={onAuthSuccess}
            onSignUp={() => props.navigation.navigate("SignUp")}
            onForgotPassword={() => props.navigation.navigate("ForgotPassword")}
          />
        )}
      </AuthStack.Screen>
      <AuthStack.Screen name="SignUp">
        {(props) => (
          <SignUpScreen
            {...props}
            onLogin={onAuthSuccess}
            onBack={() => props.navigation.goBack()}
          />
        )}
      </AuthStack.Screen>
      <AuthStack.Screen name="ForgotPassword">
        {(props) => (
          <ForgotPasswordScreen
            {...props}
            onBack={() => props.navigation.goBack()}
          />
        )}
      </AuthStack.Screen>
    </AuthStack.Navigator>
  );
}

function MainTabs({ onLogout, userMode, setUserMode }) {
  const screens = [];

  if (userMode === "empresa" || userMode === "ambas") {
    screens.push(
      <Tab.Screen
        key="Empresas"
        name="Empresas"
        options={{
          title: "Empresas",
          tabBarIcon: ({ color }) => (
            <Ionicons name="business" color={color} size={moderateScale(28, 0.5)} />
          ),
        }}
        component={EmpresasScreen}
      />
    );
  }

  if (userMode === "cliente" || userMode === "ambas") {
    screens.push(
      <Tab.Screen
        key="Cliente"
        name="Cliente"
        options={{
          title: "Clientes",
          tabBarIcon: ({ color }) => (
            <Ionicons name="people" color={color} size={moderateScale(28, 0.5)} />
          ),
        }}
        component={ClienteScreen}
      />
    );
  }

  screens.push(
    <Tab.Screen
      key="Perfil"
      name="Perfil"
      options={{
        title: "Perfil",
        tabBarIcon: ({ color }) => (
          <Ionicons name="person" color={color} size={moderateScale(28, 0.5)} />
        ),
      }}
    >
      {(props) => <PerfilScreen {...props} onLogout={onLogout} userMode={userMode} setUserMode={setUserMode} />}
    </Tab.Screen>
  );

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.palette[2],
        tabBarInactiveTintColor: Colors.palette[3],
        tabBarStyle: {
          backgroundColor: Colors.palette[0],
          borderTopWidth: 0,
          elevation: 10,
          shadowColor: Colors.shadow,
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          height: verticalScale(60),
          paddingBottom: verticalScale(5),
          paddingTop: verticalScale(5),
        },
        tabBarLabelStyle: {
          fontSize: moderateScale(12, 0.5),
          fontWeight: "bold",
        },
      }}
    >
      {screens}
    </Tab.Navigator>
  );
}

export default function App() {
  const colorScheme = useColorScheme();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userMode, setUserMode] = useState("cliente");
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);
  const isDarkMode = colorScheme === "dark";

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const mode = await AsyncStorage.getItem("userMode");
        if (mode) {
          setUserMode(mode);
        }
        const seen = await AsyncStorage.getItem("hasSeenOnboarding");
        setHasSeenOnboarding(seen === "true");
      } catch (error) {
        console.warn("Failed to load user data", error);
      }
    };
    loadUserData();
  }, []);

  const paperTheme = useMemo(
    () => (isDarkMode ? paperDarkTheme : paperLightTheme),
    [isDarkMode]
  );

  const navigationTheme = isDarkMode ? DarkTheme : DefaultTheme;

  return (
    <PaperProvider theme={paperTheme}>
      <NavigationContainer theme={navigationTheme}>
        {isLoggedIn ? (
          hasSeenOnboarding ? (
            <MainTabs onLogout={() => setIsLoggedIn(false)} userMode={userMode} setUserMode={setUserMode} />
          ) : (
            <OnboardingScreen
              onComplete={async () => {
                setHasSeenOnboarding(true);
                await AsyncStorage.setItem("hasSeenOnboarding", "true");
              }}
            />
          )
        ) : (
          <AuthNavigator onAuthSuccess={() => setIsLoggedIn(true)} />
        )}
      </NavigationContainer>
    </PaperProvider>
  );
}
