/**
 * ShiftTemplate — plantilla de guardia diseñada con código (RN puro, sin gluestack-ui).
 *
 * Recibe un JSON (ShiftTemplateData) y lo renderiza como tarjeta lista para
 * capturar como imagen con react-native-view-shot. No trae scroll ni botones.
 */
import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';

/* ------------------------------------------------------------------ */
/* Tipos del JSON                                                      */
/* ------------------------------------------------------------------ */

export interface ShiftWorker {
  /** Nombre completo. Usa "Se Buscará Apoyo" para cupos vacíos. */
  name: string;
  /** Cargo / posición. Opcional. */
  position?: string;
}

export interface ShiftRoom {
  /** Nombre de la sala o unidad. */
  name: string;
  /** Texto libre del requerimiento, ej: "4 trabajadores". */
  required?: string;
  /** Personal asignado. */
  workers: ShiftWorker[];
  /** Apoyo externo (nombres). "Se Buscará Apoyo" = pendiente. */
  externalSupport?: string[];
  /** Marca la sala como completa (cambia el estado visual). */
  complete?: boolean;
}

export interface ShiftTemplateData {
  /** Nombre de la app mostrado en el encabezado. */
  appName: string;
  /** Nombre del centro hospitalario (reemplaza a appName en el encabezado). */
  hospitalName?: string;
  /** Logo del instituto (URI local). */
  logoUri?: string;
  /** Muestra el logo / insignia en el encabezado. */
  showLogo?: boolean;
  /** Título principal de la guardia. */
  title: string;
  /** Fecha legible, ej: "domingo, 16 de agosto de 2026". */
  dateLabel: string;
  /** Etiqueta del turno, ej: "Guardia Nocturna". */
  shiftLabel: string;
  /** Departamento o servicio. */
  department: string;
  /** Total de trabajadores. */
  totalWorkers: number;
  /** Salas / unidades. */
  rooms: ShiftRoom[];
  /** Notas opcionales al pie. */
  notes?: string;
  /** Sello de generación, ej: "16/08/2026, 09:15 p.m." */
  generatedAtLabel?: string;
}

/* ------------------------------------------------------------------ */
/* Paleta (hex, sin tokens de tema)                                    */
/* ------------------------------------------------------------------ */

const C = {
  ink: '#0F172A',
  inkSoft: '#1E293B',
  inkLine: '#334155',
  accent: '#0D9488',
  accentSoft: '#CCFBF1',
  accentInk: '#134E4A',
  warn: '#DC2626',
  warnSoft: '#FEE2E2',
  warnText: '#B91C1C',
  surface: '#FFFFFF',
  surfaceAlt: '#F1F5F9',
  textStrong: '#0F172A',
  textMuted: '#64748B',
  textInverse: '#F8FAFC',
  border: '#E2E8F0',
} as const;

const PENDING = 'se buscará apoyo';

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

/* ------------------------------------------------------------------ */
/* Componente principal                                                */
/* ------------------------------------------------------------------ */

export function ShiftTemplate({ data }: { data: ShiftTemplateData }) {
  return (
    <View style={styles.card}>
      <TemplateHeader data={data} />

      <View style={styles.body}>
        <Text style={styles.sectionLabel}>ASIGNACIÓN POR SALA</Text>

        {data.rooms.map((room, i) => (
          <RoomCard key={`${room.name}-${i}`} room={room} />
        ))}

        {data.notes ? (
          <View style={styles.notesBox}>
            <Text style={styles.notesLabel}>NOTAS</Text>
            <Text style={styles.notesText}>{data.notes}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.footerDivider} />
      <View style={styles.footerRow}>
        <Text style={styles.footerText}>Generado por {data.appName}</Text>
        {data.generatedAtLabel ? (
          <Text style={styles.footerText}>{data.generatedAtLabel}</Text>
        ) : null}
      </View>
    </View>
  );
}

export default ShiftTemplate;

/* ------------------------------------------------------------------ */
/* Encabezado                                                          */
/* ------------------------------------------------------------------ */

function TemplateHeader({ data }: { data: ShiftTemplateData }) {
  const displayName = data.hospitalName || data.appName;

  return (
    <View style={styles.header}>
      <View style={styles.headerBrandRow}>
        {data.showLogo ? (
          data.logoUri ? (
            <Image source={{ uri: data.logoUri }} style={styles.headerLogo} />
          ) : (
            <View style={styles.headerBrandBadge}>
              <Text style={styles.headerBrandInitial}>
                {displayName.charAt(0).toUpperCase()}
              </Text>
            </View>
          )
        ) : null}
        <Text style={styles.headerBrandName}>{displayName.toUpperCase()}</Text>
      </View>

      <Text style={styles.headerTitle}>{data.title}</Text>
      <Text style={styles.headerDate}>{data.dateLabel}</Text>

      <View style={styles.headerMetaRow}>
        <View style={styles.headerMetaLeft}>
          <MetaChip label="Turno" value={data.shiftLabel} />
          <MetaChip label="Servicio" value={data.department} />
        </View>
      </View>
    </View>
  );
}

function MetaChip({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metaChipRow}>
      <Text style={styles.metaChipLabel}>{label.toUpperCase()}</Text>
      <Text style={styles.metaChipValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Tarjeta de sala                                                     */
/* ------------------------------------------------------------------ */

function RoomCard({ room }: { room: ShiftRoom }) {
  const hasSupport = (room.externalSupport?.length ?? 0) > 0;

  return (
    <View style={styles.roomCard}>
      <View style={styles.roomHeader}>
        <View style={styles.roomHeaderInfo}>
          <Text style={styles.roomName} numberOfLines={2}>
            {room.name}
          </Text>
          {room.required ? (
            <Text style={styles.roomRequired}>Requiere: {room.required}</Text>
          ) : null}
        </View>

        <View
          style={[
            styles.roomBadge,
            room.complete ? styles.roomBadgeComplete : styles.roomBadgeWarn,
          ]}
        >
          <Text
            style={[
              styles.roomBadgeText,
              room.complete
                ? styles.roomBadgeTextComplete
                : styles.roomBadgeTextWarn,
            ]}
          >
            {room.complete ? 'Completa' : 'Pendiente'}
          </Text>
        </View>
      </View>

      <View style={styles.workersList}>
        {room.workers.map((w, i) => (
          <WorkerRow key={`${w.name}-${i}`} worker={w} />
        ))}
      </View>

      {hasSupport ? (
        <>
          <View style={styles.roomDivider} />
          <View style={styles.supportBlock}>
            <Text style={styles.supportLabel}>APOYO EXTERNO</Text>
            <View style={styles.supportChips}>
              {room.externalSupport!.map((s, i) => {
                const isPending = s.trim().toLowerCase() === PENDING;
                return (
                  <View
                    key={`${s}-${i}`}
                    style={[
                      styles.supportChip,
                      isPending
                        ? styles.supportChipPending
                        : styles.supportChipNormal,
                    ]}
                  >
                    <Text
                      style={
                        isPending ? styles.supportChipTextPending : styles.supportChipTextNormal
                      }
                    >
                      {s}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        </>
      ) : null}
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Fila de trabajador                                                  */
/* ------------------------------------------------------------------ */

function WorkerRow({ worker }: { worker: ShiftWorker }) {
  const isPending = worker.name.trim().toLowerCase() === PENDING;

  return (
    <View style={styles.workerRow}>
      <View
        style={[
          styles.workerAvatar,
          isPending ? styles.workerAvatarPending : styles.workerAvatarNormal,
        ]}
      >
        <Text
          style={
            isPending ? styles.workerAvatarTextPending : styles.workerAvatarTextNormal
          }
        >
          {isPending ? '?' : initials(worker.name)}
        </Text>
      </View>

      <View style={styles.workerInfo}>
        <Text
          style={[styles.workerName, isPending && styles.workerNamePending]}
          numberOfLines={1}
        >
          {worker.name}
        </Text>
        {worker.position ? (
          <Text style={styles.workerPosition} numberOfLines={1}>
            {worker.position}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: C.surfaceAlt,
    borderRadius: 16,
    overflow: 'hidden',
    width: '100%',
  },
  /* Header */
  header: {
    backgroundColor: C.ink,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 20,
  },
  headerBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerLogo: {
    width: 36,
    height: 36,
    borderRadius: 6,
    marginRight: 8,
    resizeMode: 'contain',
  },
  headerBrandBadge: {
    width: 26,
    height: 26,
    borderRadius: 6,
    backgroundColor: C.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  headerBrandInitial: {
    fontSize: 14,
    fontWeight: '700',
    color: C.textInverse,
  },
  headerBrandName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: C.textInverse,
    letterSpacing: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: C.textInverse,
    lineHeight: 30,
  },
  headerDate: {
    fontSize: 14,
    color: C.accentSoft,
    marginTop: 4,
  },
  headerMetaRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  headerMetaLeft: {
    flex: 1,
  },
  metaChipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  metaChipLabel: {
    width: 58,
    fontSize: 10,
    fontWeight: '700',
    color: C.inkLine,
    letterSpacing: 1,
  },
  metaChipValue: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: C.textInverse,
  },
  /* Body */
  body: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: C.textMuted,
    letterSpacing: 1.5,
    marginBottom: 14,
  },
  /* Notes */
  notesBox: {
    backgroundColor: C.accentSoft,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: C.accent,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 12,
  },
  notesLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: C.accentInk,
    letterSpacing: 1,
    marginBottom: 4,
  },
  notesText: {
    fontSize: 14,
    color: C.accentInk,
    lineHeight: 20,
  },
  /* Room card */
  roomCard: {
    backgroundColor: C.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    overflow: 'hidden',
    marginBottom: 12,
    shadowColor: C.ink,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  roomHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: C.surfaceAlt,
    borderBottomWidth: 1,
    borderColor: C.border,
  },
  roomHeaderInfo: {
    flex: 1,
    paddingRight: 8,
  },
  roomName: {
    fontSize: 16,
    fontWeight: '700',
    color: C.textStrong,
  },
  roomRequired: {
    fontSize: 12,
    color: C.textMuted,
    marginTop: 2,
  },
  roomBadge: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  roomBadgeComplete: {
    backgroundColor: C.accentSoft,
  },
  roomBadgeWarn: {
    backgroundColor: C.warnSoft,
  },
  roomBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  roomBadgeTextComplete: {
    color: C.accentInk,
  },
  roomBadgeTextWarn: {
    color: C.warnText,
  },
  workersList: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  roomDivider: {
    height: 1,
    backgroundColor: C.border,
  },
  supportBlock: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  supportLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: C.textMuted,
    letterSpacing: 1,
    marginBottom: 8,
  },
  supportChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  supportChip: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    marginRight: 8,
    marginBottom: 8,
  },
  supportChipPending: {
    backgroundColor: C.warnSoft,
    borderColor: C.warn,
    borderStyle: 'dashed',
  },
  supportChipNormal: {
    backgroundColor: C.surfaceAlt,
    borderColor: C.border,
  },
  supportChipTextPending: {
    fontSize: 12,
    color: C.warnText,
  },
  supportChipTextNormal: {
    fontSize: 12,
    color: C.textStrong,
  },
  /* Worker row */
  workerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  workerAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  workerAvatarNormal: {
    backgroundColor: C.accentSoft,
  },
  workerAvatarPending: {
    backgroundColor: C.warnSoft,
    borderWidth: 1,
    borderColor: C.warn,
    borderStyle: 'dashed',
  },
  workerAvatarTextNormal: {
    fontSize: 12,
    fontWeight: '700',
    color: C.accentInk,
  },
  workerAvatarTextPending: {
    fontSize: 12,
    fontWeight: '700',
    color: C.warnText,
  },
  workerInfo: {
    flex: 1,
  },
  workerName: {
    fontSize: 14,
    fontWeight: '600',
    color: C.textStrong,
  },
  workerNamePending: {
    color: C.warnText,
  },
  workerPosition: {
    fontSize: 12,
    color: C.textMuted,
    marginTop: 1,
  },
  /* Footer */
  footerDivider: {
    height: 1,
    backgroundColor: C.border,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: C.surface,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  footerText: {
    fontSize: 10,
    color: C.textMuted,
  },
});