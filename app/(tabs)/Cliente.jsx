import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as SQLite from "expo-sqlite";
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import {
  BorderRadius,
  Colors,
  FontSizes,
  Layout,
  scale,
  Screen,
  Shadows,
  Spacing,
} from "@/constants/styles";

const DB_NAME = "fidelapp.db";
const CLIENT_TABLE = "client_profile";
const CARD_TABLE = "loyalty_cards";
const PROMO_TABLE = "promotions";
const CLIENT_CARD_TABLE = "client_cards_cache";
const DEFAULT_TOTAL_SLOTS = 10;
const DEFAULT_REWARD = "Producto gratuito";
const REQUIRED_CARD_COLUMNS = [
  "client_id",
  "promotion_id",
  "company_id",
  "promotion_name",
  "total_slots",
  "stamps",
  "reward",
];

const executeSql = async (db, query, params = []) => {
  if (query.trim().toUpperCase().startsWith("SELECT")) {
    return await db.getAllAsync(query, params);
  }

  await db.runAsync(query, params);
  return [];
};

const ensureLoyaltyTable = async (db) => {
  const columns = await executeSql(db, `PRAGMA table_info(${CARD_TABLE});`);
  const hasSchema =
    columns.length > 0 &&
    REQUIRED_CARD_COLUMNS.every((name) =>
      columns.some((column) => column.name === name)
    );

  if (!hasSchema) {
    await executeSql(db, `DROP TABLE IF EXISTS ${CARD_TABLE};`);
  }

  await executeSql(
    db,
    `CREATE TABLE IF NOT EXISTS ${CARD_TABLE} (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id TEXT NOT NULL,
      company_id TEXT NOT NULL,
      promotion_id TEXT NOT NULL,
      promotion_name TEXT,
      total_slots INTEGER NOT NULL,
      stamps INTEGER NOT NULL DEFAULT 0,
      reward TEXT,
      UNIQUE(client_id, promotion_id)
    );`
  );
};
  const ensureClientCacheTable = async (db) => {
    await executeSql(
      db,
      `CREATE TABLE IF NOT EXISTS ${CLIENT_CARD_TABLE} (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        client_id TEXT NOT NULL,
        promotion_id TEXT NOT NULL,
        company_id TEXT,
        promotion_name TEXT,
        reward TEXT,
        total_slots INTEGER NOT NULL,
        stamps INTEGER NOT NULL DEFAULT 0,
        end_date TEXT,
        last_synced_at TEXT,
        UNIQUE(client_id, promotion_id)
      );`
    );
  };

  const mapCardRowForDisplay = (row) => ({
    id: row.id,
    client_id: row.client_id,
    promotion_id: row.promotion_id,
    company_id: row.company_id,
    promotion_name: row.promotion_name,
    reward: row.reward,
    total_slots: row.total_slots,
    stamps: row.stamps,
    end_date: row.end_date ?? row.promotion_end_date ?? null,
  });

  const cleanupExpiredCards = async (db) => {
    await executeSql(
      db,
      `DELETE FROM ${CARD_TABLE}
       WHERE promotion_id IN (
         SELECT id FROM ${PROMO_TABLE}
         WHERE end_date IS NOT NULL AND DATE(end_date) < DATE('now')
       );`
    );

    await executeSql(
      db,
      `DELETE FROM ${CLIENT_CARD_TABLE}
       WHERE end_date IS NOT NULL AND DATE(end_date) < DATE('now');`
    );
  };

  const upsertCardCache = async (db, clientId, card) => {
    await executeSql(
      db,
      `INSERT INTO ${CLIENT_CARD_TABLE} (
        client_id,
        promotion_id,
        company_id,
        promotion_name,
        reward,
        total_slots,
        stamps,
        end_date,
        last_synced_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, DATE('now'))
      ON CONFLICT(client_id, promotion_id) DO UPDATE SET
        company_id = excluded.company_id,
        promotion_name = excluded.promotion_name,
        reward = excluded.reward,
        total_slots = excluded.total_slots,
        stamps = excluded.stamps,
        end_date = excluded.end_date,
        last_synced_at = excluded.last_synced_at;`,
      [
        clientId,
        card.promotion_id,
        card.company_id ?? null,
        card.promotion_name,
        card.reward,
        card.total_slots,
        card.stamps,
        card.end_date ?? null,
      ]
    );
  };


const ensureClientRecord = async (db) => {
  const clientRows = await executeSql(
    db,
    `SELECT * FROM ${CLIENT_TABLE} LIMIT 1;`
  );

  if (clientRows[0]) {
    return clientRows[0];
  }

  const generatedId = `CLIENT-${Date.now()}`;
  await executeSql(
    db,
    `INSERT INTO ${CLIENT_TABLE} (id, name, email) VALUES (?, ?, ?);`,
    [generatedId, "Cliente Demo", "cliente@example.com"]
  );

  return {
    id: generatedId,
    name: "Cliente Demo",
    email: "cliente@example.com",
  };
};

export default function Cliente() {
  const [isLoading, setIsLoading] = useState(true);
  const [client, setClient] = useState(null);
  const [cards, setCards] = useState([]);
  const [errorMessage, setErrorMessage] = useState(null);
  const [cardPreview, setCardPreview] = useState(null);
  const [isCardModalVisible, setIsCardModalVisible] = useState(false);
  const dbRef = useRef(null);

  const refreshClientState = useCallback(async () => {
    if (!dbRef.current) {
      return;
    }

    try {
      const db = dbRef.current;
      const clientRecord = await ensureClientRecord(db);

      await cleanupExpiredCards(db);

      const liveRows = await executeSql(
        db,
        `SELECT lc.*, p.end_date AS promotion_end_date
         FROM ${CARD_TABLE} lc
         LEFT JOIN ${PROMO_TABLE} p ON p.id = lc.promotion_id
         WHERE lc.client_id = ?
         ORDER BY lc.stamps DESC, lc.id DESC;`,
        [clientRecord.id]
      );

      let cardsToDisplay = liveRows.map(mapCardRowForDisplay);

      if (liveRows.length > 0) {
        await Promise.all(
          liveRows.map((row) => upsertCardCache(db, clientRecord.id, row))
        );
      } else {
        const cachedRows = await executeSql(
          db,
          `SELECT * FROM ${CLIENT_CARD_TABLE}
           WHERE client_id = ?
           ORDER BY stamps DESC, id DESC;`,
          [clientRecord.id]
        );
        cardsToDisplay = cachedRows.map(mapCardRowForDisplay);
      }

      setClient(clientRecord);
      setCards(cardsToDisplay);
      setErrorMessage(null);
    } catch (error) {
      console.warn("Failed to refresh client data", error);
      setErrorMessage("No se pudo cargar la información del cliente.");
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const bootstrap = async () => {
      try {
        const db = await SQLite.openDatabaseAsync(DB_NAME);
        dbRef.current = db;

        await executeSql(
          db,
          `CREATE TABLE IF NOT EXISTS ${CLIENT_TABLE} (
            id TEXT PRIMARY KEY NOT NULL,
            name TEXT,
            email TEXT
          );`
        );

        await ensureLoyaltyTable(db);
        await ensureClientCacheTable(db);

        if (!isMounted) {
          return;
        }

        await refreshClientState();

        if (isMounted) {
          setIsLoading(false);
        }
      } catch (error) {
        console.warn("Failed to load client data", error);
        if (isMounted) {
          setErrorMessage("No se pudo cargar la información del cliente.");
          setIsLoading(false);
        }
      }
    };

    bootstrap();

    return () => {
      isMounted = false;
    };
  }, [refreshClientState]);

  useFocusEffect(
    useCallback(() => {
      const fetchData = async () => {
        if (!dbRef.current) {
          try {
            const db = await SQLite.openDatabaseAsync(DB_NAME);
            dbRef.current = db;
            await executeSql(
              db,
              `CREATE TABLE IF NOT EXISTS ${CLIENT_TABLE} (
                id TEXT PRIMARY KEY NOT NULL,
                name TEXT,
                email TEXT
              );`
            );
            await ensureLoyaltyTable(db);
            await ensureClientCacheTable(db);
          } catch (error) {
            console.warn("Failed to reopen database", error);
            return;
          }
        }

        refreshClientState();
      };

      fetchData();
    }, [refreshClientState])
  );

  const qrValue = useMemo(() => client?.id ?? "", [client?.id]);
  const hasCards = cards.length > 0;
  const templateCard = useMemo(
    () => ({
      id: "preview",
      promotion_name: "Tu próxima promoción",
      reward: DEFAULT_REWARD,
      total_slots: DEFAULT_TOTAL_SLOTS,
      stamps: 0,
      end_date: null,
    }),
    []
  );
  const openCardPreview = useCallback(
    (cardData) => {
      setCardPreview(cardData ?? templateCard);
      setIsCardModalVisible(true);
    },
    [templateCard]
  );
  const closeCardPreview = useCallback(() => {
    setIsCardModalVisible(false);
  }, []);
  const activePreviewCard = cardPreview ?? templateCard;
  const previewTotalSlots = Math.max(
    activePreviewCard.total_slots || DEFAULT_TOTAL_SLOTS,
    1
  );
  const previewStamps = Math.max(0, activePreviewCard.stamps || 0);
  const previewComplete = previewStamps >= previewTotalSlots;

  if (isLoading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loaderText}>
          Cargando información del cliente...
        </Text>
      </View>
    );
  }

  if (errorMessage) {
    return (
      <View style={styles.loaderContainer}>
        <Text style={styles.errorText}>{errorMessage}</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <LinearGradient
          colors={Colors.gradients.hero}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <Text style={styles.heroTitle}>
            {client ? `¡Hola, ${client.name}!` : "¡Bienvenido a FidelApp!"}
          </Text>
          <Text style={styles.heroSubtitle}>
            Gestiona tus sellos y canjea tus recompensas favoritas en segundos.
          </Text>
        </LinearGradient>

        <View style={styles.cardSurface}>
          <Text style={styles.sectionTitle}>Mi código QR</Text>
          <Text style={styles.sectionDescription}>
            Comparte este código con la empresa para registrar tus sellos.
          </Text>
          {qrValue ? (
            <View style={styles.qrWrapper}>
              <Image
                source={{
                  uri: `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
                    qrValue
                  )}`,
                }}
                style={styles.qrImage}
              />
            </View>
          ) : null}
          {client ? (
            <View style={styles.clientInfo}>
              <Text style={styles.clientName}>{client.name}</Text>
              {client.email ? (
                <Text style={styles.clientEmail}>{client.email}</Text>
              ) : null}
              <Text style={styles.clientIdLabel}>Identificador:</Text>
              <Text style={styles.clientIdValue}>{client.id}</Text>
            </View>
          ) : null}
          <Text style={styles.helperMessage}>
            Presenta este código a la empresa. Cuando escaneen tu QR, tu tarjeta
            se actualizará automáticamente.
          </Text>
        </View>

        <View style={styles.cardSurface}>
          <Text style={styles.sectionTitle}>Tarjetas activas</Text>
          <Text style={styles.sectionDescription}>
            Aquí verás cada promoción donde has acumulado sellos. Mientras más
            compactas sean, más fácil será revisar varias empresas.
          </Text>
          {hasCards ? (
            cards.map((item) => {
              const total = Math.max(item.total_slots || DEFAULT_TOTAL_SLOTS, 1);
              const stamps = Math.max(0, item.stamps || 0);
              const progress = Math.min(100, Math.round((stamps / total) * 100));
              const completed = stamps >= total;
              const iconColor = completed ? "#10B981" : Colors.primary;

              return (
                <Pressable
                  key={`${item.id}-${item.promotion_id}`}
                  style={({ pressed }) => [
                    styles.compactCard,
                    pressed && styles.compactCardPressed,
                  ]}
                  onPress={() => openCardPreview(item)}
                >
                  <View style={styles.compactHeader}>
                    <Ionicons
                      name={completed ? "ribbon" : "pricetag"}
                      size={20}
                      color={iconColor}
                      style={styles.compactIcon}
                    />
                    <View style={styles.compactHeaderText}>
                      <Text style={styles.compactTitle}>
                        {item.promotion_name || "Promoción sin título"}
                      </Text>
                      <Text style={styles.compactSubtitle}>
                        {item.reward ? `Premio: ${item.reward}` : "Recompensa pendiente"}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.compactProgressTrack}>
                    <View
                      style={[
                        styles.compactProgressFill,
                        { width: `${progress}%` },
                      ]}
                    />
                  </View>
                  <View style={styles.compactStatsRow}>
                    <Text style={styles.compactStatsText}>
                      Sellos {stamps}/{total}
                    </Text>
                    <Text
                      style={
                        completed
                          ? styles.compactStatusDone
                          : styles.compactStatusPending
                      }
                    >
                      {completed
                        ? "Lista para canjear"
                        : `${Math.max(total - stamps, 0)} por completar`}
                    </Text>
                  </View>
                  {item.end_date ? (
                    <Text style={styles.compactExpiry}>
                      Vence: {item.end_date}
                    </Text>
                  ) : null}
                </Pressable>
              );
            })
          ) : (
            <>
              <Pressable
                style={({ pressed }) => [
                  styles.compactCard,
                  pressed && styles.compactCardPressed,
                ]}
                onPress={() => openCardPreview(templateCard)}
              >
                <View style={styles.compactHeader}>
                  <Ionicons
                    name="sparkles"
                    size={20}
                    color={Colors.primary}
                    style={styles.compactIcon}
                  />
                  <View style={styles.compactHeaderText}>
                    <Text style={styles.compactTitle}>{templateCard.promotion_name}</Text>
                    <Text style={styles.compactSubtitle}>
                      Premio: {templateCard.reward}
                    </Text>
                  </View>
                </View>
                <View style={styles.compactProgressTrack}>
                  <View style={[styles.compactProgressFill, { width: "0%" }]} />
                </View>
                <View style={styles.compactStatsRow}>
                  <Text style={styles.compactStatsText}>
                    Sellos {templateCard.stamps}/{templateCard.total_slots}
                  </Text>
                  <Text style={styles.compactStatusPending}>¡Comienza escaneando!</Text>
                </View>
              </Pressable>
              <Text style={styles.helperMessage}>
                Cuando una empresa escanee tu QR, tu primera tarjeta aparecerá en esta
                lista y se irá llenando automáticamente.
              </Text>
            </>
          )}
        </View>
      </ScrollView>

      <Modal
        visible={isCardModalVisible}
        transparent
        animationType="fade"
        onRequestClose={closeCardPreview}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.previewModalContent}>
            <Text style={styles.previewModalTitle}>
              {activePreviewCard.promotion_name || "Promoción"}
            </Text>
            <Text style={styles.previewModalSubtitle}>
              Sellos {previewStamps}/{previewTotalSlots}
              {" · "}
              {previewComplete ? "¡Completada!" : "En progreso"}
            </Text>
            {activePreviewCard.end_date ? (
              <Text style={styles.previewModalHelper}>
                Válida hasta: {activePreviewCard.end_date}
              </Text>
            ) : null}
            <View style={styles.stampGrid}>
              {Array.from({ length: previewTotalSlots }).map((_, index) => {
                const filled = index < previewStamps;
                return (
                  <View
                    key={`preview-slot-${index}`}
                    style={[styles.stampSlot, filled && styles.stampSlotFilled]}
                  >
                    <Text
                      style={
                        filled ? styles.stampSlotTextFilled : styles.stampSlotText
                      }
                    >
                      {filled ? "★" : index + 1}
                    </Text>
                  </View>
                );
              })}
            </View>
            <Text style={styles.previewModalHelper}>
              Premio: {activePreviewCard.reward || DEFAULT_REWARD}
            </Text>
            <Pressable
              style={({ pressed }) => [
                styles.previewModalClose,
                pressed && styles.previewModalClosePressed,
              ]}
              onPress={closeCardPreview}
            >
              <Text style={styles.previewModalCloseText}>Cerrar</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: Layout.screenPadding,
    paddingBottom: Spacing.xxl,
  },
  heroCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadows.medium,
  },
  heroTitle: {
    fontSize: FontSizes.xl,
    color: Colors.textOnPrimary,
    fontWeight: "700",
    marginBottom: Spacing.xs,
  },
  heroSubtitle: {
    fontSize: FontSizes.sm,
    color: Colors.textOnPrimary,
    lineHeight: FontSizes.sm * 1.6,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Layout.screenPadding,
    backgroundColor: Colors.background,
  },
  loaderText: {
    marginTop: Spacing.md,
    fontSize: FontSizes.md,
    color: Colors.text,
    textAlign: "center",
  },
  errorText: {
    fontSize: FontSizes.md,
    color: Colors.error,
    textAlign: "center",
  },
  cardSurface: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    ...Shadows.light,
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: FontSizes.xl,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  sectionDescription: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    marginBottom: Spacing.lg,
  },
  qrWrapper: {
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  qrImage: {
    width: 220,
    height: 220,
    borderRadius: 16,
  },
  clientInfo: {
    marginBottom: Spacing.md,
    alignItems: "center",
  },
  clientName: {
    fontSize: FontSizes.lg,
    color: Colors.text,
    fontWeight: "600",
  },
  clientEmail: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
  },
  clientIdLabel: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    marginTop: Spacing.md,
  },
  clientIdValue: {
    fontSize: FontSizes.sm,
    color: Colors.text,
    fontWeight: "600",
  },
  helperMessage: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    textAlign: "center",
    marginTop: Spacing.md,
  },
  compactCard: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    backgroundColor: Colors.backgroundAlt,
  },
  compactHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  compactIcon: {
    marginRight: Spacing.sm,
  },
  compactHeaderText: {
    flex: 1,
  },
  compactTitle: {
    fontSize: FontSizes.md,
    color: Colors.text,
    fontWeight: "600",
  },
  compactSubtitle: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
  },
  compactProgressTrack: {
    height: scale(8),
    borderRadius: BorderRadius.round,
    backgroundColor: Colors.border,
    overflow: "hidden",
    marginBottom: Spacing.sm,
  },
  compactProgressFill: {
    height: "100%",
    borderRadius: BorderRadius.round,
    backgroundColor: Colors.primary,
  },
  compactStatsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  compactStatsText: {
    fontSize: FontSizes.sm,
    color: Colors.text,
    fontWeight: "600",
  },
  compactStatusPending: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    fontWeight: "600",
  },
  compactStatusDone: {
    fontSize: FontSizes.xs,
    color: "#10B981",
    fontWeight: "700",
  },
  compactExpiry: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
  },
  compactCardPressed: {
    opacity: 0.9,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.lg,
  },
  previewModalContent: {
    width: Screen.widthPercent(100),
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.card,
    padding: Spacing.lg,
    ...Shadows.medium,
  },
  previewModalTitle: {
    fontSize: FontSizes.lg,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: Spacing.xs,
    textAlign: "center",
  },
  previewModalSubtitle: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    textAlign: "center",
    marginBottom: Spacing.md,
  },
  previewModalHelper: {
    fontSize: FontSizes.sm,
    color: Colors.text,
    textAlign: "center",
    marginBottom: Spacing.lg,
  },
  previewModalClose: {
    borderRadius: BorderRadius.round,
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.sm,
    alignItems: "center",
  },
  previewModalClosePressed: {
    opacity: 0.85,
  },
  previewModalCloseText: {
    color: Colors.textOnPrimary,
    fontSize: FontSizes.md,
    fontWeight: "700",
  },
  stampGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: Spacing.md,
  },
  stampSlot: {
    width: "30%",
    aspectRatio: 1,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.sm,
    backgroundColor: Colors.backgroundAlt,
  },
  stampSlotFilled: {
    backgroundColor: Colors.background,
    borderColor: Colors.primary,
  },
  stampSlotText: {
    fontSize: FontSizes.lg,
    color: Colors.text,
    fontWeight: "600",
  },
  stampSlotTextFilled: {
    fontSize: FontSizes.lg,
    color: Colors.primary,
    fontWeight: "700",
  },
});
