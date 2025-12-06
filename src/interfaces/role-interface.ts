export interface RoleInterface {
  id: number;
  name: string;
  description?: string | null;
  is_system: boolean;
  created_at: Date | string;
  updated_at: Date | string;
}
