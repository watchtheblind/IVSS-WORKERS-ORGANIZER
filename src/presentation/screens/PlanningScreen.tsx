import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Modal,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { container } from '../../container';
import { Worker } from '../../domain/entities/Worker';
import { ShiftConfig, RoomConfig, APP_CONFIG } from '../../domain/constants/appConfig';

interface RoomAssignment {
  workerIds: number[];
  externalSupports: string[];
}

export default function PlanningScreen() {
  const [title, setTitle] = useState('');
  const [shifts, setShifts] = useState<ShiftConfig[]>(APP_CONFIG.defaultShifts);
  const [selectedShift, setSelectedShift] = useState<string>('morning');
  const [departments, setDepartments] = useState<string[]>(APP_CONFIG.defaultDepartments);
  const [selectedDept, setSelectedDept] = useState<string>(APP_CONFIG.defaultDepartments[0] || '');
  const [rooms, setRooms] = useState<RoomConfig[]>([]);
  const [notes, setNotes] = useState('');
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [assignments, setAssignments] = useState<Record<string, RoomAssignment>>({});
  const [pickerRoomId, setPickerRoomId] = useState<string | null>(null);
  const [apoyoRoomId, setApoyoRoomId] = useState<string | null>(null);
  const [apoyoName, setApoyoName] = useState('');

  const loadData = useCallback(async () => {
    try {
      const [workersList, deptList, shiftList, roomList] = await Promise.all([
        container.getWorkersUseCase.execute(),
        container.configRepository.getDepartments(),
        container.configRepository.getShifts(),
        container.configRepository.getRooms(),
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
      setRooms(roomList);
    } catch (error) {
      console.error('Error loading planning configuration:', error);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const departmentRooms = rooms.filter((r) => r.department === selectedDept);


  const getAssignment = (roomId: string): RoomAssignment =>
    assignments[roomId] || { workerIds: [], externalSupports: [] };

  const setAssignment = (roomId: string, next: RoomAssignment) => {
    setAssignments((prev) => ({ ...prev, [roomId]: next }));
  };

  const toggleRoomWorker = (roomId: string, workerId: number) => {
    const current = getAssignment(roomId);
    const workerIds = current.workerIds.includes(workerId)
      ? current.workerIds.filter((id) => id !== workerId)
      : [...current.workerIds, workerId];
    setAssignment(roomId, { ...current, workerIds });
  };

  const removeAssignedWorker = (roomId: string, workerId: number) => {
    const current = getAssignment(roomId);
    setAssignment(roomId, {
      ...current,
      workerIds: current.workerIds.filter((id) => id !== workerId),
    });
  };

  const addExternalSupport = (roomId: string) => {
    const name = apoyoName.trim();
    if (!name) return;
    const current = getAssignment(roomId);
    if (current.externalSupports.includes(name)) return;
    setAssignment(roomId, {
      ...current,
      externalSupports: [...current.externalSupports, name],
    });
    setApoyoName('');
    setApoyoRoomId(null);
  };

  const removeExternalSupport = (roomId: string, name: string) => {
    const current = getAssignment(roomId);
    setAssignment(roomId, {
      ...current,
      externalSupports: current.externalSupports.filter((n) => n !== name),
    });
  };

  const getStaffingLabel = (room: RoomConfig) => {
    if (room.staffingMode === 'by_position' && room.positions.length > 0) {
      return room.positions.map((p) => `${p.count} ${p.position}`).join(' · ');
    }
    const count = room.staffCount || 0;
    return `${count} ${count === 1 ? 'trabajador' : 'trabajadores'}`;
  };

  const handleSavePlanning = () => {
    if (!title.trim()) {
      Alert.alert('Atención', 'Por favor ingresa un título para la planificación.');
      return;
    }

    const understaffed = departmentRooms.filter((room) => {
      const assigned = getAssignment(room.id);
      const totalAssigned = assigned.workerIds.length + assigned.externalSupports.length;
      if (room.staffingMode === 'total' && room.staffCount > 0) {
        return totalAssigned < room.staffCount;
      }
      if (room.staffingMode === 'by_position') {
        return (room.positions || []).some((req) => {
          const assignedPos = workers
            .filter((w) => assigned.workerIds.includes(w.id!))
            .filter((w) => w.position === req.position).length;
          return assignedPos < req.count;
        });
      }
      return false;
    });

    const buildSummary = () => {
      const currentShiftLabel =
        shifts.find((s) => s.id === selectedShift)?.label || selectedShift;
      const uniqueWorkers = new Set<number>();
      departmentRooms.forEach((room) => {
        getAssignment(room.id).workerIds.forEach((id) => uniqueWorkers.add(id));
      });
      
      const roomLines = departmentRooms
        .map((room) => {
          const assigned = getAssignment(room.id);
          const parts: string[] = [];
          if (assigned.workerIds.length > 0) {
            parts.push(`${assigned.workerIds.length} asignado(s)`);
          }
          if (assigned.externalSupports.length > 0) {
            parts.push(`${assigned.externalSupports.length} apoyo externo`);
          }
          const req = getStaffingLabel(room);
          const status = parts.length === 0 ? 'Sin personal' : parts.join(', ');
          const incomplete =
            understaffed.some((r) => r.id === room.id) ? ' ⚠' : '';
          return `• ${room.name}: ${status} (requiere ${req})${incomplete}`;
        })
        .join('\n');

      return `Guardia asignada con éxito:\n\n• Área: ${selectedDept}\n• Turno: ${currentShiftLabel}\n• Personal en turno: ${uniqueWorkers.size}\n\nSALAS:\n${roomLines}`;
    };

    const confirmSave = () => {
      Alert.alert('¡Planificación Creada!', buildSummary(), [
        {
          text: 'Entendido',
          onPress: () => {
            setTitle('');
            setNotes('');
            setAssignments({});
          },
        },
      ]);
    };

    if (understaffed.length > 0) {
      Alert.alert(
        'Salas sin personal completo',
        'Las siguientes salas no cumplen con el personal requerido:\n\n' +
          understaffed.map((r) => `• ${r.name}`).join('\n') +
          '\n\n¿Deseas guardar de todos modos?',
        [
          { text: 'Revisar', style: 'cancel' },
          { text: 'Guardar de todos modos', onPress: confirmSave },
        ]
      );
    } else {
      confirmSave();
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header Banner */}
        <View style={styles.headerBanner}>
          <View style={styles.headerIconContainer}>
            <MaterialCommunityIcons name="calendar-plus" size={28} color="#38BDF8" />
          </View>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Crear Planificación</Text>
            <Text style={styles.headerSubtitle}>
              Asignación de guardias, turnos y salas
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
                  onPress={() => {
                    setSelectedDept(dept);
                    setAssignments({});
                  }}
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


        {/* Room Assignment Form */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Asignación de Salas</Text>
            <Text style={styles.selectedCountBadge}>
              {departmentRooms.length} sala(s)
            </Text>
          </View>
          <Text style={styles.sectionHint}>
            Asigna el personal por sala del área seleccionada. Si un trabajador
            no está en la lista, añádelo como apoyo externo.
          </Text>

          {departmentRooms.length === 0 ? (
            <Text style={styles.emptyNotice}>
              No hay salas registradas para esta área. Ve a la pestaña de Salas
              para crearlas.
            </Text>
          ) : (
            <View style={styles.roomAssignList}>
              {departmentRooms.map((room) => {
                const assignment = getAssignment(room.id);
                return (
                  <View key={room.id} style={styles.roomAssignCard}>
                    <View style={styles.roomAssignHeader}>
                      <Text style={styles.roomAssignName}>{room.name}</Text>
                      <View style={styles.roomAssignReqBadge}>
                        <Text style={styles.roomAssignReqText}>
                          Requiere: {getStaffingLabel(room)}
                        </Text>
                      </View>
                    </View>

                    {assignment.workerIds.length === 0 &&
                    assignment.externalSupports.length === 0 ? (
                      <Text style={styles.emptyNotice}>
                        Sin personal asignado a esta sala.
                      </Text>
                    ) : (
                      <View style={styles.assignedList}>
                        {assignment.workerIds.map((id) => {
                          const worker = workers.find((w) => w.id === id);
                          if (!worker) return null;
                          return (
                            <View key={id} style={styles.assignedRow}>
                              <MaterialCommunityIcons
                                name="account-check"
                                size={18}
                                color="#10B981"
                              />
                              <View style={styles.assignedInfo}>
                                <Text style={styles.assignedName}>
                                  {worker.full_name}
                                </Text>
                                <Text style={styles.assignedPosition}>
                                  {worker.position}
                                </Text>
                              </View>
                              <TouchableOpacity
                                onPress={() =>
                                  removeAssignedWorker(room.id, id)
                                }
                              >
                                <MaterialCommunityIcons
                                  name="close-circle"
                                  size={18}
                                  color="#EF4444"
                                />
                              </TouchableOpacity>
                            </View>
                          );
                        })}
                        {assignment.externalSupports.map((name) => (
                          <View key={name} style={styles.assignedRow}>
                            <MaterialCommunityIcons
                              name="account-plus-outline"
                              size={18}
                              color="#A78BFA"
                            />
                            <View style={styles.assignedInfo}>
                              <Text style={styles.assignedName}>{name}</Text>
                              <Text style={styles.assignedPosition}>
                                Apoyo externo
                              </Text>
                            </View>
                            <TouchableOpacity
                              onPress={() =>
                                removeExternalSupport(room.id, name)
                              }
                            >
                              <MaterialCommunityIcons
                                name="close-circle"
                                size={18}
                                color="#EF4444"
                              />
                            </TouchableOpacity>
                          </View>
                        ))}
                      </View>
                    )}

                    <View style={styles.roomActionsRow}>
                      <TouchableOpacity
                        style={styles.roomActionBtn}
                        onPress={() => setPickerRoomId(room.id)}
                      >
                        <MaterialCommunityIcons
                          name="account-plus"
                          size={18}
                          color="#38BDF8"
                        />
                        <Text style={styles.roomActionText}>
                          Añadir Trabajador
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.roomActionBtn}
                        onPress={() => {
                          setApoyoRoomId(room.id);
                          setApoyoName('Por Buscar');
                        }}
                      >
                        <MaterialCommunityIcons
                          name="account-plus-outline"
                          size={18}
                          color="#A78BFA"
                        />
                        <Text style={styles.roomActionText}>Apoyo Externo</Text>
                      </TouchableOpacity>
                    </View>

                    {apoyoRoomId === room.id && (
                      <View style={styles.apoyoRow}>
                        <TextInput
                          style={[styles.input, styles.apoyoInput]}
                          placeholder="Nombre del apoyo externo"
                          placeholderTextColor="#94A3B8"
                          value={apoyoName}
                          onChangeText={setApoyoName}
                        />
                        <TouchableOpacity
                          style={styles.apoyoAddBtn}
                          onPress={() => addExternalSupport(room.id)}
                        >
                          <MaterialCommunityIcons
                            name="check"
                            size={20}
                            color="#FFFFFF"
                          />
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
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

      {/* Worker Picker Modal */}
      <Modal
        visible={!!pickerRoomId}
        transparent
        animationType="fade"
        onRequestClose={() => setPickerRoomId(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Añadir Trabajadores</Text>
              <TouchableOpacity onPress={() => setPickerRoomId(null)}>
                <MaterialCommunityIcons name="close" size={22} color="#94A3B8" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScroll}>
              {workers.length === 0 ? (
                <Text style={styles.emptyNotice}>
                  No hay trabajadores registrados.
                </Text>
              ) : (
                workers.map((worker) => {
                  const isSelected = pickerRoomId
                    ? getAssignment(pickerRoomId).workerIds.includes(worker.id!)
                    : false;
                  return (
                    <TouchableOpacity
                      key={worker.id}
                      style={[
                        styles.modalWorkerRow,
                        isSelected && styles.modalWorkerRowActive,
                      ]}
                      onPress={() =>
                        pickerRoomId && toggleRoomWorker(pickerRoomId, worker.id!)
                      }
                    >
                      <MaterialCommunityIcons
                        name={
                          isSelected
                            ? 'checkbox-marked-circle'
                            : 'checkbox-blank-circle-outline'
                        }
                        size={22}
                        color={isSelected ? '#10B981' : '#64748B'}
                      />
                      <View style={styles.modalWorkerInfo}>
                        <Text style={styles.modalWorkerName}>
                          {worker.full_name}
                        </Text>
                        <Text style={styles.modalWorkerPosition}>
                          {worker.position}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
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
  sectionHint: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 12,
    lineHeight: 16,
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
  roomAssignList: {
    gap: 12,
  },
  roomAssignCard: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  roomAssignHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  roomAssignName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F8FAFC',
    flex: 1,
  },
  roomAssignReqBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginLeft: 8,
  },
  roomAssignReqText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FCA5A5',
  },
  assignedList: {
    gap: 6,
    marginBottom: 10,
  },
  assignedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  assignedInfo: {
    flex: 1,
    marginLeft: 8,
  },
  assignedName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#E2E8F0',
  },
  assignedPosition: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 1,
  },
  roomActionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  roomActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 10,
    paddingVertical: 10,
    gap: 6,
    borderWidth: 1,
    borderColor: '#334155',
  },
  roomActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#CBD5E1',
  },
  apoyoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
  },
  apoyoInput: {
    flex: 1,
    paddingVertical: 10,
  },
  apoyoAddBtn: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: '#0284C7',
    alignItems: 'center',
    justifyContent: 'center',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#1E293B',
    borderRadius: 18,
    width: '100%',
    maxHeight: '80%',
    borderWidth: 1,
    borderColor: '#334155',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  modalScroll: {
    maxHeight: 400,
  },
  modalWorkerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  modalWorkerRowActive: {
    borderColor: '#10B981',
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
  },
  modalWorkerInfo: {
    flex: 1,
    marginLeft: 10,
  },
  modalWorkerName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F8FAFC',
  },
  modalWorkerPosition: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 1,
  },
});