import { Worker } from '../../domain/entities/Worker';
import { SyncService, RemoteWorker } from '../../domain/ports/SyncService';
import { supabase } from '../config/supabase';

export class SupabaseSyncService implements SyncService {
  async pushWorker(worker: Worker): Promise<RemoteWorker> {
    const { data, error } = await supabase
      .from('workers')
      .upsert(
        {
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
}
