import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
import { RoomConfig, RoomStaffingPosition } from '../../domain/constants/appConfig';
import { useAppTheme, ThemeColors } from '../theme/ThemeProvider';

export default function RoomsScreen() {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [rooms, setRooms] = useState<RoomConfig[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [workerPositions, setWorkerPositions] = useState<string[]>([]);
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>('Todas');

  // Form State for Add / Edit Modal
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingRoomId, setEditingRoomId] = useState<string | null>(null);
  const [roomName, setRoomName] = useState('');
  const [roomDept, setRoomDept] = useState('');
  const [staffingMode, setStaffingMode] = useState<'total' | 'by_position'>('total');
  const [staffCount, setStaffCount] = useState('1');
  const [positionCounts, setPositionCounts] = useState<Record<string, number>>({});
  const [roomStatus, setRoomStatus] = useState<'available' | 'occupied' | 'maintenance'>('available');
  const [roomNotes, setRoomNotes] = useState('');

  const loadData = useCallback(async () => {
    try {
      const [deptList, roomList, workerList] = await Promise.all([
        container.configRepository.getDepartments(),
        container.configRepository.getRooms(),
        container.getWorkersUseCase.execute(),
      ]);
      setDepartments(deptList);
      setRooms(roomList);
      const positions = Array.from(new Set(workerList.map((w) => w.position).filter(Boolean))).sort();
      setWorkerPositions(positions);
      if (deptList.length > 0 && !roomDept) {
        setRoomDept(deptList[0]);
      }
    } catch (error) {
      console.error('Error loading rooms data:', error);
    }
  }, [roomDept]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openAddModal = () => {
    setEditingRoomId(null);
    setRoomName('');
    setRoomDept(departments[0] || '');
    setStaffingMode('total');
    setStaffCount('1');
    setPositionCounts(buildEmptyPositionCounts());
    setRoomStatus('available');
    setRoomNotes('');
    setIsModalVisible(true);
  };

  const buildEmptyPositionCounts = (): Record<string, number> => {
    const counts: Record<string, number> = {};
    workerPositions.forEach((p) => {
      counts[p] = 0;
    });
    return counts;
  };

  const openEditModal = (room: RoomConfig) => {
    setEditingRoomId(room.id);
    setRoomName(room.name);
    setRoomDept(room.department);
    setStaffingMode(room.staffingMode || 'total');
    setStaffCount(room.staffCount?.toString() || '1');
    const counts: Record<string, number> = {};
    workerPositions.forEach((p) => {
      counts[p] = 0;
    });
    (room.positions || []).forEach((sp) => {
      if (counts[sp.position] !== undefined) {
        counts[sp.position] = sp.count;
      }
    });
    setPositionCounts(counts);
    setRoomStatus(room.status);
    setRoomNotes(room.notes || '');
    setIsModalVisible(true);
  };

  const handleSaveRoom = async () => {
    if (!roomName.trim()) {
      Alert.alert('Campo Requerido', 'Por favor ingresa el nombre de la sala.');
      return;
    }
    if (!roomDept.trim()) {
      Alert.alert('Campo Requerido', 'Por favor selecciona un área o departamento.');
      return;
    }

    const parsedCount = parseInt(staffCount, 10) || 1;
    const positions: RoomStaffingPosition[] =
      staffingMode === 'by_position'
        ? workerPositions
            .filter((p) => (positionCounts[p] || 0) > 0)
            .map((p) => ({ position: p, count: positionCounts[p] }))
        : [];

    try {
      if (editingRoomId) {
        // Update
        const updatedRoom: RoomConfig = {
          id: editingRoomId,
          name: roomName.trim(),
          department: roomDept,
          staffingMode,
          staffCount: parsedCount,
          positions,
          status: roomStatus,
          notes: roomNotes.trim(),
        };
        const updatedList = await container.configRepository.updateRoom(updatedRoom);
        setRooms(updatedList);
        Alert.alert('¡Sala Actualizada!', 'Los cambios se han guardado con éxito.');
      } else {
        // Create new
        const newRoom: RoomConfig = {
          id: 'room_' + Date.now(),
          name: roomName.trim(),
          department: roomDept,
          staffingMode,
          staffCount: parsedCount,
          positions,
          status: roomStatus,
          notes: roomNotes.trim(),
        };
        const updatedList = await container.configRepository.addRoom(newRoom);
        setRooms(updatedList);
        Alert.alert('¡Sala Creada!', 'La nueva sala se ha registrado correctamente.');
      }
      setIsModalVisible(false);
    } catch (error) {
      Alert.alert('Error', 'No se pudo guardar la sala.');
    }
  };

  const handleDeleteRoom = (room: RoomConfig) => {
    Alert.alert(
      'Eliminar Sala',
      `¿Estás seguro de que deseas eliminar la "${room.name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              const updated = await container.configRepository.removeRoom(room.id);
              setRooms(updated);
            } catch (error) {
              Alert.alert('Error', 'No se pudo eliminar la sala.');
            }
          },
        },
      ]
    );
  };

  const filteredRooms = rooms.filter((r) => {
    if (selectedDeptFilter === 'Todas') return true;
    return r.department === selectedDeptFilter;
  });

  const getStaffingLabel = (room: RoomConfig) => {
    if (room.staffingMode === 'by_position' && room.positions.length > 0) {
      return room.positions.map((p) => `${p.count} ${p.position}`).join(' · ');
    }
    const count = room.staffCount || 0;
    return `${count} ${count === 1 ? 'Trabajador' : 'Trabajadores'}`;
  };

  const getStatusBadge = (status: RoomConfig['status']) => {
    switch (status) {
      case 'available':
        return {
          label: 'Disponible',
          color: colors.success,
          bg: colors.successTint,
          icon: 'check-circle-outline',
        };
      case 'occupied':
        return {
          label: 'Ocupada',
          color: colors.danger,
          bg: colors.dangerTint,
          icon: 'account-group-outline',
        };
      case 'maintenance':
        return {
          label: 'Mantenimiento',
          color: colors.warning,
          bg: colors.warningTint,
          icon: 'tools',
        };
      default:
        return {
          label: 'Disponible',
          color: colors.success,
          bg: colors.successTint,
          icon: 'check-circle-outline',
        };
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header Banner - Red Themed */}
        <View style={styles.headerBanner}>
          <View style={styles.headerIconContainer}>
            <MaterialCommunityIcons name="bed" size={28} color={colors.danger} />
          </View>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Gestión de Salas</Text>
            <Text style={styles.headerSubtitle}>
              Administración de salas, personal y áreas de atención
            </Text>
          </View>
        </View>

        {/* Action Button: Nueva Sala */}
        <TouchableOpacity style={styles.addMainButton} onPress={openAddModal}>
          <MaterialCommunityIcons name="plus-circle" size={22} color="#FFFFFF" />
          <Text style={styles.addMainButtonText}>Registrar Nueva Sala</Text>
        </TouchableOpacity>

        {/* Department Filter Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Filtrar por Área / Departamento</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScroll}
          >
            <TouchableOpacity
              style={[
                styles.filterChip,
                selectedDeptFilter === 'Todas' && styles.filterChipActive,
              ]}
              onPress={() => setSelectedDeptFilter('Todas')}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedDeptFilter === 'Todas' && styles.filterChipTextActive,
                ]}
              >
                Todas ({rooms.length})
              </Text>
            </TouchableOpacity>

            {departments.map((dept) => {
              const count = rooms.filter((r) => r.department === dept).length;
              const isSelected = selectedDeptFilter === dept;
              return (
                <TouchableOpacity
                  key={dept}
                  style={[
                    styles.filterChip,
                    isSelected && styles.filterChipActive,
                  ]}
                  onPress={() => setSelectedDeptFilter(dept)}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      isSelected && styles.filterChipTextActive,
                    ]}
                  >
                    {dept} ({count})
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Rooms Cards List */}
        <View style={styles.section}>
          <View style={styles.listHeaderRow}>
            <Text style={styles.sectionTitle}>
              Salas Registradas ({filteredRooms.length})
            </Text>
          </View>

          {filteredRooms.length === 0 ? (
            <View style={styles.emptyCard}>
              <MaterialCommunityIcons name="bed-empty" size={44} color={colors.textFaint} />
              <Text style={styles.emptyTitle}>No hay salas registradas</Text>
              <Text style={styles.emptySubtitle}>
                Presiona &quot;Registrar Nueva Sala&quot; para agregar una sala a esta área.
              </Text>
            </View>
          ) : (
            <View style={styles.cardsGrid}>
              {filteredRooms.map((room) => {
                const statusInfo = getStatusBadge(room.status);
                return (
                  <View key={room.id} style={styles.roomCard}>
                    <View style={styles.roomCardTop}>
                      <View style={styles.roomTitleGroup}>
                        <View style={styles.roomIconBadge}>
                          <MaterialCommunityIcons
                            name="bed-outline"
                            size={20}
                            color={colors.danger}
                          />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.roomName}>{room.name}</Text>
                          <Text style={styles.roomDept}>{room.department}</Text>
                        </View>
                      </View>

                      {/* Actions */}
                      <View style={styles.cardActions}>
                        <TouchableOpacity
                          style={styles.actionIconButton}
                          onPress={() => openEditModal(room)}
                        >
                          <MaterialCommunityIcons
                            name="pencil-outline"
                            size={20}
                            color={colors.accent}
                          />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.actionIconButton}
                          onPress={() => handleDeleteRoom(room)}
                        >
                          <MaterialCommunityIcons
                            name="trash-can-outline"
                            size={20}
                            color={colors.danger}
                          />
                        </TouchableOpacity>
                      </View>
                    </View>

                    <View style={styles.divider} />

                    {/* Room Meta Badges */}
                    <View style={styles.roomMetaRow}>
                      <View style={styles.staffingBadge}>
                        <MaterialCommunityIcons
                          name="account-group-outline"
                          size={16}
                          color={colors.textStrong}
                        />
                        <Text style={styles.staffingText}>
                          {getStaffingLabel(room)}
                        </Text>
                      </View>

                      <View
                        style={[
                          styles.statusBadge,
                          { backgroundColor: statusInfo.bg },
                        ]}
                      >
                        <MaterialCommunityIcons
                          name={statusInfo.icon as any}
                          size={14}
                          color={statusInfo.color}
                        />
                        <Text
                          style={[
                            styles.statusText,
                            { color: statusInfo.color },
                          ]}
                        >
                          {statusInfo.label}
                        </Text>
                      </View>
                    </View>

                    {room.notes ? (
                      <View style={styles.notesContainer}>
                        <MaterialCommunityIcons
                          name="information-outline"
                          size={14}
                          color={colors.textMuted}
                          style={{ marginTop: 2, marginRight: 6 }}
                        />
                        <Text style={styles.notesText}>{room.notes}</Text>
                      </View>
                    ) : null}
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Add / Edit Room Modal */}
      <Modal
        visible={isModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                <View style={styles.modalHeaderIcon}>
                  <MaterialCommunityIcons
                    name={editingRoomId ? 'pencil' : 'bed'}
                    size={22}
                    color={colors.danger}
                  />
                </View>
                <Text style={styles.modalTitle}>
                  {editingRoomId ? 'Modificar Sala' : 'Nueva Sala'}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsModalVisible(false)}
                style={styles.modalCloseButton}
              >
                <MaterialCommunityIcons name="close" size={22} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              {/* Name input */}
              <Text style={styles.inputLabel}>Nombre de la Sala</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Ej. Sala de Observación B"
                placeholderTextColor={colors.textMuted}
                value={roomName}
                onChangeText={setRoomName}
              />

              {/* Department selector */}
              <Text style={styles.inputLabel}>Área / Departamento Asignado</Text>
              <View style={styles.deptChipsRow}>
                {departments.map((dept) => {
                  const isSelected = roomDept === dept;
                  return (
                    <TouchableOpacity
                      key={dept}
                      style={[
                        styles.modalDeptChip,
                        isSelected && styles.modalDeptChipActive,
                      ]}
                      onPress={() => setRoomDept(dept)}
                    >
                      <Text
                        style={[
                          styles.modalDeptChipText,
                          isSelected && styles.modalDeptChipTextActive,
                        ]}
                      >
                        {dept}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Staffing Configuration */}
              <Text style={styles.inputLabel}>Personal Requerido</Text>
              <View style={styles.modeToggleRow}>
                <TouchableOpacity
                  style={[
                    styles.modeToggle,
                    staffingMode === 'total' && styles.modeToggleActive,
                  ]}
                  onPress={() => setStaffingMode('total')}
                >
                  <MaterialCommunityIcons
                    name="account-group"
                    size={16}
                    color={staffingMode === 'total' ? '#FFFFFF' : colors.textMuted}
                    style={{ marginRight: 6 }}
                  />
                  <Text
                    style={[
                      styles.modeToggleText,
                      staffingMode === 'total' && styles.modeToggleTextActive,
                    ]}
                  >
                    Total
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.modeToggle,
                    staffingMode === 'by_position' && styles.modeToggleActive,
                  ]}
                  onPress={() => setStaffingMode('by_position')}
                >
                  <MaterialCommunityIcons
                    name="badge-account-horizontal-outline"
                    size={16}
                    color={staffingMode === 'by_position' ? '#FFFFFF' : colors.textMuted}
                    style={{ marginRight: 6 }}
                  />
                  <Text
                    style={[
                      styles.modeToggleText,
                      staffingMode === 'by_position' && styles.modeToggleTextActive,
                    ]}
                  >
                    Por Cargo
                  </Text>
                </TouchableOpacity>
              </View>

              {staffingMode === 'total' ? (
                <View style={styles.totalInputRow}>
                  <Text style={styles.totalInputLabel}>Número de trabajadores</Text>
                  <TextInput
                    style={styles.totalInput}
                    placeholder="4"
                    placeholderTextColor={colors.textMuted}
                    value={staffCount}
                    onChangeText={setStaffCount}
                    keyboardType="number-pad"
                  />
                </View>
              ) : (
                <View style={styles.positionList}>
                  {workerPositions.length === 0 ? (
                    <Text style={styles.emptyNoticeText}>
                      No hay cargos registrados. Añade trabajadores en la pestaña
                      Trabajadores para poder configurar por cargo.
                    </Text>
                  ) : (
                    workerPositions.map((position) => (
                      <View key={position} style={styles.positionRow}>
                        <Text style={styles.positionName}>{position}</Text>
                        <View style={styles.stepper}>
                          <TouchableOpacity
                            style={styles.stepperBtn}
                            onPress={() =>
                              setPositionCounts((prev) => ({
                                ...prev,
                                [position]: Math.max(0, (prev[position] || 0) - 1),
                              }))
                            }
                          >
                            <MaterialCommunityIcons
                              name="minus"
                              size={18}
                              color={colors.accent}
                            />
                          </TouchableOpacity>
                          <Text style={styles.stepperValue}>
                            {positionCounts[position] || 0}
                          </Text>
                          <TouchableOpacity
                            style={styles.stepperBtn}
                            onPress={() =>
                              setPositionCounts((prev) => ({
                                ...prev,
                                [position]: (prev[position] || 0) + 1,
                              }))
                            }
                          >
                            <MaterialCommunityIcons
                              name="plus"
                              size={18}
                              color={colors.accent}
                            />
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))
                  )}
                </View>
              )}

              {/* Status */}
              <Text style={styles.inputLabel}>Estado</Text>
              <TouchableOpacity
                style={styles.statusToggle}
                onPress={() => {
                  if (roomStatus === 'available') setRoomStatus('occupied');
                  else if (roomStatus === 'occupied') setRoomStatus('maintenance');
                  else setRoomStatus('available');
                }}
              >
                <Text
                  style={[
                    styles.statusToggleText,
                    { color: getStatusBadge(roomStatus).color },
                  ]}
                >
                  {getStatusBadge(roomStatus).label}
                </Text>
              </TouchableOpacity>

              {/* Notes */}
              <Text style={styles.inputLabel}>Detalles / Observaciones</Text>
              <TextInput
                style={[styles.modalInput, styles.modalTextArea]}
                placeholder="Equipamiento, ubicación específica o notas..."
                placeholderTextColor={colors.textMuted}
                value={roomNotes}
                onChangeText={setRoomNotes}
                multiline
                numberOfLines={3}
              />
            </ScrollView>

            {/* Modal Save Button */}
            <TouchableOpacity
              style={styles.modalSaveButton}
              onPress={handleSaveRoom}
            >
              <MaterialCommunityIcons
                name="check-circle"
                size={20}
                color="#FFFFFF"
                style={{ marginRight: 8 }}
              />
              <Text style={styles.modalSaveButtonText}>
                {editingRoomId ? 'Guardar Cambios' : 'Registrar Sala'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  headerIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: colors.dangerTint,
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
  addMainButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.dangerDark,
    borderRadius: 12,
    paddingVertical: 14,
    marginBottom: 20,
    gap: 8,
  },
  addMainButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 10,
  },
  listHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  filterScroll: {
    gap: 8,
    paddingVertical: 2,
  },
  filterChip: {
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.dangerDark,
    borderColor: colors.danger,
  },
  filterChipText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  cardsGrid: {
    gap: 12,
  },
  roomCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  roomCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  roomTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  roomIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: colors.dangerTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  roomName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textStrong,
  },
  roomDept: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionIconButton: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: colors.background,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 12,
  },
  roomMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  staffingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  staffingText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 5,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  notesContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  notesText: {
    flex: 1,
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 16,
  },
  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyTitle: {
    color: colors.textStrong,
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
  },
  emptySubtitle: {
    color: colors.textMuted,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  /* Modal Styles */
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
    maxHeight: '90%',
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalHeaderIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.dangerTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textStrong,
  },
  modalCloseButton: {
    padding: 4,
  },
  modalScroll: {
    maxHeight: 400,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 6,
    marginTop: 10,
  },
  modalInput: {
    backgroundColor: colors.background,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.textStrong,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalTextArea: {
    minHeight: 70,
    textAlignVertical: 'top',
  },
  deptChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 6,
  },
  modalDeptChip: {
    backgroundColor: colors.background,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalDeptChipActive: {
    backgroundColor: colors.dangerDark,
    borderColor: colors.danger,
  },
  modalDeptChipText: {
    fontSize: 12,
    color: colors.textMuted,
  },
  modalDeptChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  modeToggleRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  modeToggle: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    borderRadius: 10,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modeToggleActive: {
    backgroundColor: colors.accentDark,
    borderColor: colors.accent,
  },
  modeToggleText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  modeToggleTextActive: {
    color: '#FFFFFF',
  },
  totalInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 6,
  },
  totalInputLabel: {
    flex: 1,
    fontSize: 13,
    color: colors.textMuted,
  },
  totalInput: {
    backgroundColor: colors.background,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.textStrong,
    borderWidth: 1,
    borderColor: colors.border,
    width: 80,
    textAlign: 'center',
  },
  positionList: {
    gap: 8,
    marginBottom: 6,
  },
  positionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  positionName: {
    flex: 1,
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stepperBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  stepperValue: {
    minWidth: 24,
    textAlign: 'center',
    color: colors.textStrong,
    fontSize: 15,
    fontWeight: '700',
  },
  emptyNoticeText: {
    color: colors.textFaint,
    fontSize: 13,
    fontStyle: 'italic',
    paddingVertical: 8,
  },
  modalTwoCol: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusToggle: {
    backgroundColor: colors.background,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  statusToggleText: {
    fontSize: 14,
    fontWeight: '700',
  },
  modalSaveButton: {
    backgroundColor: colors.dangerDark,
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  modalSaveButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
