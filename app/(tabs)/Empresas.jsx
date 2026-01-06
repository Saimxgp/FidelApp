import { useEffect, useMemo, useRef, useState } from "react";
import * as SQLite from "expo-sqlite";
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
import { CameraView, useCameraPermissions } from "expo-camera";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { Picker } from "@react-native-picker/picker";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

const DISABLED_GRADIENT = ["#AACFCB", "#AACFCB"];
const DB_NAME = "fidelapp.db";
const COMPANY_TABLE = "companies";
const PROMO_TABLE = "promotions";
const CARD_TABLE = "loyalty_cards";

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

const ensureTables = async (db) => {
  await executeSql(
    db,
    `CREATE TABLE IF NOT EXISTS ${COMPANY_TABLE} (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      contact_email TEXT
    );`
  );

  await executeSql(
    db,
    `CREATE TABLE IF NOT EXISTS ${PROMO_TABLE} (
      id TEXT PRIMARY KEY NOT NULL,
      company_id TEXT NOT NULL,
      company_name TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      discount TEXT,
      start_date TEXT,
      end_date TEXT,
      type TEXT,
      required_stamps INTEGER NOT NULL DEFAULT 10,
      FOREIGN KEY (company_id) REFERENCES ${COMPANY_TABLE} (id) ON DELETE CASCADE
    );`
  );

  await ensureLoyaltyTable(db);
};

const mapCompanyRow = (row) => ({
  id: row.id,
  name: row.name,
  description: row.description ?? "",
  contactEmail: row.contact_email ?? "",
});

const mapPromotionRow = (row) => ({
  id: row.id,
  companyId: row.company_id,
  companyName: row.company_name,
  name: row.name,
  description: row.description ?? "",
  discount: row.discount ?? "",
  startDate: row.start_date ?? "",
  endDate: row.end_date ?? "",
  type: row.type ?? "descuento",
  requiredStamps: row.required_stamps ?? 10,
});

const createId = () => Date.now().toString();

export default function Empresas() {
  const [companyForm, setCompanyForm] = useState({
    name: "",
    description: "",
    contactEmail: "",
  });
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [companies, setCompanies] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [showPromoModal, setShowPromoModal] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState(null);
  const [promoForm, setPromoForm] = useState({
    name: "",
    description: "",
    discount: "",
    startDate: "",
    endDate: "",
    type: "descuento",
    requiredStamps: "10",
  });
  const [activePromotionId, setActivePromotionId] = useState(null);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const dbRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    const bootstrap = async () => {
      try {
        dbRef.current = await SQLite.openDatabaseAsync(DB_NAME);
        await ensureTables(dbRef.current);

        const [companyRows, promoRows] = await Promise.all([
          executeSql(
            dbRef.current,
            `SELECT * FROM ${COMPANY_TABLE} ORDER BY name COLLATE NOCASE;`
          ),
          executeSql(
            dbRef.current,
            `SELECT * FROM ${PROMO_TABLE} ORDER BY name COLLATE NOCASE;`
          ),
        ]);

        if (isMounted) {
          const mappedCompanies = companyRows.map(mapCompanyRow);
          setCompanies(mappedCompanies);
          setSelectedCompanyId(mappedCompanies[0]?.id ?? null);

          const mappedPromos = promoRows.map(mapPromotionRow);
          setPromotions(mappedPromos);
          if (mappedPromos.length > 0) {
            setActivePromotionId(mappedPromos[0].id);
          }
        }
      } catch (error) {
        console.warn("Failed to initialize database", error);
        Alert.alert(
          "Base de datos",
          "No se pudo preparar el almacenamiento local. Reabre la app para reintentar."
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    bootstrap();

    return () => {
      isMounted = false;
    };
  }, []);

  const activePromotion = useMemo(
    () => promotions.find((promo) => promo.id === activePromotionId) ?? null,
    [promotions, activePromotionId]
  );

  const handleCompanyFormChange = (field, value) => {
    setCompanyForm((prev) => ({ ...prev, [field]: value }));
  };

  const loadCompanies = async () => {
    if (!dbRef.current) return;
    const rows = await executeSql(
      dbRef.current,
      `SELECT * FROM ${COMPANY_TABLE} ORDER BY name COLLATE NOCASE;`
    );
    const mapped = rows.map(mapCompanyRow);
    setCompanies(mapped);
    if (!mapped.some((company) => company.id === selectedCompanyId)) {
      setSelectedCompanyId(mapped[0]?.id ?? null);
    }
  };

  const loadPromotions = async () => {
    if (!dbRef.current) return;
    const rows = await executeSql(
      dbRef.current,
      `SELECT * FROM ${PROMO_TABLE} ORDER BY name COLLATE NOCASE;`
    );
    const mapped = rows.map(mapPromotionRow);
    setPromotions(mapped);
    if (!mapped.some((promo) => promo.id === activePromotionId)) {
      setActivePromotionId(mapped[0]?.id ?? null);
    }
  };

  const handleSubmitCompany = async () => {
    if (!companyForm.name.trim()) {
      Alert.alert("Registro de empresa", "Ingresa el nombre de la empresa.");
      return;
    }

    const db = dbRef.current;
    if (!db) {
      Alert.alert("Base de datos", "La base de datos no está lista todavía.");
      return;
    }

    const newCompany = {
      id: createId(),
      name: companyForm.name.trim(),
      description: companyForm.description.trim(),
      contactEmail: companyForm.contactEmail.trim(),
    };

    try {
      await executeSql(
        db,
        `INSERT INTO ${COMPANY_TABLE} (id, name, description, contact_email) VALUES (?, ?, ?, ?);`,
        [
          newCompany.id,
          newCompany.name,
          newCompany.description,
          newCompany.contactEmail,
        ]
      );

      setCompanies((prev) => [...prev, newCompany]);
      setSelectedCompanyId((prevId) => prevId ?? newCompany.id);
      setCompanyForm({ name: "", description: "", contactEmail: "" });
      setShowCompanyModal(false);

      Alert.alert("Empresa creada", "La empresa se registró correctamente.");
    } catch (error) {
      console.warn("Failed to insert company", error);
      Alert.alert("Error", "No se pudo guardar la empresa. Inténtalo de nuevo.");
    }
  };

  const handlePromoFormChange = (field, value) => {
    setPromoForm((prev) => {
      if (field === "type") {
        return {
          ...prev,
          type: value,
          discount: value === "descuento" ? prev.discount : "",
        };
      }

      return { ...prev, [field]: value };
    });
  };

  const handleSubmitPromo = async () => {
    if (!selectedCompanyId) {
      Alert.alert("Promoción", "Selecciona la empresa asociada a la promoción.");
      return;
    }

    if (!promoForm.name.trim()) {
      Alert.alert("Promoción", "Ingresa el nombre de la promoción.");
      return;
    }

    const requiredStamps = parseInt(promoForm.requiredStamps, 10);
    if (!Number.isFinite(requiredStamps) || requiredStamps <= 0) {
      Alert.alert(
        "Promoción",
        "Define cuántos sellos requiere esta promoción (número mayor a cero)."
      );
      return;
    }

    const db = dbRef.current;
    if (!db) {
      Alert.alert("Base de datos", "La base de datos no está lista todavía.");
      return;
    }

    const company = companies.find((item) => item.id === selectedCompanyId);
    const newPromo = {
      id: createId(),
      companyId: selectedCompanyId,
      companyName: company?.name ?? "",
      name: promoForm.name.trim(),
      description: promoForm.description.trim(),
      discount: promoForm.discount.trim(),
      startDate: promoForm.startDate.trim(),
      endDate: promoForm.endDate.trim(),
      type: promoForm.type,
      requiredStamps,
    };

    try {
      await executeSql(
        db,
        `INSERT INTO ${PROMO_TABLE} (
          id, company_id, company_name, name, description, discount, start_date, end_date, type, required_stamps
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        [
          newPromo.id,
          newPromo.companyId,
          newPromo.companyName,
          newPromo.name,
          newPromo.description,
          newPromo.discount,
          newPromo.startDate,
          newPromo.endDate,
          newPromo.type,
          newPromo.requiredStamps,
        ]
      );

      setPromotions((prev) => [...prev, newPromo]);
      setActivePromotionId(newPromo.id);
      setPromoForm({
        name: "",
        description: "",
        discount: "",
        startDate: "",
        endDate: "",
        type: "descuento",
        requiredStamps: "10",
      });
      setShowPromoModal(false);

      Alert.alert("Promoción creada", "La promoción se generó correctamente.");
    } catch (error) {
      console.warn("Failed to insert promotion", error);
      Alert.alert("Error", "No se pudo guardar la promoción. Inténtalo de nuevo.");
    }
  };

  const handleConfirmStartDate = (date) => {
    setPromoForm((prev) => ({
      ...prev,
      startDate: date.toISOString().split("T")[0],
    }));
    setShowStartDatePicker(false);
  };

  const handleConfirmEndDate = (date) => {
    setPromoForm((prev) => ({
      ...prev,
      endDate: date.toISOString().split("T")[0],
    }));
    setShowEndDatePicker(false);
  };

  const handleScanQR = async () => {
    if (Platform.OS === "web") {
      Alert.alert(
        "No disponible",
        "El escáner QR no funciona en la web. Usa la app en un dispositivo móvil."
      );
      return;
    }

    if (!activePromotion) {
      Alert.alert(
        "Selecciona una promoción",
        "Elige la promoción para la cual quieres registrar los sellos antes de escanear."
      );
      return;
    }

    if (!permission || !permission.granted) {
      const { granted } = await requestPermission();
      if (!granted) {
        Alert.alert("Permiso denegado", "Necesitas permisos para usar la cámara.");
        return;
      }
    }

    setScanned(false);
    setShowQRModal(true);
  };

  const upsertStampForClient = async (clientId, promotion) => {
    if (!dbRef.current) {
      throw new Error("La base de datos no está disponible.");
    }

    const currentRows = await executeSql(
      dbRef.current,
      `SELECT * FROM ${CARD_TABLE} WHERE client_id = ? AND promotion_id = ? LIMIT 1;`,
      [clientId, promotion.id]
    );

    const existingCard = currentRows[0];

    if (!existingCard) {
      await executeSql(
        dbRef.current,
        `INSERT INTO ${CARD_TABLE} (
          client_id, company_id, promotion_id, promotion_name, total_slots, stamps, reward
        ) VALUES (?, ?, ?, ?, ?, ?, ?);`,
        [
          clientId,
          promotion.companyId,
          promotion.id,
          promotion.name,
          promotion.requiredStamps,
          1,
          promotion.description || promotion.name,
        ]
      );

      return {
        stamps: 1,
        totalSlots: promotion.requiredStamps,
        completed: promotion.requiredStamps === 1,
      };
    }

    if (existingCard.stamps >= existingCard.total_slots) {
      return {
        stamps: existingCard.stamps,
        totalSlots: existingCard.total_slots,
        completed: true,
        alreadyComplete: true,
      };
    }

    const nextStampCount = existingCard.stamps + 1;
    await executeSql(
      dbRef.current,
      `UPDATE ${CARD_TABLE} SET stamps = ? WHERE id = ?;`,
      [nextStampCount, existingCard.id]
    );

    return {
      stamps: nextStampCount,
      totalSlots: existingCard.total_slots,
      completed: nextStampCount >= existingCard.total_slots,
    };
  };

  const handleBarCodeScanned = async ({ data }) => {
    if (scanned) {
      return;
    }

    setScanned(true);
    setShowQRModal(false);

    const clientId = data?.trim();
    if (!clientId) {
      Alert.alert("QR inválido", "El código escaneado no contiene un cliente válido.");
      return;
    }

    if (!activePromotion) {
      Alert.alert("Promoción", "Selecciona una promoción para asignar sellos.");
      return;
    }

    try {
      const result = await upsertStampForClient(clientId, activePromotion);

      if (result.alreadyComplete) {
        Alert.alert(
          "Tarjeta completa",
          "La tarjeta de este cliente ya alcanzó el total de sellos."
        );
        return;
      }

      if (result.completed) {
        Alert.alert(
          "¡Premio conseguido!",
          "El cliente completó la tarjeta de esta promoción."
        );
      } else {
        Alert.alert(
          "Sello agregado",
          `Sellos registrados: ${result.stamps}/${result.totalSlots}`
        );
      }
    } catch (error) {
      console.warn("Failed to stamp card", error);
      Alert.alert(
        "Error",
        "No se pudo registrar el sello. Inténtalo nuevamente."
      );
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loaderText}>Preparando tu panel...</Text>
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
          <Text style={styles.heroTitle}>Panel de empresas</Text>
          <Text style={styles.heroSubtitle}>
            Crea perfiles, promociones y otorga sellos desde tu dispositivo.
          </Text>
        </LinearGradient>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Empresas</Text>
          <Text style={styles.sectionDescription}>
            Registra tus empresas y gestiona sus promociones.
          </Text>
          <Pressable
            style={({ pressed }) => [
              styles.ghostButton,
              pressed && styles.ghostButtonPressed,
            ]}
            onPress={() => setShowCompanyModal(true)}
          >
            <Ionicons
              name="add-circle"
              size={18}
              color={Colors.primary}
              style={styles.buttonIcon}
            />
            <Text style={styles.ghostButtonText}>Agregar empresa</Text>
          </Pressable>

          {companies.length === 0 ? (
            <Text style={styles.helperText}>
              Aún no registras empresas. Agrega una empresa para comenzar.
            </Text>
          ) : (
            <View style={styles.listContainer}>
              {companies.map((company) => (
                <View key={company.id} style={styles.listItem}>
                  <View style={styles.listItemHeader}>
                    <Ionicons
                      name="business"
                      size={18}
                      color={Colors.primary}
                      style={styles.listItemHeaderIcon}
                    />
                    <Text style={styles.itemTitle}>{company.name}</Text>
                  </View>
                  {company.description ? (
                    <Text style={styles.itemDescription}>
                      {company.description}
                    </Text>
                  ) : null}
                  {company.contactEmail ? (
                    <Text style={styles.itemMeta}>{company.contactEmail}</Text>
                  ) : null}
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Promociones</Text>
          <Text style={styles.sectionDescription}>
            Crea promociones para atraer a tus clientes y definir sus sellos.
          </Text>
          <Pressable
            style={({ pressed }) => [
              styles.secondaryButton,
              companies.length === 0 && styles.secondaryButtonDisabled,
              pressed && companies.length > 0 && styles.secondaryButtonPressed,
            ]}
            onPress={() => {
              if (companies.length === 0) return;
              setShowPromoModal(true);
              if (!selectedCompanyId && companies.length > 0) {
                setSelectedCompanyId(companies[0].id);
              }
            }}
            disabled={companies.length === 0}
          >
            <LinearGradient
              colors={
                companies.length > 0
                  ? Colors.gradients.accent
                  : DISABLED_GRADIENT
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.secondaryButtonGradient}
            >
              <Ionicons
                name="pricetag"
                size={20}
                color={Colors.textOnPrimary}
                style={styles.buttonIcon}
              />
              <Text style={styles.secondaryButtonText}>Crear promoción</Text>
            </LinearGradient>
          </Pressable>
          {companies.length === 0 && (
            <Text style={styles.helperText}>
              Registra una empresa antes de crear promociones.
            </Text>
          )}

          {promotions.length === 0 ? (
            <Text style={styles.helperText}>
              Aún no creas promociones. Registra al menos una empresa y luego
              agrega promociones.
            </Text>
          ) : (
            <View style={styles.listContainer}>
              {promotions.map((promo) => {
                const isActive = promo.id === activePromotionId;
                return (
                  <View key={promo.id} style={styles.listItem}>
                    <View style={styles.listItemHeader}>
                      <Ionicons
                        name="pricetag"
                        size={18}
                        color={Colors.primary}
                        style={styles.listItemHeaderIcon}
                      />
                      <Text style={styles.itemTitle}>{promo.name}</Text>
                    </View>
                    <Text style={styles.itemDescription}>
                      Empresa: {promo.companyName}
                    </Text>
                    {promo.description ? (
                      <Text style={styles.itemMeta}>
                        Descripción: {promo.description}
                      </Text>
                    ) : null}
                    {promo.discount ? (
                      <Text style={styles.itemMeta}>
                        Descuento: {promo.discount}%
                      </Text>
                    ) : null}
                    <Text style={styles.itemMeta}>
                      Sellos para premio: {promo.requiredStamps}
                    </Text>
                    {promo.startDate && promo.endDate ? (
                      <Text style={styles.itemMeta}>
                        Vigencia: {promo.startDate} - {promo.endDate}
                      </Text>
                    ) : null}
                    <Pressable
                      style={[
                        styles.promoActionButton,
                        isActive && styles.promoActionButtonActive,
                      ]}
                      onPress={() => setActivePromotionId(promo.id)}
                    >
                      <Text
                        style={
                          isActive
                            ? styles.promoActionButtonTextActive
                            : styles.promoActionButtonText
                        }
                      >
                        {isActive ? "Promoción activa" : "Usar para sellos"}
                      </Text>
                    </Pressable>
                  </View>
                );
              })}
            </View>
          )}

          <View style={styles.activePromotionBanner}>
            {activePromotion ? (
              <Text style={styles.activePromotionText}>
                Sellando: {activePromotion.name} · {activePromotion.requiredStamps}
                {" "}
                sellos para premio
              </Text>
            ) : (
              <Text style={styles.activePromotionText}>
                Selecciona una promoción para comenzar a escanear QR.
              </Text>
            )}
          </View>
        </View>
      </ScrollView>

      <Modal
        visible={showCompanyModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCompanyModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Agregar Empresa</Text>
            <Text style={styles.label}>Nombre</Text>
            <TextInput
              value={companyForm.name}
              onChangeText={(value) => handleCompanyFormChange("name", value)}
              placeholder="Nombre de la empresa"
              placeholderTextColor={Colors.textMuted}
              style={styles.input}
            />
            <Text style={styles.label}>Descripción</Text>
            <TextInput
              value={companyForm.description}
              onChangeText={(value) =>
                handleCompanyFormChange("description", value)
              }
              placeholder="Breve descripción"
              placeholderTextColor={Colors.textMuted}
              style={[styles.input, styles.multilineInput]}
              multiline
            />
            <Text style={styles.label}>Correo de contacto</Text>
            <TextInput
              value={companyForm.contactEmail}
              onChangeText={(value) =>
                handleCompanyFormChange("contactEmail", value)
              }
              placeholder="correo@empresa.com"
              placeholderTextColor={Colors.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.input}
            />
            <View style={styles.modalButtons}>
              <Pressable
                style={({ pressed }) => [
                  styles.secondaryButton,
                  pressed && styles.secondaryButtonPressed,
                ]}
                onPress={() => setShowCompanyModal(false)}
              >
                <Text style={styles.secondaryButtonText}>Cancelar</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.primaryButton,
                  pressed && styles.primaryButtonPressed,
                ]}
                onPress={handleSubmitCompany}
              >
                <LinearGradient
                  colors={Colors.gradients.button}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.primaryButtonGradient}
                >
                  <Ionicons
                    name="business"
                    size={20}
                    color={Colors.textOnPrimary}
                    style={styles.buttonIcon}
                  />
                  <Text style={styles.primaryButtonText}>Crear empresa</Text>
                </LinearGradient>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showPromoModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPromoModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.modalScrollContent}
            >
              <Text style={styles.modalTitle}>Crear Promoción</Text>
              <Text style={styles.label}>Empresa</Text>
              <View style={styles.companySelector}>
                {companies.map((company) => {
                  const isSelected = company.id === selectedCompanyId;
                  return (
                    <Pressable
                      key={company.id}
                      style={[
                        styles.companyChip,
                        isSelected && styles.companyChipSelected,
                      ]}
                      onPress={() => setSelectedCompanyId(company.id)}
                    >
                      <Text
                        style={
                          isSelected
                            ? styles.companyChipTextSelected
                            : styles.companyChipText
                        }
                      >
                        {company.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              <Text style={styles.label}>Nombre de la promoción</Text>
              <TextInput
                value={promoForm.name}
                onChangeText={(value) => handlePromoFormChange("name", value)}
                placeholder="Nombre de la promoción"
                placeholderTextColor={Colors.textMuted}
                style={styles.input}
              />
              <Text style={styles.label}>Descripción</Text>
              <TextInput
                value={promoForm.description}
                onChangeText={(value) => handlePromoFormChange("description", value)}
                placeholder="Descripción de la promoción"
                placeholderTextColor={Colors.textMuted}
                style={[styles.input, styles.multilineInput]}
                multiline
              />
              <Text style={styles.label}>Tipo de promoción</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={promoForm.type}
                  onValueChange={(itemValue) => handlePromoFormChange("type", itemValue)}
                  style={styles.picker}
                >
                  <Picker.Item label="Descuento" value="descuento" />
                  <Picker.Item label="Regalo" value="regalo" />
                  <Picker.Item label="Otra" value="otra" />
                </Picker>
              </View>
              {promoForm.type === "descuento" && (
                <>
                  <Text style={styles.label}>Descuento (%)</Text>
                  <TextInput
                    value={promoForm.discount}
                    onChangeText={(value) => handlePromoFormChange("discount", value)}
                    placeholder="Porcentaje de descuento"
                    placeholderTextColor={Colors.textMuted}
                    keyboardType="numeric"
                    style={styles.input}
                  />
                </>
              )}
              <Text style={styles.label}>Sellos requeridos</Text>
              <TextInput
                value={promoForm.requiredStamps}
                onChangeText={(value) => handlePromoFormChange("requiredStamps", value)}
                placeholder="Número de sellos para canjear"
                placeholderTextColor={Colors.textMuted}
                keyboardType="numeric"
                style={styles.input}
              />
              <Text style={styles.label}>Fecha de inicio</Text>
              <Pressable
                style={styles.input}
                onPress={() => setShowStartDatePicker(true)}
              >
                <Text
                  style={
                    promoForm.startDate ? styles.inputText : styles.placeholderText
                  }
                >
                  {promoForm.startDate || "Seleccionar fecha"}
                </Text>
              </Pressable>
              <Text style={styles.label}>Fecha de fin</Text>
              <Pressable
                style={styles.input}
                onPress={() => setShowEndDatePicker(true)}
              >
                <Text
                  style={
                    promoForm.endDate ? styles.inputText : styles.placeholderText
                  }
                >
                  {promoForm.endDate || "Seleccionar fecha"}
                </Text>
              </Pressable>
              <View style={styles.modalButtons}>
                <Pressable
                  style={({ pressed }) => [
                    styles.secondaryButton,
                    pressed && styles.secondaryButtonPressed,
                  ]}
                  onPress={() => setShowPromoModal(false)}
                >
                  <Text style={styles.secondaryButtonText}>Cancelar</Text>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [
                    styles.primaryButton,
                    pressed && styles.primaryButtonPressed,
                  ]}
                  onPress={handleSubmitPromo}
                >
                  <LinearGradient
                    colors={Colors.gradients.button}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.primaryButtonGradient}
                  >
                    <Ionicons
                      name="checkmark-circle"
                      size={20}
                      color={Colors.textOnPrimary}
                      style={styles.buttonIcon}
                    />
                    <Text style={styles.primaryButtonText}>Guardar promoción</Text>
                  </LinearGradient>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showQRModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowQRModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Escanear código QR</Text>
            <View style={styles.cameraFrame}>
              <CameraView
                style={StyleSheet.absoluteFillObject}
                facing="back"
                barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
                onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
              />
            </View>
            <Pressable
              style={({ pressed }) => [
                styles.secondaryButton,
                pressed && styles.secondaryButtonPressed,
              ]}
              onPress={() => setShowQRModal(false)}
            >
              <Text style={styles.secondaryButtonText}>Cancelar</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Pressable
        style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
        onPress={handleScanQR}
      >
        <Ionicons name="qr-code" size={24} color={Colors.textOnPrimary} />
      </Pressable>

      <DateTimePickerModal
        isVisible={showStartDatePicker}
        mode="date"
        onConfirm={handleConfirmStartDate}
        onCancel={() => setShowStartDatePicker(false)}
      />

      <DateTimePickerModal
        isVisible={showEndDatePicker}
        mode="date"
        onConfirm={handleConfirmEndDate}
        onCancel={() => setShowEndDatePicker(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    padding: Layout.screenPadding,
    backgroundColor: Colors.background,
  },
  content: {
    paddingBottom: Spacing.xxl * 2,
  },
  heroCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.xxl,
    ...Shadows.medium,
  },
  heroTitle: {
    fontSize: FontSizes.xl,
    fontWeight: "700",
    color: Colors.textOnPrimary,
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
    backgroundColor: Colors.background,
  },
  loaderText: {
    marginTop: Spacing.md,
    fontSize: FontSizes.md,
    color: Colors.text,
  },
  section: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.xxl,
    ...Shadows.light,
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
  label: {
    fontSize: FontSizes.sm,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  input: {
    backgroundColor: Colors.backgroundAlt,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  multilineInput: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  ghostButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.primary,
    marginBottom: Spacing.md,
  },
  ghostButtonPressed: {
    opacity: 0.85,
  },
  ghostButtonText: {
    color: Colors.primary,
    fontSize: FontSizes.md,
    fontWeight: "600",
  },
  primaryButton: {
    borderRadius: BorderRadius.round,
    overflow: "hidden",
    ...Shadows.light,
  },
  primaryButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  primaryButtonGradient: {
    flexDirection: "row",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: {
    color: Colors.textOnPrimary,
    fontSize: FontSizes.md,
    fontWeight: "700",
  },
  secondaryButton: {
    borderRadius: BorderRadius.round,
    overflow: "hidden",
    ...Shadows.light,
    marginBottom: Spacing.sm,
  },
  secondaryButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  secondaryButtonDisabled: {
    opacity: 0.6,
  },
  secondaryButtonGradient: {
    flexDirection: "row",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButtonText: {
    color: Colors.textOnPrimary,
    fontSize: FontSizes.md,
    fontWeight: "700",
  },
  buttonIcon: {
    marginRight: Spacing.sm,
  },
  helperText: {
    color: Colors.textMuted,
    fontSize: FontSizes.xs,
    marginBottom: Spacing.lg,
  },
  listContainer: {
    marginTop: Spacing.md,
  },
  listItem: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
  },
  listItemHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  listItemHeaderIcon: {
    marginRight: Spacing.xs,
  },
  itemTitle: {
    color: Colors.text,
    fontSize: FontSizes.md,
    fontWeight: "600",
  },
  itemDescription: {
    color: Colors.textMuted,
    fontSize: FontSizes.sm,
    marginBottom: Spacing.xs,
  },
  itemMeta: {
    color: Colors.text,
    fontSize: FontSizes.sm,
  },
  fab: {
    position: "absolute",
    bottom: Spacing.xl,
    right: Spacing.xl,
    backgroundColor: Colors.primary,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    ...Shadows.medium,
  },
  fabPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.96 }],
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    width: "90%",
    maxHeight: "80%",
    ...Shadows.medium,
  },
  modalScrollContent: {
    paddingBottom: Spacing.xl,
  },
  modalTitle: {
    fontSize: FontSizes.xl,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: Spacing.lg,
    textAlign: "center",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: Spacing.lg,
  },
  pickerContainer: {
    backgroundColor: Colors.backgroundAlt,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  picker: {
    color: Colors.text,
  },
  inputText: {
    color: Colors.text,
  },
  placeholderText: {
    color: Colors.textMuted,
  },
  companySelector: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: Spacing.md,
  },
  companyChip: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.backgroundAlt,
    marginRight: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  companyChipSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.background,
  },
  companyChipText: {
    color: Colors.text,
    fontSize: FontSizes.sm,
  },
  companyChipTextSelected: {
    color: Colors.text,
    fontSize: FontSizes.sm,
    fontWeight: "600",
  },
  cameraFrame: {
    width: "100%",
    aspectRatio: 3 / 4,
    borderRadius: BorderRadius.xl,
    overflow: "hidden",
    marginBottom: Spacing.lg,
    backgroundColor: Colors.backgroundAlt,
  },
  promoActionButton: {
    marginTop: Spacing.md,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    alignSelf: "flex-start",
  },
  promoActionButtonActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.background,
  },
  promoActionButtonText: {
    color: Colors.text,
    fontSize: FontSizes.sm,
  },
  promoActionButtonTextActive: {
    color: Colors.primary,
    fontSize: FontSizes.sm,
    fontWeight: "600",
  },
  activePromotionBanner: {
    marginTop: Spacing.lg,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.backgroundAlt,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  activePromotionText: {
    color: Colors.text,
    fontSize: FontSizes.sm,
  },
});
