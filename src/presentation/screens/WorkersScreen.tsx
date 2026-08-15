import React, { useState, useEffect, useRef, useCallback } from 'react';
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

export default function WorkersScreen() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [fullName, setFullName] = useState('');
  const [position, setPosition] = useState('');
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const reportRef = useRef<View>(null);

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
      await loadWorkers();
    } catch (error) {
      console.error('Sync error:', error);
    } finally {
      setSyncing(false);
    }
  };

  const handleGenerateReport = async () => {
    if (!reportRef.current) {
      Alert.alert('Error', 'La vista del reporte no está lista.');
      return;
    }

    try {
      await container.generateReportImageUseCase.execute(reportRef);
    } catch (error) {
      Alert.alert('Error', 'No se pudo generar o compartir la imagen del reporte.');
      console.error('Report generation error:', error);
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
        <MaterialCommunityIcons name="account" size={24} color="#38BDF8" />
      </View>
      <View style={styles.workerInfo}>
        <Text style={styles.workerName}>{item.full_name}</Text>
        <Text style={styles.workerPosition}>{item.position}</Text>
      </View>
      <View
        style={[
          styles.syncBadge,
          { backgroundColor: item.synced ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)' },
        ]}
      >
        <MaterialCommunityIcons
          name={item.synced ? 'cloud-check' : 'cloud-sync'}
          size={14}
          color={item.synced ? '#10B981' : '#F59E0B'}
          style={{ marginRight: 4 }}
        />
        <Text
          style={[
            styles.syncBadgeText,
            { color: item.synced ? '#10B981' : '#F59E0B' },
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
              { backgroundColor: isConnected ? '#10B981' : '#EF4444' },
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
          <MaterialCommunityIcons name="magnify" size={20} color="#94A3B8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por nombre o cargo..."
            placeholderTextColor="#64748B"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <MaterialCommunityIcons name="close-circle" size={18} color="#94A3B8" />
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
            placeholderTextColor="#94A3B8"
            value={fullName}
            onChangeText={setFullName}
          />
          <TextInput
            style={styles.input}
            placeholder="Cargo / Especialidad (Ej. Médico Cirujano)"
            placeholderTextColor="#94A3B8"
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
            <ActivityIndicator color="#38BDF8" size="small" />
          ) : (
            <>
              <MaterialCommunityIcons name="sync" size={18} color="#38BDF8" style={{ marginRight: 6 }} />
              <Text style={styles.secondaryButtonText}>Sincronizar</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={handleGenerateReport}
        >
          <MaterialCommunityIcons name="camera-outline" size={18} color="#10B981" style={{ marginRight: 6 }} />
          <Text style={styles.secondaryButtonText}>Exportar Reporte</Text>
        </TouchableOpacity>
      </View>

      {/* Worker List & Report Capture View */}
      <View style={styles.listSection}>
        <View ref={reportRef} collapsable={false} style={styles.reportContainer}>
          <FlatList
            data={filteredWorkers}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderWorkerItem}
            contentContainerStyle={
              filteredWorkers.length === 0 ? styles.emptyContainer : { paddingBottom: 20 }
            }
            ListEmptyComponent={
              <View style={styles.emptyContent}>
                <MaterialCommunityIcons name="account-search-outline" size={48} color="#475569" />
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
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
    color: '#F8FAFC',
  },
  screenSubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 2,
  },
  networkIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  connectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  connectionText: {
    fontSize: 12,
    color: '#CBD5E1',
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
    backgroundColor: '#1E293B',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  searchInput: {
    flex: 1,
    color: '#F8FAFC',
    fontSize: 14,
    marginLeft: 8,
  },
  toggleFormButton: {
    backgroundColor: '#0284C7',
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formSection: {
    backgroundColor: '#1E293B',
    marginHorizontal: 20,
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  formTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#E2E8F0',
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#0F172A',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#F8FAFC',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  primaryButton: {
    backgroundColor: '#0284C7',
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
    backgroundColor: '#1E293B',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  secondaryButtonText: {
    color: '#CBD5E1',
    fontSize: 13,
    fontWeight: '600',
  },
  listSection: {
    flex: 1,
    paddingHorizontal: 20,
  },
  reportContainer: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  workerCard: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  workerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
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
    color: '#F8FAFC',
  },
  workerPosition: {
    fontSize: 13,
    color: '#94A3B8',
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
    color: '#64748B',
    fontSize: 14,
    marginTop: 10,
    textAlign: 'center',
  },
});
