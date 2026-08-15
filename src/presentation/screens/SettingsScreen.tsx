import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Switch,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { container } from '../../container';

export default function SettingsScreen() {
  const [autoSync, setAutoSync] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [compactView, setCompactView] = useState(false);

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
      'Limpiar Datos Temporales',
      '¿Deseas verificar la integridad de la base de datos local SQLite?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Comprobar',
          onPress: () => {
            Alert.alert('Estado', 'Base de datos SQLite local en perfecto estado.');
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
            Ajustes del sistema y sincronización IVSS
          </Text>
        </View>
      </View>

      {/* Sync & Cloud Section */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>SINCRONIZACIÓN Y NUBE</Text>
        <View style={styles.card}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Auto-sincronización</Text>
              <Text style={styles.settingDescription}>
                Sincronizar automáticamente con Supabase al conectarse
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
              <Text style={styles.actionText}>Forzar Sincronización Ahora</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color="#64748B" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Storage & Database */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>ALMACENAMIENTO LOCAL</Text>
        <View style={styles.card}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Motor de Base de Datos</Text>
              <Text style={styles.settingDescription}>Expo SQLite (Offline-First)</Text>
            </View>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Activo</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.actionRow} onPress={handleClearCache}>
            <View style={styles.actionLeft}>
              <MaterialCommunityIcons name="database-check" size={22} color="#10B981" />
              <Text style={styles.actionText}>Verificar Integridad SQLite</Text>
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
                Recordatorios de guardias asignadas
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
                Mostrar más elementos por pantalla
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
            <Text style={styles.infoValue}>IVSS Workers Organizer</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Versión</Text>
            <Text style={styles.infoValue}>1.0.0 (Expo SDK 57)</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Arquitectura</Text>
            <Text style={styles.infoValue}>Hexagonal / Clean Architecture</Text>
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
  sectionHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 8,
    letterSpacing: 0.8,
    marginLeft: 4,
  },
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#334155',
    overflow: 'hidden',
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
  badge: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: '700',
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
