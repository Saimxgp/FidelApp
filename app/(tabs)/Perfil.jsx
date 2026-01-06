import {
  BorderRadius,
  Colors,
  FontSizes,
  Layout,
  Shadows,
  Spacing,
} from "@/constants/styles";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

const PROFILE = {
  name: "Mariana Velázquez",
  email: "mariana.velazquez@example.com",
  phone: "+52 55 1234 5678",
  tier: "Cliente premium",
  points: 1280,
  stamps: 34,
};

export default function Perfil({ onLogout = () => {} }) {
  return (
    <View style={styles.screen}>
      <LinearGradient
        colors={Colors.gradients.hero}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <View style={styles.avatarWrapper}>
          <Image
            source={require("@/assets/images/icon.png")}
            style={styles.avatar}
            defaultSource={require("@/assets/images/icon.png")}
          />
        </View>
        <Text style={styles.heroName}>{PROFILE.name}</Text>
        <Text style={styles.heroMeta}>{PROFILE.tier}</Text>
        <View style={styles.heroStats}>
          <View style={styles.statItem}>
            <Ionicons name="trophy" size={20} color={Colors.textOnPrimary} />
            <Text style={styles.statLabel}>Puntos</Text>
            <Text style={styles.statValue}>{PROFILE.points}</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="star" size={20} color={Colors.textOnPrimary} />
            <Text style={styles.statLabel}>Sellos</Text>
            <Text style={styles.statValue}>{PROFILE.stamps}</Text>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Información personal</Text>
        <View style={styles.infoRow}>
          <Ionicons name="mail" size={18} color={Colors.primary} />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Correo electrónico</Text>
            <Text style={styles.infoValue}>{PROFILE.email}</Text>
          </View>
        </View>
        <View style={styles.divider} />
        <View style={styles.infoRow}>
          <Ionicons name="call" size={18} color={Colors.primary} />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Teléfono</Text>
            <Text style={styles.infoValue}>{PROFILE.phone}</Text>
          </View>
        </View>
      </View>

      <Pressable
        style={({ pressed }) => [
          styles.secondaryButton,
          pressed && styles.secondaryButtonPressed,
        ]}
        onPress={onLogout}
      >
        <LinearGradient
          colors={Colors.gradients.button}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.secondaryButtonGradient}
        >
          <Ionicons
            name="log-out"
            size={20}
            color={Colors.textOnPrimary}
            style={styles.buttonIcon}
          />
          <Text style={styles.secondaryButtonText}>Cerrar sesión</Text>
        </LinearGradient>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: Layout.screenPadding,
  },
  hero: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    alignItems: "center",
    ...Shadows.medium,
  },
  avatarWrapper: {
    width: Layout.logoSize * 0.7,
    height: Layout.logoSize * 0.7,
    borderRadius: BorderRadius.round,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  avatar: {
    width: Layout.logoSize * 0.4,
    height: Layout.logoSize * 0.4,
    tintColor: Colors.textOnPrimary,
  },
  heroName: {
    fontSize: FontSizes.xl,
    color: Colors.textOnPrimary,
    fontWeight: "700",
    marginBottom: Spacing.xs,
  },
  heroMeta: {
    fontSize: FontSizes.sm,
    color: Colors.textOnPrimary,
    opacity: 0.9,
  },
  heroStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: Spacing.lg,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statLabel: {
    marginTop: Spacing.xs,
    fontSize: FontSizes.xs,
    color: Colors.textOnPrimary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  statValue: {
    marginTop: Spacing.xs,
    fontSize: FontSizes.lg,
    color: Colors.textOnPrimary,
    fontWeight: "700",
  },
  card: {
    marginTop: Spacing.lg,
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    ...Shadows.light,
  },
  cardTitle: {
    fontSize: FontSizes.lg,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  infoContent: {
    marginLeft: Spacing.md,
  },
  infoLabel: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  infoValue: {
    fontSize: FontSizes.md,
    color: Colors.text,
    marginTop: Spacing.xs,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.md,
  },
  secondaryButton: {
    marginTop: Spacing.xl,
    borderRadius: BorderRadius.round,
    overflow: "hidden",
    ...Shadows.light,
  },
  secondaryButtonPressed: {
    opacity: 0.95,
    transform: [{ scale: 0.99 }],
  },
  secondaryButtonGradient: {
    paddingVertical: Spacing.md,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  buttonIcon: {
    marginRight: Spacing.sm,
  },
  secondaryButtonText: {
    color: Colors.textOnPrimary,
    fontSize: FontSizes.md,
    fontWeight: "700",
  },
});
