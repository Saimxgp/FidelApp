import {
  BorderRadius,
  Colors,
  FontSizes,
  Layout,
  Shadows,
  Spacing,
} from "@/constants/styles";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import React, { useMemo, useState } from "react";
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  Button,
  Divider,
  HelperText,
  Surface,
  TextInput,
  useTheme,
} from "react-native-paper";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";

const createIcon = (name, fallbackColor = Colors.primary) => (props = {}) => (
  <MaterialCommunityIcons
    name={name}
    size={props.size ?? 20}
    color={props.color ?? fallbackColor}
  />
);

export default function LoginScreen({ onLogin, onSignUp, onForgotPassword }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const theme = useTheme();
  const inputTheme = useMemo(
    () => ({
      roundness: BorderRadius.lg,
      colors: {
        background: Colors.backgroundAlt,
        primary: Colors.primary,
        placeholder: Colors.textMuted,
        text: Colors.text,
        outline: Colors.border,
      },
    }),
    []
  );

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const emailFormatError = email && !emailRegex.test(email) ? "Ingresa un correo válido" : "";
  const emailEmptyError = submitted && !email ? "Ingresa tu correo" : "";
  const emailError = emailFormatError || emailEmptyError;

  const passwordLengthError =
    password && password.length < 6 ? "La contraseña debe tener al menos 6 caracteres" : "";
  const passwordEmptyError = submitted && !password ? "Ingresa tu contraseña" : "";
  const passwordError = passwordLengthError || passwordEmptyError;

  const isFormValid = emailRegex.test(email) && password.length >= 6;

  const handleLogin = () => {
    setSubmitted(true);

    if (!isFormValid) {
      Alert.alert("Revisa los campos", "Por favor corrige los campos marcados en rojo");
      return;
    }

    onLogin();
  };

  const handleForgotPassword = () => {
    onForgotPassword();
  };

  const handleSignUp = () => {
    onSignUp();
  };

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <LinearGradient
        colors={Colors.gradients.hero}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <View style={styles.heroContent}>
          <View style={styles.heroLogoWrapper}>
            <Image source={require("@/assets/images/icon.png")} style={styles.heroLogo} />
          </View>
          <Text style={styles.heroTitle}>¡Bienvenido de nuevo!</Text>
          <Text style={styles.heroSubtitle}>
            Encuentra rápidamente las recompensas que más te gustan.
          </Text>
        </View>
      </LinearGradient>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Surface style={styles.card} elevation={4}>
          <Text style={styles.title}>Inicia sesión</Text>
          <Text style={styles.subtitle}>
            Ingresa con tus datos para continuar disfrutando de FidelApp.
          </Text>
          <TextInput
            mode="outlined"
            label="Correo electrónico"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            left={<TextInput.Icon icon="email-outline" color={Colors.primary} />}
            outlineColor={Colors.border}
            activeOutlineColor={Colors.primary}
            textColor={Colors.text}
            style={styles.input}
            contentStyle={styles.inputContent}
            error={!!emailError}
            returnKeyType="next"
            theme={inputTheme}
          />
          <HelperText type="error" visible={!!emailError}>
            {emailError || " "}
          </HelperText>
          <TextInput
            mode="outlined"
            label="Contraseña"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!passwordVisible}
            left={<TextInput.Icon icon="lock-outline" color={Colors.primary} />}
            right={
              <TextInput.Icon
                icon={(props) => (
                  <MaterialCommunityIcons
                    name={passwordVisible ? "eye-off-outline" : "eye-outline"}
                    size={props?.size ?? 20}
                    color={props?.color ?? Colors.primary}
                  />
                )}
                onPress={() => setPasswordVisible((prev) => !prev)}
              />
            }
            outlineColor={Colors.border}
            activeOutlineColor={Colors.primary}
            textColor={Colors.text}
            style={styles.input}
            contentStyle={styles.inputContent}
            error={!!passwordError}
            returnKeyType="done"
            theme={inputTheme}
          />
          <HelperText type="error" visible={!!passwordError}>
            {passwordError || " "}
          </HelperText>
          <Button
            mode="text"
            onPress={handleForgotPassword}
            textColor={Colors.primary}
            contentStyle={styles.linkButtonContent}
            labelStyle={styles.linkButtonLabel}
          >
            ¿Olvidaste tu contraseña?
          </Button>
          <Button
            mode="contained"
            icon="login"
            onPress={handleLogin}
            style={styles.primaryButton}
            contentStyle={styles.primaryButtonContent}
            disabled={!isFormValid}
          >
            Iniciar sesión
          </Button>
          <View style={styles.dividerRow}>
            <Divider style={styles.dividerLine} bold color={theme.colors.outlineVariant} />
            <Text style={styles.dividerText}>o continúa con</Text>
            <Divider style={styles.dividerLine} bold color={theme.colors.outlineVariant} />
          </View>
          <Button
            mode="outlined"
            icon={createIcon("google", Colors.primary)}
            onPress={() => Alert.alert("Próximamente", "Disponible en breve")}
            style={styles.socialButton}
            contentStyle={styles.socialButtonContent}
          >
            Continuar con Google
          </Button>
        </Surface>
        <TouchableOpacity onPress={handleSignUp} style={styles.footerLink}>
          <Text style={styles.footerText}>
            ¿Aún no tienes cuenta? <Text style={styles.footerHighlight}>Regístrate</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  hero: {
    paddingTop: Layout.screenPadding * 2,
    paddingBottom: Layout.screenPadding * 3,
    paddingHorizontal: Layout.screenPadding,
    borderBottomLeftRadius: BorderRadius.xl * 2,
    borderBottomRightRadius: BorderRadius.xl * 2,
  },
  heroContent: {
    alignItems: "center",
  },
  heroLogoWrapper: {
    width: Layout.logoSize * 0.85,
    height: Layout.logoSize * 0.85,
    borderRadius: BorderRadius.round,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  heroLogo: {
    width: Layout.logoSize * 0.5,
    height: Layout.logoSize * 0.5,
    tintColor: Colors.textOnPrimary,
  },
  heroTitle: {
    fontSize: FontSizes.xxl,
    color: Colors.textOnPrimary,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: Spacing.xs,
  },
  heroSubtitle: {
    fontSize: FontSizes.md,
    color: Colors.textOnPrimary,
    textAlign: "center",
    lineHeight: FontSizes.md * 1.4,
  },
  content: {
    paddingHorizontal: Layout.screenPadding,
    paddingBottom: Spacing.xl,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    gap: Spacing.sm,
    ...Shadows.medium,
  },
  title: {
    fontSize: FontSizes.xl,
    marginBottom: Spacing.xs,
    color: Colors.text,
    fontWeight: "700",
    textAlign: "left",
  },
  subtitle: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    marginBottom: Spacing.lg,
    lineHeight: FontSizes.sm * 1.6,
  },
  input: {
    marginBottom: Spacing.xs,
    backgroundColor: Colors.backgroundAlt,
    borderRadius: BorderRadius.lg,
  },
  inputContent: {
    height: Layout.inputHeight,
  },
  linkButtonContent: {
    justifyContent: "flex-end",
  },
  linkButtonLabel: {
    fontSize: FontSizes.sm,
    fontWeight: "600",
  },
  primaryButton: {
    borderRadius: BorderRadius.round,
    marginTop: Spacing.sm,
  },
  primaryButtonContent: {
    height: Layout.buttonHeight,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: Spacing.lg,
    gap: Spacing.sm,
  },
  dividerLine: {
    flex: 1,
  },
  dividerText: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 1,
    fontWeight: "600",
  },
  socialButton: {
    borderRadius: BorderRadius.round,
  },
  socialButtonContent: {
    height: Layout.buttonHeight,
  },
  footerLink: {
    marginTop: Spacing.lg,
    alignItems: "center",
  },
  footerText: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
  },
  footerHighlight: {
    color: Colors.primary,
    fontWeight: "600",
  },
});
