/**
 * Style constants for colors, measurements, and other design tokens.
 */

import { Dimensions } from "react-native";

const { width: screenWidth } = Dimensions.get("window");

// Scale function for responsive sizing
export const scale = (size) => (screenWidth / 375) * size; // Base width 375 (iPhone 6/7/8)

export const Colors = {
  primary: "#0FA3B1",
  secondary: "#ECFFFD",
  accent: "#2DD9C5",
  success: "#4CAF50",
  error: "#FF6B6B",
  warning: "#F7B801",
  text: "#0F2F2E",
  textMuted: "#3F6F6D",
  textOnPrimary: "#F3FEFD",
  background: "#E8F9F7",
  backgroundAlt: "#F6FFFE",
  card: "#FFFFFF",
  border: "#CDEDEA",
  shadow: "rgba(15, 163, 177, 0.25)",
  palette: ["#0FA3B1", "#13C4C2", "#2DD9C5", "#9FEFE0"],
  gradients: {
    hero: ["#0FA3B1", "#13C4C2"],
    button: ["#0FA3B1", "#2DD9C5"],
    accent: ["#13C4C2", "#9FEFE0"],
  },
};

export const Spacing = {
  xs: scale(4),
  sm: scale(8),
  md: scale(16),
  lg: scale(24),
  xl: scale(32),
  xxl: scale(48),
};

export const FontSizes = {
  xs: scale(12),
  sm: scale(14),
  md: scale(16),
  lg: scale(18),
  xl: scale(20),
  xxl: scale(24),
  xxxl: scale(32),
};

export const BorderRadius = {
  sm: scale(4),
  md: scale(8),
  lg: scale(12),
  xl: scale(16),
  round: scale(50),
};

export const Shadows = {
  light: {
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 3,
  },
  medium: {
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 6,
  },
  heavy: {
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
};

export const Layout = {
  screenPadding: scale(Spacing.md),
  containerPadding: scale(Spacing.lg),
  buttonHeight: scale(48),
  inputHeight: scale(40),
  borderWidth: 1,
  logoSize: scale(100),
};
