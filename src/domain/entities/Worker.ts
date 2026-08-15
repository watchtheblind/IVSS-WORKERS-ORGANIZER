export interface Worker {
  id?: number;
  supabase_id: string | null;
  full_name: string;
  position: string;
  synced: 0 | 1;
}

export type NewWorker = Pick<Worker, 'full_name' | 'position'>;
