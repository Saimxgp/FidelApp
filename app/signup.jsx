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

export default function SignUpScreen({ onLogin, onBack }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
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
  const nameError = submitted && !name ? "Ingresa tu nombre completo" : "";
  const emailFormatError = email && !emailRegex.test(email) ? "Ingresa un correo válido" : "";
  const emailEmptyError = submitted && !email ? "Ingresa tu correo" : "";
  const emailError = emailFormatError || emailEmptyError;

  const passwordLengthError =
    password && password.length < 6 ? "La contraseña debe tener al menos 6 caracteres" : "";
  const passwordEmptyError = submitted && !password ? "Crea una contraseña" : "";
  const passwordError = passwordLengthError || passwordEmptyError;

  const confirmMismatchError =
    confirmPassword && confirmPassword !== password ? "Las contraseñas no coinciden" : "";
  const confirmEmptyError = submitted && !confirmPassword ? "Confirma tu contraseña" : "";
  const confirmError = confirmMismatchError || confirmEmptyError;

  const isFormValid =
    !!name && emailRegex.test(email) && password.length >= 6 && confirmPassword === password;

  const handleSignUp = () => {
    setSubmitted(true);

    if (!isFormValid) {
      Alert.alert("Revisa los campos", "Por favor corrige la información resaltada");
      return;
    }

    Alert.alert("Cuenta creada", "Tu cuenta ha sido creada exitosamente", [
      { text: "Ir al inicio", onPress: onLogin },
    ]);
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
          <Text style={styles.heroTitle}>Crea tu cuenta</Text>
          <Text style={styles.heroSubtitle}>
            Gestiona tus recompensas desde una experiencia fresca y moderna.
          </Text>
        </View>
      </LinearGradient>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Surface style={styles.card} elevation={4}>
          <Text style={styles.title}>Información personal</Text>
          <Text style={styles.subtitle}>
            Completa los campos para comenzar a acumular beneficios.
          </Text>
          <TextInput
            mode="outlined"
            label="Nombre completo"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            left={<TextInput.Icon icon={createIcon("account-circle-outline")} />}
            style={styles.input}
            error={!!nameError}
            outlineColor={Colors.border}
            activeOutlineColor={Colors.primary}
            textColor={Colors.text}
            contentStyle={styles.inputContent}
            theme={inputTheme}
          />
          <HelperText type="error" visible={!!nameError}>
            {nameError || " "}
          </HelperText>
          <TextInput
            mode="outlined"
            label="Correo electrónico"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            left={<TextInput.Icon icon={createIcon("email-outline")} />}
            style={styles.input}
            error={!!emailError}
            outlineColor={Colors.border}
            activeOutlineColor={Colors.primary}
            textColor={Colors.text}
            contentStyle={styles.inputContent}
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
            left={<TextInput.Icon icon={createIcon("lock-outline")} />}
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
            style={styles.input}
            error={!!passwordError}
            outlineColor={Colors.border}
            activeOutlineColor={Colors.primary}
            textColor={Colors.text}
            contentStyle={styles.inputContent}
            theme={inputTheme}
          />
          <HelperText type="error" visible={!!passwordError}>
            {passwordError || " "}
          </HelperText>
          <TextInput
            mode="outlined"
            label="Confirmar contraseña"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!confirmVisible}
            left={<TextInput.Icon icon={createIcon("lock-check-outline")} />}
            right={
              <TextInput.Icon
                icon={(props) => (
                  <MaterialCommunityIcons
                    name={confirmVisible ? "eye-off-outline" : "eye-outline"}
                    size={props?.size ?? 20}
                    color={props?.color ?? Colors.primary}
                  />
                )}
                onPress={() => setConfirmVisible((prev) => !prev)}
              />
            }
            style={styles.input}
            error={!!confirmError}
            outlineColor={Colors.border}
            activeOutlineColor={Colors.primary}
            textColor={Colors.text}
            contentStyle={styles.inputContent}
            theme={inputTheme}
          />
          <HelperText type="error" visible={!!confirmError}>
            {confirmError || " "}
          </HelperText>
          <Button
            mode="contained"
            icon={createIcon("account-plus", Colors.textOnPrimary)}
            onPress={handleSignUp}
            style={styles.primaryButton}
            contentStyle={styles.primaryButtonContent}
            disabled={!isFormValid}
          >
            Crear cuenta
          </Button>
          <View style={styles.dividerRow}>
            <Divider style={styles.dividerLine} bold color={theme.colors.outlineVariant} />
            <Text style={styles.dividerText}>o registra con</Text>
            <Divider style={styles.dividerLine} bold color={theme.colors.outlineVariant} />
          </View>
          <Button
            mode="outlined"
            icon={createIcon("google", Colors.primary)}
            onPress={() => Alert.alert("Próximamente", "Disponible en breve")}
            style={styles.socialButton}
            contentStyle={styles.socialButtonContent}
            textColor={Colors.primary}
          >
            Continuar con Google
          </Button>
        </Surface>
        <Button
          mode="text"
          onPress={onBack}
          textColor={Colors.primary}
          labelStyle={styles.footerLabel}
          icon={createIcon("arrow-left", Colors.primary)}
          contentStyle={styles.backButtonContent}
        >
          ¿Ya tienes cuenta? Inicia sesión
        </Button>
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
    paddingBottom: Layout.screenPadding * 2.5,
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
    color: Colors.text,
    fontWeight: "700",
    marginBottom: Spacing.xs,
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
  footerLabel: {
    fontSize: FontSizes.sm,
    fontWeight: "600",
  },
  backButtonContent: {
    height: Layout.buttonHeight * 0.6,
  },
});