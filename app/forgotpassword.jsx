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
  HelperText,
  Surface,
  TextInput,
} from "react-native-paper";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";

const createIcon = (name, fallbackColor = Colors.primary) => (props = {}) => (
  <MaterialCommunityIcons
    name={name}
    size={props.size ?? 20}
    color={props.color ?? fallbackColor}
  />
);

export default function ForgotPasswordScreen({ onBack }) {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
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
  const isFormValid = emailRegex.test(email);

  const handleSendRecovery = () => {
    setSubmitted(true);

    if (!isFormValid) {
      Alert.alert("Revisa el correo", "Necesitamos un correo válido para continuar");
      return;
    }

    Alert.alert(
      "Email enviado",
      "Te hemos enviado un enlace seguro para restablecer tu contraseña.",
      [{ text: "Entendido", onPress: onBack }]
    );
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
          <Text style={styles.heroTitle}>¿Olvidaste tu contraseña?</Text>
          <Text style={styles.heroSubtitle}>
            Recupera el acceso en un par de pasos. Te enviaremos un enlace seguro.
          </Text>
        </View>
      </LinearGradient>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Surface style={styles.card} elevation={4}>
          <Text style={styles.title}>Enviar instrucciones</Text>
          <Text style={styles.description}>
            Ingresa el correo asociado a tu cuenta para recibir el enlace de recuperación.
          </Text>
          <TextInput
            mode="outlined"
            label="Correo electrónico"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            left={<TextInput.Icon icon={createIcon("email-arrow-left")} />}
            outlineColor={Colors.border}
            activeOutlineColor={Colors.primary}
            textColor={Colors.text}
            style={styles.input}
            contentStyle={styles.inputContent}
            error={!!emailError}
            theme={inputTheme}
          />
          <HelperText type="error" visible={!!emailError}>
            {emailError || " "}
          </HelperText>
          <Button
            mode="contained"
            icon={createIcon("email-send", Colors.textOnPrimary)}
            onPress={handleSendRecovery}
            style={styles.primaryButton}
            contentStyle={styles.primaryButtonContent}
            disabled={!isFormValid}
          >
            Enviar enlace
          </Button>
          <Button
            mode="text"
            onPress={onBack}
            textColor={Colors.primary}
            labelStyle={styles.backLabel}
            icon={createIcon("arrow-left", Colors.primary)}
            contentStyle={styles.backButtonContent}
          >
            Volver al inicio de sesión
          </Button>
        </Surface>
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
    width: Layout.logoSize * 0.8,
    height: Layout.logoSize * 0.8,
    borderRadius: BorderRadius.round,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  heroLogo: {
    width: Layout.logoSize * 0.45,
    height: Layout.logoSize * 0.45,
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
    fontSize: FontSizes.sm,
    color: Colors.textOnPrimary,
    textAlign: "center",
    lineHeight: FontSizes.sm * 1.6,
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
  },
  description: {
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
  backLabel: {
    fontSize: FontSizes.sm,
    fontWeight: "600",
  },
  backButtonContent: {
    height: Layout.buttonHeight * 0.6,
  },
});