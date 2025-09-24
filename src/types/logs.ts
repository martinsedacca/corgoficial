export interface LogEntry {
  id: string;
  timestamp: string;
  user_email: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  entity: 'prescriptions' | 'patients' | 'doctors' | 'users' | 'social_works';
  entity_id: string;
  entity_description: string | null;
  previous_data: any;
  new_data: any;
}
