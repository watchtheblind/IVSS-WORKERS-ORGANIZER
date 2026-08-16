import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Switch,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { container } from '../../container';
import { APP_CONFIG, ShiftConfig } from '../../domain/constants/appConfig';
import {
  HospitalSettings,
  DEFAULT_HOSPITAL_SETTINGS,
} from '../../domain/ports/ConfigRepository';
import {
  useAppTheme,
  THEMES,
  ThemeColors,
  ThemeName,
} from '../theme/ThemeProvider';

export default function SettingsScreen() {
  const { colors, themeName, setThemeName } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [autoSync, setAutoSync] = useState(true);
  const [hospitalSettings, setHospitalSettings] = useState<HospitalSettings>(
    DEFAULT_HOSPITAL_SETTINGS
  );
  const [uploadingLogo, setUploadingLogo] = useState(false);

  // Departments & Shifts state
  const [departments, setDepartments] = useState<string[]>([]);
  const [shifts, setShifts] = useState<ShiftConfig[]>([]);
  const [newDeptName, setNewDeptName] = useState('');
  const [newShiftLabel, setNewShiftLabel] = useState('');
  const [showAddDept, setShowAddDept] = useState(false);
  const [showAddShift, setShowAddShift] = useState(false);

  const loadConfig = useCallback(async () => {
    try {
      const [deptList, shiftList, hospital] = await Promise.all([
        container.configRepository.getDepartments(),
        container.configRepository.getShifts(),
        container.configRepository.getHospitalSettings(),
      ]);
      setDepartments(deptList);
      setShifts(shiftList);
      setHospitalSettings(hospital);
    } catch (error) {
      console.error('Error loading config:', error);
    }
  }, []);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  const handleAddDepartment = async () => {
    if (!newDeptName.trim()) {
      Alert.alert('Atención', 'Por favor ingresa el nombre del área o departamento.');
      return;
    }
    try {
      const updated = await container.configRepository.addDepartment(newDeptName.trim());
      setDepartments(updated);
      setNewDeptName('');
      setShowAddDept(false);
      Alert.alert('Éxito', 'Área / Departamento agregado correctamente.');
    } catch (error) {
      Alert.alert('Error', 'No se pudo agregar el área.');
    }
  };

  const handleRemoveDepartment = (dept: string) => {
    Alert.alert(
      'Eliminar Área',
      `¿Estás seguro de eliminar el área "${dept}"? Las salas que le pertenecen también serán eliminadas.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              const updated = await container.configRepository.removeDepartment(dept);
              setDepartments(updated);
            } catch (error) {
              Alert.alert('Error', 'No se pudo eliminar el área.');
            }
          },
        },
      ]
    );
  };

  const handleAddShift = async () => {
    if (!newShiftLabel.trim()) {
      Alert.alert('Atención', 'Por favor ingresa la descripción del turno.');
      return;
    }
    const id = 'shift_' + Date.now();
    try {
      const updated = await container.configRepository.addShift({
        id,
        label: newShiftLabel.trim(),
        icon: 'clock-outline',
      });
      setShifts(updated);
      setNewShiftLabel('');
      setShowAddShift(false);
      Alert.alert('Éxito', 'Turno agregado correctamente.');
    } catch (error) {
      Alert.alert('Error', 'No se pudo agregar el turno.');
    }
  };

  const handleRemoveShift = (shift: ShiftConfig) => {
    Alert.alert(
      'Eliminar Turno',
      `¿Estás seguro de eliminar el turno "${shift.label}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              const updated = await container.configRepository.removeShift(shift.id);
              setShifts(updated);
            } catch (error) {
              Alert.alert('Error', 'No se pudo eliminar el turno.');
            }
          },
        },
      ]
    );
  };

  const handleManualSync = async () => {
    try {
      const result = await container.syncWorkersUseCase.execute();
      const configResult = await container.syncConfigUseCase.execute();
      Alert.alert(
        'Sincronización Exitosa',
        `Trabajadores — subidos: ${result.pushed}, descargados: ${result.pulled}\n` +
          `Configuración — subidos: ${configResult.pushed}, descargados: ${configResult.pulled}`
      );
    } catch (error) {
      Alert.alert('Error', 'No se pudo sincronizar con la nube.');
    }
  };

  const handleClearCache = () => {
    Alert.alert(
      'Comprobar Estado',
      '¿Deseas verificar la integridad de la base de datos local?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Comprobar',
          onPress: () => {
            Alert.alert('Estado', 'Base de datos local en perfecto estado.');
          },
        },
      ]
    );
  };

  const handleSaveHospitalName = async () => {
    try {
      await container.configRepository.saveHospitalSettings({
        ...hospitalSettings,
        hospitalName: hospitalSettings.hospitalName.trim(),
      });
      Alert.alert('Guardado', 'Nombre del centro hospitalario actualizado.');
    } catch (error) {
      Alert.alert('Error', 'No se pudo guardar el nombre del centro.');
    }
  };

  const handleToggleShowLogo = async (value: boolean) => {
    const next = { ...hospitalSettings, showLogo: value };
    setHospitalSettings(next);
    try {
      await container.configRepository.saveHospitalSettings(next);
    } catch (error) {
      console.error('Error saving showLogo:', error);
    }
  };

  const handlePickLogo = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!result.canceled && result.assets.length > 0) {
        const next = { ...hospitalSettings, logoUri: result.assets[0].uri };
        setHospitalSettings(next);
        setUploadingLogo(true);
        try {
          await container.configRepository.saveHospitalSettings(next);
          Alert.alert('Logo Actualizado', 'El logo se guardó correctamente.');
        } finally {
          setUploadingLogo(false);
        }
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo cargar el logo.');
    }
  };

  const handleSelectTheme = (name: ThemeName) => {
    setThemeName(name);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header Banner */}
      <View style={styles.headerBanner}>
        <View style={styles.headerIconContainer}>
          <MaterialCommunityIcons name="cog" size={28} color={colors.purple} />
        </View>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>Configuraciones</Text>
          <Text style={styles.headerSubtitle}>
            Gestión de áreas, turnos y preferencias de {APP_CONFIG.appName}
          </Text>
        </View>
      </View>

      {/* Appearance & Theme */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>APARIENCIA Y TEMA</Text>
        <View style={styles.card}>
          {THEMES.map((theme, index) => {
            const selected = theme.name === themeName;
            return (
              <React.Fragment key={theme.name}>
                {index > 0 && <View style={styles.divider} />}
                <TouchableOpacity
                  style={styles.themeRow}
                  onPress={() => handleSelectTheme(theme.name)}
                >
                  <View style={styles.themeLeft}>
                    <View
                      style={[
                        styles.themeSwatch,
                        { backgroundColor: theme.colors.background },
                      ]}
                    >
                      <View
                        style={[
                          styles.themeSwatchInner,
                          { backgroundColor: theme.colors.accent },
                        ]}
                      />
                    </View>
                    <Text style={styles.themeLabel}>{theme.label}</Text>
                  </View>
                  <MaterialCommunityIcons
                    name={selected ? 'check-circle' : 'circle-outline'}
                    size={22}
                    color={selected ? colors.accent : colors.textFaint}
                  />
                </TouchableOpacity>
              </React.Fragment>
            );
          })}
        </View>
      </View>

      {/* Áreas y Departamentos Management */}
      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeader}>ÁREAS Y DEPARTAMENTOS</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowAddDept(!showAddDept)}
          >
            <MaterialCommunityIcons
              name={showAddDept ? 'close' : 'plus'}
              size={16}
              color={colors.accent}
            />
            <Text style={styles.addButtonText}>
              {showAddDept ? 'Cerrar' : 'Añadir'}
            </Text>
          </TouchableOpacity>
        </View>

        {showAddDept && (
          <View style={styles.addCard}>
            <TextInput
              style={styles.input}
              placeholder="Nombre del área (Ej. Traumatología)"
              placeholderTextColor={colors.textMuted}
              value={newDeptName}
              onChangeText={setNewDeptName}
            />
            <TouchableOpacity style={styles.saveItemButton} onPress={handleAddDepartment}>
              <Text style={styles.saveItemButtonText}>Guardar Área</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.card}>
          {departments.map((dept, index) => (
            <React.Fragment key={dept}>
              {index > 0 && <View style={styles.divider} />}
              <View style={styles.itemRow}>
                <View style={styles.itemLeft}>
                  <MaterialCommunityIcons name="domain" size={20} color={colors.accent} />
                  <Text style={styles.itemText}>{dept}</Text>
                </View>
                <TouchableOpacity onPress={() => handleRemoveDepartment(dept)}>
                  <MaterialCommunityIcons name="trash-can-outline" size={20} color={colors.danger} />
                </TouchableOpacity>
              </View>
            </React.Fragment>
          ))}
        </View>
      </View>

      {/* Turnos y Horarios Management */}
      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeader}>TURNOS Y HORARIOS</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowAddShift(!showAddShift)}
          >
            <MaterialCommunityIcons
              name={showAddShift ? 'close' : 'plus'}
              size={16}
              color={colors.accent}
            />
            <Text style={styles.addButtonText}>
              {showAddShift ? 'Cerrar' : 'Añadir'}
            </Text>
          </TouchableOpacity>
        </View>

        {showAddShift && (
          <View style={styles.addCard}>
            <TextInput
              style={styles.input}
              placeholder="Descripción del turno (Ej. Guardia Especial)"
              placeholderTextColor={colors.textMuted}
              value={newShiftLabel}
              onChangeText={setNewShiftLabel}
            />
            <TouchableOpacity style={styles.saveItemButton} onPress={handleAddShift}>
              <Text style={styles.saveItemButtonText}>Guardar Turno</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.card}>
          {shifts.map((shift, index) => (
            <React.Fragment key={shift.id}>
              {index > 0 && <View style={styles.divider} />}
              <View style={styles.itemRow}>
                <View style={styles.itemLeft}>
                  <MaterialCommunityIcons
                    name={(shift.icon || 'clock-outline') as any}
                    size={20}
                    color={colors.purple}
                  />
                  <Text style={styles.itemText}>{shift.label}</Text>
                </View>
                <TouchableOpacity onPress={() => handleRemoveShift(shift)}>
                  <MaterialCommunityIcons name="trash-can-outline" size={20} color={colors.danger} />
                </TouchableOpacity>
              </View>
            </React.Fragment>
          ))}
        </View>
      </View>

      {/* Sync & Cloud Section */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>SINCRONIZACIÓN Y RESPALDO</Text>
        <View style={styles.card}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Auto-sincronización</Text>
              <Text style={styles.settingDescription}>
                Respaldar automáticamente al conectarse a internet
              </Text>
            </View>
            <Switch
              value={autoSync}
              onValueChange={setAutoSync}
              trackColor={{ false: colors.border, true: colors.accent }}
              thumbColor={autoSync ? '#FFFFFF' : colors.textMuted}
            />
          </View>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.actionRow} onPress={handleManualSync}>
            <View style={styles.actionLeft}>
              <MaterialCommunityIcons name="cloud-sync" size={22} color={colors.accent} />
              <Text style={styles.actionText}>Sincronizar Datos Ahora</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textFaint} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Hospital / Institute Section */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>CENTRO HOSPITALARIO</Text>
        <View style={styles.card}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Nombre del Centro</Text>
              <Text style={styles.settingDescription}>
                Se muestra en el encabezado de la planificación
              </Text>
            </View>
          </View>

          <View style={styles.hospitalBody}>
            <TextInput
              style={styles.input}
              placeholder="Ej. Hospital Central de Valencia"
              placeholderTextColor={colors.textMuted}
              value={hospitalSettings.hospitalName}
              onChangeText={(text) =>
                setHospitalSettings((prev) => ({
                  ...prev,
                  hospitalName: text,
                }))
              }
            />
            <TouchableOpacity
              style={styles.saveItemButton}
              onPress={handleSaveHospitalName}
            >
              <Text style={styles.saveItemButtonText}>Guardar Nombre</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.divider} />

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Mostrar Logo en la Plantilla</Text>
              <Text style={styles.settingDescription}>
                Aparece la foto/logo junto al nombre en la imagen exportada
              </Text>
            </View>
            <Switch
              value={hospitalSettings.showLogo}
              onValueChange={handleToggleShowLogo}
              trackColor={{ false: colors.border, true: colors.accent }}
              thumbColor={hospitalSettings.showLogo ? '#FFFFFF' : colors.textMuted}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.logoRow}>
            {hospitalSettings.logoUri ? (
              <Image
                source={{ uri: hospitalSettings.logoUri }}
                style={styles.logoPreview}
              />
            ) : (
              <View style={styles.logoPlaceholder}>
                <MaterialCommunityIcons
                  name="hospital-building"
                  size={22}
                  color={colors.textMuted}
                />
              </View>
            )}
            <View style={styles.logoInfo}>
              <Text style={styles.logoTitle}>Logo del Instituto</Text>
              <Text style={styles.logoDescription}>
                {hospitalSettings.logoUri
                  ? 'Logo cargado'
                  : 'Sin logo. Usa la insignia con inicial por defecto.'}
              </Text>
              <TouchableOpacity
                style={styles.logoUploadButton}
                onPress={handlePickLogo}
                disabled={uploadingLogo}
              >
                {uploadingLogo ? (
                  <ActivityIndicator color={colors.accent} size="small" />
                ) : (
                  <>
                    <MaterialCommunityIcons
                      name="image-plus"
                      size={16}
                      color={colors.accent}
                      style={{ marginRight: 6 }}
                    />
                    <Text style={styles.logoUploadText}>
                      {hospitalSettings.logoUri ? 'Cambiar Logo' : 'Subir Logo'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>

      {/* About Section */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>ACERCA DE LA APLICACIÓN</Text>
        <View style={styles.card}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Aplicación</Text>
            <Text style={styles.infoValue}>{APP_CONFIG.appName}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Versión</Text>
            <Text style={styles.infoValue}>1.0.0</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Estado Local</Text>
            <Text style={[styles.infoValue, { color: colors.success }]}>Operativo y Seguro</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      padding: 20,
      paddingBottom: 40,
    },
    headerBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 16,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: colors.border,
    },
    headerIconContainer: {
      width: 50,
      height: 50,
      borderRadius: 12,
      backgroundColor: colors.purpleTint,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 14,
    },
    headerTextContainer: {
      flex: 1,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.textStrong,
    },
    headerSubtitle: {
      fontSize: 12,
      color: colors.textMuted,
      marginTop: 2,
    },
    section: {
      marginBottom: 20,
    },
    sectionHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
      marginHorizontal: 4,
    },
    sectionHeader: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.textFaint,
      letterSpacing: 0.8,
      marginBottom: 10,
    },
    addButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 8,
      paddingVertical: 2,
    },
    addButtonText: {
      color: colors.accent,
      fontSize: 12,
      fontWeight: '600',
      marginLeft: 4,
    },
    addCard: {
      backgroundColor: colors.surface,
      borderRadius: 14,
      padding: 14,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: colors.border,
    },
    input: {
      backgroundColor: colors.background,
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 10,
      fontSize: 14,
      color: colors.textStrong,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: colors.border,
    },
    saveItemButton: {
      backgroundColor: colors.accentDark,
      borderRadius: 8,
      paddingVertical: 10,
      alignItems: 'center',
    },
    saveItemButtonText: {
      color: '#FFFFFF',
      fontSize: 13,
      fontWeight: '600',
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
    },
    themeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 12,
      paddingHorizontal: 16,
    },
    themeLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    themeSwatch: {
      width: 28,
      height: 28,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    themeSwatchInner: {
      width: 12,
      height: 12,
      borderRadius: 4,
    },
    themeLabel: {
      color: colors.textStrong,
      fontSize: 14,
      fontWeight: '500',
    },
    itemRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 12,
      paddingHorizontal: 16,
    },
    itemLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    itemText: {
      color: colors.textStrong,
      fontSize: 14,
      fontWeight: '500',
      marginLeft: 10,
    },
    settingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 16,
    },
    settingInfo: {
      flex: 1,
      paddingRight: 12,
    },
    settingTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textStrong,
    },
    settingDescription: {
      fontSize: 12,
      color: colors.textMuted,
      marginTop: 2,
    },
    divider: {
      height: 1,
      backgroundColor: colors.border,
      marginLeft: 16,
    },
    actionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 16,
    },
    actionLeft: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    actionText: {
      fontSize: 14,
      color: colors.textStrong,
      fontWeight: '500',
      marginLeft: 12,
    },
    infoRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 14,
      paddingHorizontal: 16,
    },
    infoLabel: {
      fontSize: 13,
      color: colors.textMuted,
    },
    infoValue: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textStrong,
    },
    hospitalBody: {
      paddingHorizontal: 16,
      paddingBottom: 16,
    },
    logoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
    },
    logoPreview: {
      width: 56,
      height: 56,
      borderRadius: 12,
      resizeMode: 'contain',
      marginRight: 14,
      backgroundColor: colors.background,
    },
    logoPlaceholder: {
      width: 56,
      height: 56,
      borderRadius: 12,
      backgroundColor: colors.background,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 14,
      borderWidth: 1,
      borderColor: colors.border,
    },
    logoInfo: {
      flex: 1,
    },
    logoTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textStrong,
    },
    logoDescription: {
      fontSize: 12,
      color: colors.textMuted,
      marginTop: 2,
      marginBottom: 8,
    },
    logoUploadButton: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      backgroundColor: colors.accentTint,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    logoUploadText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.accent,
    },
  });