import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { container } from '../../container';
import { Worker } from '../../domain/entities/Worker';
import { ShiftConfig, APP_CONFIG } from '../../domain/constants/appConfig';

export default function PlanningScreen() {
  const [title, setTitle] = useState('');
  const [shifts, setShifts] = useState<ShiftConfig[]>(APP_CONFIG.defaultShifts);
  const [selectedShift, setSelectedShift] = useState<string>('morning');
  const [departments, setDepartments] = useState<string[]>(APP_CONFIG.defaultDepartments);
  const [selectedDept, setSelectedDept] = useState<string>(APP_CONFIG.defaultDepartments[0] || '');
  const [notes, setNotes] = useState('');
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [selectedWorkers, setSelectedWorkers] = useState<number[]>([]);

  const loadData = useCallback(async () => {
    try {
      const [workersList, deptList, shiftList] = await Promise.all([
        container.getWorkersUseCase.execute(),
        container.configRepository.getDepartments(),
        container.configRepository.getShifts(),
      ]);
      setWorkers(workersList);
      if (deptList.length > 0) {
        setDepartments(deptList);
        setSelectedDept((prev) => (deptList.includes(prev) ? prev : deptList[0]));
      }
      if (shiftList.length > 0) {
        setShifts(shiftList);
        setSelectedShift((prev) =>
          shiftList.some((s) => s.id === prev) ? prev : shiftList[0].id
        );
      }
    } catch (error) {
      console.error('Error loading planning configuration:', error);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const toggleWorker = (id: number) => {
    if (selectedWorkers.includes(id)) {
      setSelectedWorkers(selectedWorkers.filter((wId) => wId !== id));
    } else {
      setSelectedWorkers([...selectedWorkers, id]);
    }
  };

  const handleSavePlanning = () => {
    if (!title.trim()) {
      Alert.alert('Atención', 'Por favor ingresa un título para la planificación.');
      return;
    }
    if (selectedWorkers.length === 0) {
      Alert.alert('Atención', 'Por favor selecciona al menos un trabajador para la guardia.');
      return;
    }

    const currentShiftLabel = shifts.find((s) => s.id === selectedShift)?.label || selectedShift;

    Alert.alert(
      '¡Planificación Creada!',
      `Guardia asignada con éxito:\n\n• Área: ${selectedDept}\n• Turno: ${currentShiftLabel}\n• Personal: ${selectedWorkers.length} asignado(s).`,
      [
        {
          text: 'Entendido',
          onPress: () => {
            setTitle('');
            setNotes('');
            setSelectedWorkers([]);
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
          <MaterialCommunityIcons name="calendar-plus" size={28} color="#38BDF8" />
        </View>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>Crear Planificación</Text>
          <Text style={styles.headerSubtitle}>
            Asignación de guardias y turnos de trabajo
          </Text>
        </View>
      </View>

      {/* Title input */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Título de la Planificación</Text>
        <TextInput
          style={styles.input}
          placeholder="Ej. Guardia Fin de Semana - Emergencia"
          placeholderTextColor="#94A3B8"
          value={title}
          onChangeText={setTitle}
        />
      </View>

      {/* Department Selector */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Área / Departamento</Text>
        <View style={styles.chipRow}>
          {departments.map((dept) => {
            const isSelected = selectedDept === dept;
            return (
              <TouchableOpacity
                key={dept}
                style={[styles.chip, isSelected && styles.chipActive]}
                onPress={() => setSelectedDept(dept)}
              >
                <MaterialCommunityIcons
                  name="domain"
                  size={16}
                  color={isSelected ? '#FFFFFF' : '#94A3B8'}
                  style={{ marginRight: 6 }}
                />
                <Text
                  style={[styles.chipText, isSelected && styles.chipTextActive]}
                >
                  {dept}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Shift Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Seleccionar Turno / Horario</Text>
        <View style={styles.shiftsGrid}>
          {shifts.map((shift) => {
            const isSelected = selectedShift === shift.id;
            return (
              <TouchableOpacity
                key={shift.id}
                style={[styles.shiftCard, isSelected && styles.shiftCardActive]}
                onPress={() => setSelectedShift(shift.id)}
              >
                <MaterialCommunityIcons
                  name={(shift.icon || 'clock-outline') as any}
                  size={24}
                  color={isSelected ? '#38BDF8' : '#64748B'}
                />
                <Text
                  style={[
                    styles.shiftLabel,
                    isSelected && styles.shiftLabelActive,
                  ]}
                >
                  {shift.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Worker Selector */}
      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Asignar Personal</Text>
          <Text style={styles.selectedCountBadge}>
            {selectedWorkers.length} seleccionados
          </Text>
        </View>
        {workers.length === 0 ? (
          <Text style={styles.emptyNotice}>
            No hay trabajadores registrados aún. Ve a la pestaña
            de Trabajadores para añadirlos.
          </Text>
        ) : (
          <View style={styles.workerListContainer}>
            {workers.map((worker) => {
              const isSelected = selectedWorkers.includes(worker.id!);
              return (
                <TouchableOpacity
                  key={worker.id}
                  style={[
                    styles.workerSelectCard,
                    isSelected && styles.workerSelectCardActive,
                  ]}
                  onPress={() => toggleWorker(worker.id!)}
                >
                  <View style={styles.workerSelectInfo}>
                    <Text style={styles.workerSelectName}>
                      {worker.full_name}
                    </Text>
                    <Text style={styles.workerSelectPosition}>
                      {worker.position}
                    </Text>
                  </View>
                  <MaterialCommunityIcons
                    name={
                      isSelected
                        ? 'checkbox-marked-circle'
                        : 'checkbox-blank-circle-outline'
                    }
                    size={24}
                    color={isSelected ? '#10B981' : '#64748B'}
                  />
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>

      {/* Notes */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Observaciones / Notas Especiales</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Instrucciones para el personal de guardia..."
          placeholderTextColor="#94A3B8"
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={3}
        />
      </View>

      {/* Submit Button */}
      <TouchableOpacity
        style={styles.saveButton}
        onPress={handleSavePlanning}
      >
        <MaterialCommunityIcons
          name="check-circle"
          size={20}
          color="#FFFFFF"
          style={{ marginRight: 8 }}
        />
        <Text style={styles.saveButtonText}>Guardar Planificación</Text>
      </TouchableOpacity>
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
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
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
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#E2E8F0',
    marginBottom: 10,
  },
  selectedCountBadge: {
    fontSize: 12,
    fontWeight: '600',
    color: '#38BDF8',
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  input: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#334155',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  chipActive: {
    backgroundColor: '#0284C7',
    borderColor: '#38BDF8',
  },
  chipText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '500',
  },
  chipTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  shiftsGrid: {
    gap: 8,
  },
  shiftCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 12,
  },
  shiftCardActive: {
    borderColor: '#38BDF8',
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
  },
  shiftLabel: {
    fontSize: 14,
    color: '#CBD5E1',
    fontWeight: '500',
  },
  shiftLabelActive: {
    color: '#38BDF8',
    fontWeight: '700',
  },
  workerListContainer: {
    gap: 8,
  },
  workerSelectCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#334155',
    justifyContent: 'space-between',
  },
  workerSelectCardActive: {
    borderColor: '#10B981',
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
  },
  workerSelectInfo: {
    flex: 1,
  },
  workerSelectName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F8FAFC',
  },
  workerSelectPosition: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  emptyNotice: {
    color: '#64748B',
    fontSize: 13,
    fontStyle: 'italic',
    paddingVertical: 10,
  },
  saveButton: {
    backgroundColor: '#0284C7',
    borderRadius: 12,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
