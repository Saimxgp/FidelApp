import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import {
  BorderRadius,
  Colors,
  FontSizes,
  Layout,
  scale,
  Spacing,
} from "@/constants/styles";

const { width } = Dimensions.get("window");

const slides = [
  {
    id: 1,
    title: "¡Bienvenido a FidelApp!",
    description: "La app que revoluciona la fidelización de clientes. Crea promociones, registra sellos y canjea recompensas fácilmente.",
    icon: "sparkles",
  },
  {
    id: 2,
    title: "Para Empresas",
    description: "Registra tu empresa, crea promociones con sellos y gestiona a tus clientes. Escanea QR para agregar sellos automáticamente.",
    icon: "business",
  },
  {
    id: 3,
    title: "Para Clientes",
    description: "Recibe tarjetas de fidelización, acumula sellos y canjea premios. Comparte tu QR con las empresas para registrar visitas.",
    icon: "people",
  },
  {
    id: 4,
    title: "¡Comienza ahora!",
    description: "Elige tu modo de uso y disfruta de una experiencia personalizada. Puedes cambiar la configuración en cualquier momento.",
    icon: "checkmark-circle",
  },
];

export default function OnboardingScreen({ onComplete }) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const nextSlide = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      onComplete();
    }
  };

  const skip = () => {
    onComplete();
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={Colors.gradients.hero}
        style={styles.background}
      />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.slide}>
          <View style={styles.iconContainer}>
            <Ionicons
              name={slides[currentSlide].icon}
              size={scale(80)}
              color={Colors.textOnPrimary}
            />
          </View>
          <Text style={styles.title}>{slides[currentSlide].title}</Text>
          <Text style={styles.description}>
            {slides[currentSlide].description}
          </Text>
        </View>

        <View style={styles.indicators}>
          {slides.map((_, index) => (
            <View
              key={index}
              style={[
                styles.indicator,
                index === currentSlide && styles.activeIndicator,
              ]}
            />
          ))}
        </View>

        <View style={styles.buttons}>
          <Pressable style={styles.skipButton} onPress={skip}>
            <Text style={styles.skipText}>Omitir</Text>
          </Pressable>
          <Pressable style={styles.nextButton} onPress={nextSlide}>
            <Text style={styles.nextText}>
              {currentSlide === slides.length - 1 ? "Comenzar" : "Siguiente"}
            </Text>
            <Ionicons
              name="arrow-forward"
              size={20}
              color={Colors.textOnPrimary}
            />
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: Layout.screenPadding,
    paddingBottom: Spacing.xxl,
  },
  slide: {
    alignItems: "center",
    marginBottom: Spacing.xxl,
  },
  iconContainer: {
    width: scale(120),
    height: scale(120),
    borderRadius: scale(60),
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: FontSizes.xxl,
    color: Colors.textOnPrimary,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: Spacing.md,
  },
  description: {
    fontSize: FontSizes.md,
    color: Colors.textOnPrimary,
    textAlign: "center",
    lineHeight: FontSizes.md * 1.5,
  },
  indicators: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: Spacing.xl,
  },
  indicator: {
    width: scale(10),
    height: scale(10),
    borderRadius: scale(5),
    backgroundColor: "rgba(255, 255, 255, 0.5)",
    marginHorizontal: scale(5),
  },
  activeIndicator: {
    backgroundColor: Colors.textOnPrimary,
  },
  buttons: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  skipButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  skipText: {
    color: Colors.textOnPrimary,
    fontSize: FontSizes.md,
    fontWeight: "600",
  },
  nextButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
  },
  nextText: {
    color: Colors.textOnPrimary,
    fontSize: FontSizes.md,
    fontWeight: "700",
    marginRight: Spacing.sm,
  },
});