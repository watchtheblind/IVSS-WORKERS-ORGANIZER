import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export interface PlanningReportRoom {
  name: string;
  required: string;
  workers: { name: string; position: string }[];
  externalSupport: string[];
  complete: boolean;
}

export interface PlanningReportData {
  appName: string;
  title: string;
  dateLabel: string;
  shiftLabel: string;
  department: string;
  totalWorkers: number;
  rooms: PlanningReportRoom[];
  notes: string;
  generatedAtLabel: string;
}

interface PlanningReportProps {
  data: PlanningReportData;
}

export default function PlanningReport({ data }: PlanningReportProps) {
  return (
    <View style={styles.card}>
      {/* Brand Header */}
      <View style={styles.headerRow}>
        <View style={styles.brandGroup}>
          <Text style={styles.brand}>{data.appName.toUpperCase()}</Text>
          <Text style={styles.brandTagline}>Plan de Guardia</Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>PLANIFICACIÓN</Text>
        </View>
      </View>

      {/* Title */}
      <View style={styles.titleBlock}>
        <Text style={styles.title}>{data.title}</Text>
      </View>

      {/* Date & Shift Chips */}
      <View style={styles.metaRow}>
        <View style={styles.metaChip}>
          <MaterialCommunityIcons name="calendar" size={14} color="#38BDF8" />
          <Text style={styles.metaChipText}>{data.dateLabel}</Text>
        </View>
        <View style={styles.metaChip}>
          <MaterialCommunityIcons name="clock-outline" size={14} color="#38BDF8" />
          <Text style={styles.metaChipText}>{data.shiftLabel}</Text>
        </View>
      </View>

      {/* Department + People count */}
      <View style={styles.deptRow}>
        <MaterialCommunityIcons name="domain" size={16} color="#10B981" />
        <Text style={styles.deptText}>{data.department}</Text>
        <View style={styles.peopleBadge}>
          <MaterialCommunityIcons name="account-group" size={14} color="#38BDF8" />
          <Text style={styles.peopleBadgeText}>{data.totalWorkers}</Text>
        </View>
      </View>

      <View style={styles.divider} />

      {/* Rooms / Assignment */}
      <Text style={styles.sectionLabel}>SALAS · ASIGNACIÓN</Text>
      <View style={styles.roomsList}>
        {data.rooms.map((room, idx) => (
          <View key={idx} style={styles.roomBlock}>
            <View style={styles.roomHeader}>
              <Text style={styles.roomName}>{room.name}</Text>
              <View
                style={[styles.reqBadge, !room.complete && styles.reqBadgeWarn]}
              >
                <Text
                  style={[styles.reqText, !room.complete && styles.reqTextWarn]}
                >
                  {room.complete ? 'Completa' : 'Incompleta'}
                </Text>
              </View>
            </View>
            <Text style={styles.roomRequired}>Requiere: {room.required}</Text>

            {room.workers.map((worker, i) => (
              <View key={`w-${i}`} style={styles.assignRow}>
                <MaterialCommunityIcons
                  name="account-check"
                  size={15}
                  color="#10B981"
                />
                <Text style={styles.assignName}>{worker.name}</Text>
                <Text style={styles.assignPosition}>{worker.position}</Text>
              </View>
            ))}
            {room.externalSupport.map((name, i) => (
              <View key={`e-${i}`} style={styles.assignRow}>
                <MaterialCommunityIcons
                  name="account-plus-outline"
                  size={15}
                  color="#A78BFA"
                />
                <Text style={styles.assignName}>{name}</Text>
                <Text style={styles.assignPosition}>Apoyo externo</Text>
              </View>
            ))}
            {room.workers.length === 0 && room.externalSupport.length === 0 && (
              <View style={styles.assignRow}>
                <MaterialCommunityIcons
                  name="alert-circle-outline"
                  size={15}
                  color="#F59E0B"
                />
                <Text style={[styles.assignName, styles.noStaffText]}>
                  Sin personal asignado
                </Text>
              </View>
            )}
          </View>
        ))}
      </View>

      {/* Notes */}
      {data.notes.trim().length > 0 && (
        <>
          <View style={styles.divider} />
          <Text style={styles.sectionLabel}>OBSERVACIONES</Text>
          <View style={styles.notesBox}>
            <Text style={styles.notesText}>{data.notes}</Text>
          </View>
        </>
      )}

      {/* Footer timestamp */}
      <View style={styles.divider} />
      <View style={styles.footerRow}>
        <MaterialCommunityIcons
          name="clock-time-three-outline"
          size={13}
          color="#64748B"
        />
        <Text style={styles.footerText}>
          Generado: {data.generatedAtLabel}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#334155',
    padding: 18,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  brandGroup: {
    flex: 1,
  },
  brand: {
    fontSize: 18,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: 1,
  },
  brandTagline: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  badge: {
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  badgeText: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  titleBlock: {
    backgroundColor: '#0F172A',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
    borderWidth: 1,
    borderColor: '#334155',
  },
  metaChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#CBD5E1',
  },
  deptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  deptText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#E2E8F0',
    marginLeft: 8,
  },
  peopleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    gap: 5,
  },
  peopleBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#38BDF8',
  },
  divider: {
    height: 1,
    backgroundColor: '#334155',
    marginVertical: 14,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 1,
    marginBottom: 10,
  },
  roomsList: {
    gap: 10,
  },
  roomBlock: {
    backgroundColor: '#0F172A',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  roomHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  roomName: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: '#F8FAFC',
    marginRight: 8,
  },
  reqBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  reqBadgeWarn: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
  },
  reqText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#10B981',
  },
  reqTextWarn: {
    color: '#F59E0B',
  },
  roomRequired: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 8,
  },
  assignRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    marginBottom: 4,
    gap: 8,
  },
  assignName: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: '#E2E8F0',
  },
  assignPosition: {
    fontSize: 11,
    color: '#94A3B8',
  },
  noStaffText: {
    color: '#F59E0B',
  },
  notesBox: {
    backgroundColor: '#0F172A',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  notesText: {
    fontSize: 12,
    color: '#CBD5E1',
    lineHeight: 17,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  footerText: {
    fontSize: 11,
    color: '#64748B',
  },
});