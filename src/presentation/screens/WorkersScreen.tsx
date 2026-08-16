import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { container } from '../../container';
import { Worker } from '../../domain/entities/Worker';
import { useAppTheme, ThemeColors } from '../theme/ThemeProvider';

export default function WorkersScreen() {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [fullName, setFullName] = useState('');
  const [position, setPosition] = useState('');
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  const loadWorkers = useCallback(async () => {
    try {
      const result = await container.getWorkersUseCase.execute();
      setWorkers(result);
    } catch (error) {
      console.error('Error loading workers:', error);
    }
  }, []);

  useEffect(() => {
    loadWorkers();

    container.networkListener.start(async (connected) => {
      setIsConnected(connected);
      if (connected) {
        handleSync();
      }
    });

    return () => {
      container.networkListener.stop();
    };
  }, []);

  const handleAddWorker = async () => {
    if (!fullName.trim() || !position.trim()) {
      Alert.alert('Error de Validación', 'Por favor llena Nombre y Cargo.');
      return;
    }

    setLoading(true);
    try {
      await container.addWorkerUseCase.execute({
        full_name: fullName.trim(),
        position: position.trim(),
      });
      setFullName('');
      setPosition('');
      setShowAddForm(false);
      await loadWorkers();

      if (isConnected) {
        handleSync();
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo guardar el trabajador.');
      console.error('Error adding worker:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const result = await container.syncWorkersUseCase.execute();
      console.log(`Sync complete: ${result.pushed} pushed, ${result.pulled} pulled`);
      const configResult = await container.syncConfigUseCase.execute();
      console.log(
        `Config sync complete: ${configResult.pushed} pushed, ${configResult.pulled} pulled`
      );
      await loadWorkers();
    } catch (error) {
      console.error('Sync error:', error);
    } finally {
      setSyncing(false);
    }
  };


  const filteredWorkers = workers.filter(
    (w) =>
      w.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.position.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderWorkerItem = ({ item }: { item: Worker }) => (
    <View style={styles.workerCard}>
      <View style={styles.workerAvatar}>
        <MaterialCommunityIcons name="account" size={24} color={colors.accent} />
      </View>
      <View style={styles.workerInfo}>
        <Text style={styles.workerName}>{item.full_name}</Text>
        <Text style={styles.workerPosition}>{item.position}</Text>
      </View>
      <View
        style={[
          styles.syncBadge,
          { backgroundColor: item.synced ? colors.successTint : colors.warningTint },
        ]}
      >
        <MaterialCommunityIcons
          name={item.synced ? 'cloud-check' : 'cloud-sync'}
          size={14}
          color={item.synced ? colors.success : colors.warning}
          style={{ marginRight: 4 }}
        />
        <Text
          style={[
            styles.syncBadgeText,
            { color: item.synced ? colors.success : colors.warning },
          ]}
        >
          {item.synced ? 'Sincronizado' : 'Pendiente'}
        </Text>
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Top Bar Header */}
      <View style={styles.topHeader}>
        <View>
          <Text style={styles.screenTitle}>Gestión de Personal</Text>
          <Text style={styles.screenSubtitle}>
            {workers.length} trabajadores registrados
          </Text>
        </View>
        <View style={styles.networkIndicator}>
          <View
            style={[
              styles.connectionDot,
              { backgroundColor: isConnected ? colors.success : colors.danger },
            ]}
          />
          <Text style={styles.connectionText}>
            {isConnected ? 'Online' : 'Offline'}
          </Text>
        </View>
      </View>

      {/* Actions / Search Bar */}
      <View style={styles.searchSection}>
        <View style={styles.searchBox}>
          <MaterialCommunityIcons name="magnify" size={20} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por nombre o cargo..."
            placeholderTextColor={colors.textFaint}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <MaterialCommunityIcons name="close-circle" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={styles.toggleFormButton}
          onPress={() => setShowAddForm(!showAddForm)}
        >
          <MaterialCommunityIcons
            name={showAddForm ? 'close' : 'account-plus'}
            size={22}
            color="#FFFFFF"
          />
        </TouchableOpacity>
      </View>

      {/* Collapsible Add Worker Form */}
      {showAddForm && (
        <View style={styles.formSection}>
          <Text style={styles.formTitle}>Registrar Nuevo Trabajador</Text>
          <TextInput
            style={styles.input}
            placeholder="Nombre Completo"
            placeholderTextColor={colors.textMuted}
            value={fullName}
            onChangeText={setFullName}
          />
          <TextInput
            style={styles.input}
            placeholder="Cargo / Especialidad (Ej. Médico Cirujano)"
            placeholderTextColor={colors.textMuted}
            value={position}
            onChangeText={setPosition}
          />
          <TouchableOpacity
            style={[styles.primaryButton, loading && styles.buttonDisabled]}
            onPress={handleAddWorker}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <MaterialCommunityIcons name="plus" size={20} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.primaryButtonText}>Guardar Trabajador</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Quick Action Buttons */}
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={[styles.secondaryButton, syncing && styles.buttonDisabled]}
          onPress={handleSync}
          disabled={syncing}
        >
          {syncing ? (
            <ActivityIndicator color={colors.accent} size="small" />
          ) : (
            <>
              <MaterialCommunityIcons name="sync" size={18} color={colors.accent} style={{ marginRight: 6 }} />
              <Text style={styles.secondaryButtonText}>Sincronizar</Text>
            </>
          )}
        </TouchableOpacity>

      </View>

      {/* Worker List & Report Capture View */}
      <View style={styles.listSection}>
        <View style={styles.reportContainer}>
          <FlatList
            data={filteredWorkers}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderWorkerItem}
            contentContainerStyle={
              filteredWorkers.length === 0 ? styles.emptyContainer : { paddingBottom: 20 }
            }
            ListEmptyComponent={
              <View style={styles.emptyContent}>
                <MaterialCommunityIcons name="account-search-outline" size={48} color={colors.textFaint} />
                <Text style={styles.emptyText}>
                  {searchQuery ? 'No se encontraron resultados.' : 'No hay personal registrado aún.'}
                </Text>
              </View>
            }
          />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textStrong,
  },
  screenSubtitle: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },
  networkIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  connectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  connectionText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  searchSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 12,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    color: colors.textStrong,
    fontSize: 14,
    marginLeft: 8,
  },
  toggleFormButton: {
    backgroundColor: colors.accentDark,
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formSection: {
    backgroundColor: colors.surface,
    marginHorizontal: 20,
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  formTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 12,
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: colors.textStrong,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  primaryButton: {
    backgroundColor: colors.accentDark,
    borderRadius: 10,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  actionRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 12,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryButtonText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  listSection: {
    flex: 1,
    paddingHorizontal: 20,
  },
  reportContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  workerCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  workerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.accentTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  workerInfo: {
    flex: 1,
  },
  workerName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textStrong,
  },
  workerPosition: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },
  syncBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  syncBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyContent: {
    alignItems: 'center',
  },
  emptyText: {
    color: colors.textFaint,
    fontSize: 14,
    marginTop: 10,
    textAlign: 'center',
  },
});
