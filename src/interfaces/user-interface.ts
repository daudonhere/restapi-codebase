export interface UserInterface {
  id: string;
  fullname: string | null;
  avatar: string | null;
  email: string;
  phone: string | null;
  password: string;
  frequency: string | null;
  code: string | null;
  pin: string | null;
  passphrase: string | null;
  source: "email" | "google" | "github" | null;
  is_verified: boolean;
  ip_address: string | null;
  user_agent: string | null;
  is_delete: boolean;
  deleted_at: Date | null;
  login_at: Date | null;
  created_at: Date;
  updated_at: Date;
  roles: string[];
}
