import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  StatusBar,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { container } from '../../container';
import { Worker } from '../../domain/entities/Worker';

export default function HomeScreen() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [fullName, setFullName] = useState('');
  const [position, setPosition] = useState('');
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
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

    // Start network listener for automatic sync
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
      Alert.alert('Validation Error', 'Please fill in both Full Name and Position.');
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
      await loadWorkers();

      // Trigger sync if online
      if (isConnected) {
        handleSync();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to add worker. Please try again.');
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
      Alert.alert('Error', 'Report view is not ready.');
      return;
    }

    try {
      await container.generateReportImageUseCase.execute(reportRef);
    } catch (error) {
      Alert.alert('Error', 'Failed to generate or share report image.');
      console.error('Report generation error:', error);
    }
  };

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const renderWorkerItem = ({ item }: { item: Worker }) => (
    <View style={styles.workerCard}>
      <View style={styles.workerInfo}>
        <Text style={styles.workerName}>{item.full_name}</Text>
        <Text style={styles.workerPosition}>{item.position}</Text>
      </View>
      <View
        style={[
          styles.syncBadge,
          { backgroundColor: item.synced ? '#10B981' : '#F59E0B' },
        ]}
      >
        <Text style={styles.syncBadgeText}>
          {item.synced ? '✓ Synced' : '⏳ Pending'}
        </Text>
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="light-content" backgroundColor="#1E293B" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Daily Worker Report</Text>
        <Text style={styles.headerDate}>{today}</Text>
        <View style={styles.connectionStatus}>
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

      {/* Add Worker Form */}
      <View style={styles.formSection}>
        <Text style={styles.sectionTitle}>Register Worker</Text>
        <TextInput
          style={styles.input}
          placeholder="Full Name"
          placeholderTextColor="#94A3B8"
          value={fullName}
          onChangeText={setFullName}
        />
        <TextInput
          style={styles.input}
          placeholder="Position / Job Title"
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
            <Text style={styles.primaryButtonText}>+ Add Worker</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={[styles.secondaryButton, syncing && styles.buttonDisabled]}
          onPress={handleSync}
          disabled={syncing}
        >
          {syncing ? (
            <ActivityIndicator color="#3B82F6" size="small" />
          ) : (
            <Text style={styles.secondaryButtonText}>🔄 Sync Now</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={handleGenerateReport}
        >
          <Text style={styles.secondaryButtonText}>📸 Export Report</Text>
        </TouchableOpacity>
      </View>

      {/* Worker List (also serves as the report capture view) */}
      <View style={styles.listSection}>
        <Text style={styles.sectionTitle}>
          Workers ({workers.length})
        </Text>
        <View ref={reportRef} collapsable={false} style={styles.reportContainer}>
          <FlatList
            data={workers}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderWorkerItem}
            ListEmptyComponent={
              <Text style={styles.emptyText}>
                No workers registered yet. Add your first worker above.
              </Text>
            }
            contentContainerStyle={workers.length === 0 && styles.emptyContainer}
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
  header: {
    backgroundColor: '#1E293B',
    paddingTop: 56,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#F8FAFC',
    letterSpacing: 0.3,
  },
  headerDate: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 4,
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  connectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  connectionText: {
    fontSize: 13,
    color: '#CBD5E1',
  },
  formSection: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E2E8F0',
    marginBottom: 12,
    letterSpacing: 0.2,
  },
  input: {
    backgroundColor: '#1E293B',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#F8FAFC',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  primaryButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  actionRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 10,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  secondaryButtonText: {
    color: '#CBD5E1',
    fontSize: 14,
    fontWeight: '500',
  },
  listSection: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  reportContainer: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  workerCard: {
    backgroundColor: '#1E293B',
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#334155',
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
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  syncBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  emptyText: {
    color: '#64748B',
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 32,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
  },
});
