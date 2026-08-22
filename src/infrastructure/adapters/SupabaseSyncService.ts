import { Worker } from '../../domain/entities/Worker';
import { ShiftConfig, RoomConfig } from '../../domain/constants/appConfig';
import { SyncService, RemoteWorker } from '../../domain/ports/SyncService';
import { supabase } from '../config/supabase';

export class SupabaseSyncService implements SyncService {
  async pushWorker(worker: Worker): Promise<RemoteWorker> {
    const { data, error } = await supabase
      .from('workers')
      .upsert(
        {
          ...(worker.supabase_id ? { id: Number(worker.supabase_id) } : {}),
          full_name: worker.full_name,
          position: worker.position,
        },
        { onConflict: 'id' }
      )
      .select()
      .single();

    if (error) {
      throw new Error(`Supabase push failed: ${error.message}`);
    }

    return data as RemoteWorker;
  }

  async pullWorkers(): Promise<RemoteWorker[]> {
    const { data, error } = await supabase
      .from('workers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Supabase pull failed: ${error.message}`);
    }

    return (data || []) as RemoteWorker[];
  }

  async deleteWorker(supabaseId: string): Promise<void> {
    const { error } = await supabase
      .from('workers')
      .delete()
      .eq('id', Number(supabaseId));
    if (error) {
      throw new Error(`Supabase delete failed: ${error.message}`);
    }
  }

  async pushDepartments(names: string[]): Promise<void> {
    if (names.length === 0) return;
    const { error } = await supabase
      .from('departments')
      .upsert(names.map((name) => ({ name })), { onConflict: 'name' });
    if (error) {
      throw new Error(`Supabase push departments failed: ${error.message}`);
    }
  }

  async pullDepartments(): Promise<string[]> {
    const { data, error } = await supabase
      .from('departments')
      .select('name')
      .order('id', { ascending: true });
    if (error) {
      throw new Error(`Supabase pull departments failed: ${error.message}`);
    }
    return (data || []).map((r) => r.name);
  }

  async deleteDepartment(name: string): Promise<void> {
    const { error: roomsError } = await supabase
      .from('rooms')
      .delete()
      .eq('department', name);
    if (roomsError) {
      throw new Error(`Supabase delete department rooms failed: ${roomsError.message}`);
    }
    const { error } = await supabase
      .from('departments')
      .delete()
      .eq('name', name);
    if (error) {
      throw new Error(`Supabase delete department failed: ${error.message}`);
    }
  }

  async deleteShift(id: string): Promise<void> {
    const { error } = await supabase.from('shifts').delete().eq('id', id);
    if (error) {
      throw new Error(`Supabase delete shift failed: ${error.message}`);
    }
  }

  async deleteRoom(id: string): Promise<void> {
    const { error } = await supabase.from('rooms').delete().eq('id', id);
    if (error) {
      throw new Error(`Supabase delete room failed: ${error.message}`);
    }
  }

  async pushShifts(shifts: ShiftConfig[]): Promise<void> {
    if (shifts.length === 0) return;
    const { error } = await supabase
      .from('shifts')
      .upsert(
        shifts.map((s) => ({ id: s.id, label: s.label, icon: s.icon })),
        { onConflict: 'id' }
      );
    if (error) {
      throw new Error(`Supabase push shifts failed: ${error.message}`);
    }
  }

  async pullShifts(): Promise<ShiftConfig[]> {
    const { data, error } = await supabase
      .from('shifts')
      .select('*')
      .order('id', { ascending: true });
    if (error) {
      throw new Error(`Supabase pull shifts failed: ${error.message}`);
    }
    return (data || []).map((r) => ({
      id: r.id,
      label: r.label,
      icon: r.icon,
    }));
  }

  async pushRooms(rooms: RoomConfig[]): Promise<void> {
    if (rooms.length === 0) return;
    const { error } = await supabase
      .from('rooms')
      .upsert(
        rooms.map((r) => ({
          id: r.id,
          name: r.name,
          department: r.department,
          staffing_mode: r.staffingMode,
          staff_count: r.staffCount,
          positions: r.positions,
          status: r.status,
          notes: r.notes || '',
        })),
        { onConflict: 'id' }
      );
    if (error) {
      throw new Error(`Supabase push rooms failed: ${error.message}`);
    }
  }

  async pullRooms(): Promise<RoomConfig[]> {
    const { data, error } = await supabase
      .from('rooms')
      .select('*')
      .order('department', { ascending: true });
    if (error) {
      throw new Error(`Supabase pull rooms failed: ${error.message}`);
    }
    return (data || []).map((r) => ({
      id: r.id,
      name: r.name,
      department: r.department,
      staffingMode: r.staffing_mode || 'total',
      staffCount: r.staff_count || 0,
      positions: Array.isArray(r.positions) ? r.positions : [],
      status: r.status || 'available',
      notes: r.notes || '',
    }));
  }

  async pushSettings(settings: Record<string, string>): Promise<void> {
    const entries = Object.entries(settings);
    if (entries.length === 0) return;
    const { error } = await supabase
      .from('app_settings')
      .upsert(
        entries.map(([key, value]) => ({
          key,
          value,
          updated_at: new Date().toISOString(),
        })),
        { onConflict: 'key' }
      );
    if (error) {
      throw new Error(`Supabase push settings failed: ${error.message}`);
    }
  }

  async pullSettings(): Promise<Record<string, string>> {
    const { data, error } = await supabase
      .from('app_settings')
      .select('key, value');
    if (error) {
      throw new Error(`Supabase pull settings failed: ${error.message}`);
    }
    const map: Record<string, string> = {};
    (data || []).forEach((r) => {
      map[r.key] = r.value;
    });
    return map;
  }
}