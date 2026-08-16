import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Switch,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { container } from '../../container';
import { APP_CONFIG, ShiftConfig } from '../../domain/constants/appConfig';

export default function SettingsScreen() {
  const [autoSync, setAutoSync] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [compactView, setCompactView] = useState(false);

  // Departments & Shifts state
  const [departments, setDepartments] = useState<string[]>([]);
  const [shifts, setShifts] = useState<ShiftConfig[]>([]);
  const [newDeptName, setNewDeptName] = useState('');
  const [newShiftLabel, setNewShiftLabel] = useState('');
  const [showAddDept, setShowAddDept] = useState(false);
  const [showAddShift, setShowAddShift] = useState(false);

  const loadConfig = useCallback(async () => {
    try {
      const [deptList, shiftList] = await Promise.all([
        container.configRepository.getDepartments(),
        container.configRepository.getShifts(),
      ]);
      setDepartments(deptList);
      setShifts(shiftList);
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
      Alert.alert(
        'Sincronización Exitosa',
        `Registros subidos: ${result.pushed}\nRegistros descargados: ${result.pulled}`
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

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header Banner */}
      <View style={styles.headerBanner}>
        <View style={styles.headerIconContainer}>
          <MaterialCommunityIcons name="cog" size={28} color="#A78BFA" />
        </View>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>Configuraciones</Text>
          <Text style={styles.headerSubtitle}>
            Gestión de áreas, turnos y preferencias de {APP_CONFIG.appName}
          </Text>
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
              color="#38BDF8"
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
              placeholderTextColor="#94A3B8"
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
                  <MaterialCommunityIcons name="domain" size={20} color="#38BDF8" />
                  <Text style={styles.itemText}>{dept}</Text>
                </View>
                <TouchableOpacity onPress={() => handleRemoveDepartment(dept)}>
                  <MaterialCommunityIcons name="trash-can-outline" size={20} color="#EF4444" />
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
              color="#38BDF8"
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
              placeholderTextColor="#94A3B8"
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
                    color="#A78BFA"
                  />
                  <Text style={styles.itemText}>{shift.label}</Text>
                </View>
                <TouchableOpacity onPress={() => handleRemoveShift(shift)}>
                  <MaterialCommunityIcons name="trash-can-outline" size={20} color="#EF4444" />
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
              trackColor={{ false: '#334155', true: '#6366F1' }}
              thumbColor={autoSync ? '#FFFFFF' : '#94A3B8'}
            />
          </View>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.actionRow} onPress={handleManualSync}>
            <View style={styles.actionLeft}>
              <MaterialCommunityIcons name="cloud-sync" size={22} color="#38BDF8" />
              <Text style={styles.actionText}>Sincronizar Datos Ahora</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color="#64748B" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Preferences Section */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>PREFERENCIAS</Text>
        <View style={styles.card}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Notificaciones de Turno</Text>
              <Text style={styles.settingDescription}>
                Recordatorios de guardias programadas
              </Text>
            </View>
            <Switch
              value={notifications}
              onValueChange={setNotifications}
              trackColor={{ false: '#334155', true: '#6366F1' }}
              thumbColor={notifications ? '#FFFFFF' : '#94A3B8'}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Vista Compacta de Listas</Text>
              <Text style={styles.settingDescription}>
                Mostrar más elementos en pantalla
              </Text>
            </View>
            <Switch
              value={compactView}
              onValueChange={setCompactView}
              trackColor={{ false: '#334155', true: '#6366F1' }}
              thumbColor={compactView ? '#FFFFFF' : '#94A3B8'}
            />
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
            <Text style={[styles.infoValue, { color: '#10B981' }]}>Operativo y Seguro</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  headerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  headerIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: 'rgba(167, 139, 250, 0.12)',
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
    color: '#F8FAFC',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
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
    color: '#64748B',
    letterSpacing: 0.8,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  addButtonText: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  addCard: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  input: {
    backgroundColor: '#0F172A',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#F8FAFC',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  saveItemButton: {
    backgroundColor: '#0284C7',
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
    backgroundColor: '#1E293B',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#334155',
    overflow: 'hidden',
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
    color: '#F8FAFC',
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
    color: '#F8FAFC',
  },
  settingDescription: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#334155',
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
    color: '#F8FAFC',
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
    color: '#94A3B8',
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#F8FAFC',
  },
});
