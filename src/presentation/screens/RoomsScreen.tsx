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
import { RoomConfig } from '../../domain/constants/appConfig';

export default function RoomsScreen() {
  const [rooms, setRooms] = useState<RoomConfig[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>('Todas');

  // Form State for Add / Edit Modal
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingRoomId, setEditingRoomId] = useState<string | null>(null);
  const [roomName, setRoomName] = useState('');
  const [roomDept, setRoomDept] = useState('');
  const [roomCapacity, setRoomCapacity] = useState('4');
  const [roomStatus, setRoomStatus] = useState<'available' | 'occupied' | 'maintenance'>('available');
  const [roomNotes, setRoomNotes] = useState('');

  const loadData = useCallback(async () => {
    try {
      const [deptList, roomList] = await Promise.all([
        container.configRepository.getDepartments(),
        container.configRepository.getRooms(),
      ]);
      setDepartments(deptList);
      setRooms(roomList);
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
    setRoomCapacity('4');
    setRoomStatus('available');
    setRoomNotes('');
    setIsModalVisible(true);
  };

  const openEditModal = (room: RoomConfig) => {
    setEditingRoomId(room.id);
    setRoomName(room.name);
    setRoomDept(room.department);
    setRoomCapacity(room.capacity.toString());
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

    const parsedCapacity = parseInt(roomCapacity, 10) || 1;

    try {
      if (editingRoomId) {
        // Update
        const updatedRoom: RoomConfig = {
          id: editingRoomId,
          name: roomName.trim(),
          department: roomDept,
          capacity: parsedCapacity,
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
          capacity: parsedCapacity,
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

  const getStatusBadge = (status: RoomConfig['status']) => {
    switch (status) {
      case 'available':
        return {
          label: 'Disponible',
          color: '#10B981',
          bg: 'rgba(16, 185, 129, 0.12)',
          icon: 'check-circle-outline',
        };
      case 'occupied':
        return {
          label: 'Ocupada',
          color: '#EF4444',
          bg: 'rgba(239, 68, 68, 0.12)',
          icon: 'account-group-outline',
        };
      case 'maintenance':
        return {
          label: 'Mantenimiento',
          color: '#F59E0B',
          bg: 'rgba(245, 158, 11, 0.12)',
          icon: 'tools',
        };
      default:
        return {
          label: 'Disponible',
          color: '#10B981',
          bg: 'rgba(16, 185, 129, 0.12)',
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
            <MaterialCommunityIcons name="bed" size={28} color="#EF4444" />
          </View>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Gestión de Salas</Text>
            <Text style={styles.headerSubtitle}>
              Administración de salas, camas y áreas de atención
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
              <MaterialCommunityIcons name="bed-empty" size={44} color="#64748B" />
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
                            color="#EF4444"
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
                            color="#38BDF8"
                          />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.actionIconButton}
                          onPress={() => handleDeleteRoom(room)}
                        >
                          <MaterialCommunityIcons
                            name="trash-can-outline"
                            size={20}
                            color="#EF4444"
                          />
                        </TouchableOpacity>
                      </View>
                    </View>

                    <View style={styles.divider} />

                    {/* Room Meta Badges */}
                    <View style={styles.roomMetaRow}>
                      <View style={styles.capacityBadge}>
                        <MaterialCommunityIcons
                          name="bunk-bed-outline"
                          size={16}
                          color="#F8FAFC"
                        />
                        <Text style={styles.capacityText}>
                          {room.capacity} {room.capacity === 1 ? 'Cama' : 'Camas'}
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
                          color="#94A3B8"
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
                    color="#EF4444"
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
                <MaterialCommunityIcons name="close" size={22} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              {/* Name input */}
              <Text style={styles.inputLabel}>Nombre de la Sala</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Ej. Sala de Observación B"
                placeholderTextColor="#94A3B8"
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

              {/* Capacity & Status */}
              <View style={styles.modalTwoCol}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.inputLabel}>Capacidad (Camas)</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="4"
                    placeholderTextColor="#94A3B8"
                    value={roomCapacity}
                    onChangeText={setRoomCapacity}
                    keyboardType="number-pad"
                  />
                </View>

                <View style={{ flex: 1, marginLeft: 8 }}>
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
                </View>
              </View>

              {/* Notes */}
              <Text style={styles.inputLabel}>Detalles / Observaciones</Text>
              <TextInput
                style={[styles.modalInput, styles.modalTextArea]}
                placeholder="Equipamiento, ubicación específica o notas..."
                placeholderTextColor="#94A3B8"
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
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  headerIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
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
  addMainButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DC2626',
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
    color: '#CBD5E1',
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
    backgroundColor: '#1E293B',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  filterChipActive: {
    backgroundColor: '#DC2626',
    borderColor: '#EF4444',
  },
  filterChipText: {
    color: '#94A3B8',
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
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
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
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  roomName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  roomDept: {
    fontSize: 12,
    color: '#94A3B8',
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
    backgroundColor: '#0F172A',
  },
  divider: {
    height: 1,
    backgroundColor: '#334155',
    marginVertical: 12,
  },
  roomMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  capacityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 6,
    borderWidth: 1,
    borderColor: '#334155',
  },
  capacityText: {
    color: '#E2E8F0',
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
    backgroundColor: '#0F172A',
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  notesText: {
    flex: 1,
    fontSize: 12,
    color: '#94A3B8',
    lineHeight: 16,
  },
  emptyCard: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  emptyTitle: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
  },
  emptySubtitle: {
    color: '#94A3B8',
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
    backgroundColor: '#1E293B',
    borderRadius: 18,
    width: '100%',
    maxHeight: '90%',
    borderWidth: 1,
    borderColor: '#334155',
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
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F8FAFC',
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
    color: '#CBD5E1',
    marginBottom: 6,
    marginTop: 10,
  },
  modalInput: {
    backgroundColor: '#0F172A',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#334155',
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
    backgroundColor: '#0F172A',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  modalDeptChipActive: {
    backgroundColor: '#DC2626',
    borderColor: '#EF4444',
  },
  modalDeptChipText: {
    fontSize: 12,
    color: '#94A3B8',
  },
  modalDeptChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  modalTwoCol: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusToggle: {
    backgroundColor: '#0F172A',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
  },
  statusToggleText: {
    fontSize: 14,
    fontWeight: '700',
  },
  modalSaveButton: {
    backgroundColor: '#DC2626',
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
