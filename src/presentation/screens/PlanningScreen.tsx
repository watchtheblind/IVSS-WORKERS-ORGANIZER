import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  FlatList,
  StyleSheet,
  Alert,
  Modal,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { container } from '../../container';
import { Worker } from '../../domain/entities/Worker';
import { ShiftConfig, RoomConfig, APP_CONFIG } from '../../domain/constants/appConfig';
import ShiftTemplate, {
  ShiftTemplateData,
  ShiftRoom,
} from '../components/ShiftTemplate';
import {
  HospitalSettings,
  DEFAULT_HOSPITAL_SETTINGS,
} from '../../domain/ports/ConfigRepository';
import { useAppTheme, ThemeColors } from '../theme/ThemeProvider';

interface RoomAssignment {
  workerIds: number[];
  externalSupports: string[];
}

export default function PlanningScreen() {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [title, setTitle] = useState('');
  const [planningDate, setPlanningDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const reportRef = useRef<View>(null);
  const [shifts, setShifts] = useState<ShiftConfig[]>([]);
  const [selectedShift, setSelectedShift] = useState<string>('');
  const [departments, setDepartments] = useState<string[]>([]);
  const [selectedDept, setSelectedDept] = useState<string>('');
  const [rooms, setRooms] = useState<RoomConfig[]>([]);
  const [notes, setNotes] = useState('');
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [assignments, setAssignments] = useState<Record<string, RoomAssignment>>({});
  const [pickerRoomId, setPickerRoomId] = useState<string | null>(null);
  const [apoyoRoomId, setApoyoRoomId] = useState<string | null>(null);
  const [apoyoName, setApoyoName] = useState('');
  const [savedReport, setSavedReport] = useState<ShiftTemplateData | null>(null);
  const [exporting, setExporting] = useState(false);
  const [hospitalSettings, setHospitalSettings] = useState<HospitalSettings>(
    DEFAULT_HOSPITAL_SETTINGS
  );
  const [workerSearch, setWorkerSearch] = useState('');

  const loadData = useCallback(async () => {
    try {
      const [workersList, deptList, shiftList, roomList, hospital] =
        await Promise.all([
          container.getWorkersUseCase.execute(),
          container.configRepository.getDepartments(),
          container.configRepository.getShifts(),
          container.configRepository.getRooms(),
          container.configRepository.getHospitalSettings(),
        ]);
      setWorkers(workersList);
      setHospitalSettings(hospital);
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
    if (name.toLowerCase() !== 'se buscará apoyo' && current.externalSupports.includes(name)) return;
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

  const isRoomUnderstaffed = (room: RoomConfig): boolean => {
    const assigned = getAssignment(room.id);
    const totalAssigned =
      assigned.workerIds.length + assigned.externalSupports.length;
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
  };

  const pad = (n: number) => String(n).padStart(2, '0');

  const formatDateLabel = (date: Date) =>
    date.toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

  const formatTimestamp = (date: Date) =>
    date.toLocaleString('es-VE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  const buildReportData = (): ShiftTemplateData => {
    const currentShiftLabel =
      shifts.find((s) => s.id === selectedShift)?.label || selectedShift;
    const uniqueWorkers = new Set<number>();
    departmentRooms.forEach((room) => {
      getAssignment(room.id).workerIds.forEach((id) => uniqueWorkers.add(id));
    });

    const rooms: ShiftRoom[] = departmentRooms.map((room) => {
      const assigned = getAssignment(room.id);
      const assignedWorkers = assigned.workerIds
        .map((id) => workers.find((w) => w.id === id))
        .filter((w): w is Worker => !!w)
        .map((w) => ({ name: w.full_name, position: w.position }));
      return {
        name: room.name,
        required: getStaffingLabel(room),
        workers: assignedWorkers,
        externalSupport: assigned.externalSupports,
        complete: !isRoomUnderstaffed(room),
      };
    });

    return {
      appName: APP_CONFIG.appName,
      hospitalName: hospitalSettings.hospitalName || undefined,
      logoUri: hospitalSettings.logoUri || undefined,
      showLogo: hospitalSettings.showLogo,
      title: title.trim(),
      dateLabel: formatDateLabel(planningDate),
      shiftLabel: currentShiftLabel,
      department: selectedDept,
      totalWorkers: uniqueWorkers.size,
      rooms,
      notes: notes.trim(),
      generatedAtLabel: formatTimestamp(new Date()),
    };
  };

  const handleExportImage = async () => {
    if (!reportRef.current) {
      Alert.alert('Error', 'La vista de la planificación no está lista.');
      return;
    }
    setExporting(true);
    try {
      const now = new Date();
      const fileStamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(
        now.getDate()
      )}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
      await container.generateReportImageUseCase.execute(reportRef, {
        fileName: `planificacion_${fileStamp}`,
        dialogTitle: `Compartir Planificación - ${title.trim()}`,
      });
    } catch (error) {
      Alert.alert(
        'Error',
        'No se pudo generar o compartir la imagen de la planificación.'
      );
      console.error('Planning export error:', error);
    } finally {
      setExporting(false);
    }
  };

  const closeReport = () => {
    setSavedReport(null);
    setTitle('');
    setNotes('');
    setAssignments({});
  };

  const handleSavePlanning = () => {
    if (!title.trim()) {
      Alert.alert('Atención', 'Por favor ingresa un título para la planificación.');
      return;
    }

    const totalAssigned = departmentRooms.reduce(
      (acc, room) => {
        const assigned = getAssignment(room.id);
        return acc + assigned.workerIds.length + assigned.externalSupports.length;
      },
      0
    );
    if (totalAssigned === 0) {
      Alert.alert(
        'Sin personal asignado',
        'Asigna al menos un trabajador o apoyo externo para poder guardar la planificación.'
      );
      return;
    }

    const understaffed = departmentRooms.filter(isRoomUnderstaffed);

    const confirmSave = () => {
      setSavedReport(buildReportData());
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
            <MaterialCommunityIcons name="calendar-plus" size={28} color={colors.accent} />
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
            placeholderTextColor={colors.textMuted}
            value={title}
            onChangeText={setTitle}
          />
        </View>

        {/* Planning Date */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Fecha de la Planificación</Text>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowDatePicker((prev) => !prev)}
          >
            <View style={styles.dateIconContainer}>
              <MaterialCommunityIcons
                name="calendar-month"
                size={22}
                color={colors.accent}
              />
            </View>
            <View style={styles.dateInfo}>
              <Text style={styles.dateLabel}>
                {formatDateLabel(planningDate)}
              </Text>
              <Text style={styles.dateHint}>
                {planningDate.toDateString() === new Date().toDateString()
                  ? 'Fecha actual · Toca para cambiar'
                  : 'Toca para cambiar la fecha'}
              </Text>
            </View>
            <MaterialCommunityIcons
              name="chevron-down"
              size={22}
              color={colors.textMuted}
            />
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={planningDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'inline' : 'default'}
              onValueChange={(_event, date) => {
                setPlanningDate(date);
                if (Platform.OS !== 'ios') {
                  setShowDatePicker(false);
                }
              }}
              onDismiss={() => setShowDatePicker(false)}
            />
          )}
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
                    color={isSelected ? '#FFFFFF' : colors.textMuted}
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
                    color={isSelected ? colors.accent : colors.textFaint}
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
                                color={colors.success}
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
                                  color={colors.danger}
                                />
                              </TouchableOpacity>
                            </View>
                          );
                        })}
                        {assignment.externalSupports.map((name, index) => (
                          <View key={`${name}-${index}`} style={styles.assignedRow}>
                            <MaterialCommunityIcons
                              name="account-plus-outline"
                              size={18}
                              color={colors.purple}
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
                                color={colors.danger}
                              />
                            </TouchableOpacity>
                          </View>
                        ))}
                      </View>
                    )}

                    <View style={styles.roomActionsRow}>
                      <TouchableOpacity
                        style={styles.roomActionBtn}
                        onPress={() => {
                          setPickerRoomId(room.id);
                          setWorkerSearch('');
                        }}
                      >
                        <MaterialCommunityIcons
                          name="account-plus"
                          size={18}
                          color={colors.accent}
                        />
                        <Text style={styles.roomActionText}>
                          Añadir Trabajador
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.roomActionBtn}
                        onPress={() => {
                          setApoyoRoomId(room.id);
                          setApoyoName('Se Buscará Apoyo');
                        }}
                      >
                        <MaterialCommunityIcons
                          name="account-plus-outline"
                          size={18}
                          color={colors.purple}
                        />
                        <Text style={styles.roomActionText}>Apoyo Externo</Text>
                      </TouchableOpacity>
                    </View>

                    {apoyoRoomId === room.id && (
                      <View style={styles.apoyoRow}>
                        <TextInput
                          style={[styles.input, styles.apoyoInput]}
                          placeholder="Nombre del apoyo externo"
                          placeholderTextColor={colors.textMuted}
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
            placeholderTextColor={colors.textMuted}
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
              <TouchableOpacity
                onPress={() => {
                  setPickerRoomId(null);
                  setWorkerSearch('');
                }}
              >
                <MaterialCommunityIcons name="close" size={22} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
            <View style={styles.modalSearchBox}>
              <MaterialCommunityIcons name="magnify" size={18} color={colors.textFaint} />
              <TextInput
                style={styles.modalSearchInput}
                placeholder="Buscar trabajador por nombre o cargo..."
                placeholderTextColor={colors.textFaint}
                value={workerSearch}
                onChangeText={setWorkerSearch}
                autoCapitalize="words"
              />
              {workerSearch.length > 0 && (
                <TouchableOpacity onPress={() => setWorkerSearch('')}>
                  <MaterialCommunityIcons
                    name="close-circle"
                    size={18}
                    color={colors.textFaint}
                  />
                </TouchableOpacity>
              )}
            </View>
            {(() => {
              const modalWorkers = workers.filter(
                (w) =>
                  w.full_name
                    .toLowerCase()
                    .includes(workerSearch.toLowerCase()) ||
                  w.position
                    .toLowerCase()
                    .includes(workerSearch.toLowerCase())
              );
              if (modalWorkers.length === 0) {
                return (
                  <Text style={styles.emptyNotice}>
                    {workers.length === 0
                      ? 'No hay trabajadores registrados.'
                      : 'Sin resultados para la búsqueda.'}
                  </Text>
                );
              }
              return (
                <FlatList
                  data={modalWorkers}
                  keyExtractor={(item) => String(item.id)}
                  keyboardShouldPersistTaps="handled"
                  style={styles.modalScroll}
                  showsVerticalScrollIndicator={false}
                  renderItem={({ item: worker }) => {
                    const isSelected = pickerRoomId
                      ? getAssignment(pickerRoomId).workerIds.includes(
                          worker.id!
                        )
                      : false;
                    return (
                      <TouchableOpacity
                        key={worker.id}
                        style={[
                          styles.modalWorkerRow,
                          isSelected && styles.modalWorkerRowActive,
                        ]}
                        onPress={() =>
                          pickerRoomId &&
                          toggleRoomWorker(pickerRoomId, worker.id!)
                        }
                      >
                        <MaterialCommunityIcons
                          name={
                            isSelected
                              ? 'checkbox-marked-circle'
                              : 'checkbox-blank-circle-outline'
                          }
                          size={22}
                          color={isSelected ? colors.success : colors.textFaint}
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
                  }}
                />
              );
            })()}
          </View>
        </View>
      </Modal>

      {/* Report Preview Modal */}
      <Modal
        visible={!!savedReport}
        transparent
        animationType="fade"
        onRequestClose={closeReport}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.reportModalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Planificación Guardada</Text>
              <TouchableOpacity onPress={closeReport}>
                <MaterialCommunityIcons name="close" size={22} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
            <ScrollView
              style={styles.reportScroll}
              contentContainerStyle={styles.reportScrollContent}
            >
              {savedReport && <ShiftTemplate data={savedReport} />}
            </ScrollView>
            <TouchableOpacity
              style={[styles.exportButton, exporting && styles.buttonDisabled]}
              onPress={handleExportImage}
              disabled={exporting}
            >
              {exporting ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <MaterialCommunityIcons
                    name="image-plus"
                    size={20}
                    color="#FFFFFF"
                    style={{ marginRight: 8 }}
                  />
                  <Text style={styles.exportButtonText}>Compartir Imagen</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Off-screen capture target */}
      {savedReport && (
        <View style={styles.offscreenCapture} pointerEvents="none">
          <View ref={reportRef} collapsable={false}>
            <ShiftTemplate data={savedReport} />
          </View>
        </View>
      )}
    </View>
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
    backgroundColor: colors.accentTint,
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
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 10,
  },
  sectionHint: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 12,
    lineHeight: 16,
  },
  selectedCountBadge: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.accent,
    backgroundColor: colors.accentTint,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: colors.textStrong,
    borderWidth: 1,
    borderColor: colors.border,
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
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.accentDark,
    borderColor: colors.accent,
  },
  chipText: {
    color: colors.textMuted,
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
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  shiftCardActive: {
    borderColor: colors.accent,
    backgroundColor: colors.accentTint,
  },
  shiftLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  shiftLabelActive: {
    color: colors.accent,
    fontWeight: '700',
  },
  workerListContainer: {
    gap: 8,
  },
  workerSelectCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'space-between',
  },
  workerSelectCardActive: {
    borderColor: colors.success,
    backgroundColor: colors.successTint,
  },
  workerSelectInfo: {
    flex: 1,
  },
  workerSelectName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textStrong,
  },
  workerSelectPosition: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  roomAssignList: {
    gap: 12,
  },
  roomAssignCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
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
    color: colors.textStrong,
    flex: 1,
  },
  roomAssignReqBadge: {
    backgroundColor: colors.dangerTint,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginLeft: 8,
  },
  roomAssignReqText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.danger,
  },
  assignedList: {
    gap: 6,
    marginBottom: 10,
  },
  assignedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  assignedInfo: {
    flex: 1,
    marginLeft: 8,
  },
  assignedName: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  assignedPosition: {
    fontSize: 11,
    color: colors.textMuted,
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
    backgroundColor: colors.background,
    borderRadius: 10,
    paddingVertical: 10,
    gap: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  roomActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
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
    backgroundColor: colors.accentDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyNotice: {
    color: colors.textFaint,
    fontSize: 13,
    fontStyle: 'italic',
    paddingVertical: 10,
  },
  saveButton: {
    backgroundColor: colors.accentDark,
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
    backgroundColor: colors.surface,
    borderRadius: 18,
    width: '100%',
    maxHeight: '80%',
    borderWidth: 1,
    borderColor: colors.border,
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
    color: colors.textStrong,
  },
  modalScroll: {
    maxHeight: 400,
  },
  modalSearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
    gap: 8,
  },
  modalSearchInput: {
    flex: 1,
    color: colors.textStrong,
    fontSize: 14,
    padding: 0,
  },
  modalWorkerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalWorkerRowActive: {
    borderColor: colors.success,
    backgroundColor: colors.successTint,
  },
  modalWorkerInfo: {
    flex: 1,
    marginLeft: 10,
  },
  modalWorkerName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textStrong,
  },
  modalWorkerPosition: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 1,
  },
  /* Date Picker */
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  dateIconContainer: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: colors.accentTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateInfo: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textStrong,
    textTransform: 'capitalize',
  },
  dateHint: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  /* Report Modal */
  reportModalContainer: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    width: '100%',
    maxHeight: '85%',
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
  },
  reportScroll: {
    flexGrow: 0,
  },
  reportScrollContent: {
    paddingBottom: 4,
  },
  exportButton: {
    backgroundColor: colors.accentDark,
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  exportButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  offscreenCapture: {
    position: 'absolute',
    left: -99999,
    top: 0,
    width: 360,
  },
});