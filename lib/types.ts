/** Shapes returned by the platform API (apps/api/src/anodyx/routers/platform.py). */

export type Plan = "trial" | "starter" | "growth" | "volume" | "archive";
export type TenantStatus = "active" | "suspended";

export type Account = {
  id: string;
  email: string;
  display_name: string | null;
  has_password: boolean;
  totp_enabled: boolean;
  passkeys: { id: string; name: string; created_at: string; last_used_at: string | null }[];
  enrollment_required: boolean;
};

export type TenantRow = {
  id: string;
  name: string;
  plan: Plan;
  status: TenantStatus;
  trial_ends_at: string | null;
  created_at: string;
  subscription_status: string | null;
  require_2fa: boolean;
  owners: string[];
  users: number;
  models: number;
  passports: number;
};

export type TenantUser = {
  id: string;
  email: string;
  display_name: string | null;
  role: "owner" | "editor" | "viewer";
  has_password: boolean;
  totp_enabled: boolean;
  passkeys: number;
  locked: boolean;
  created_at: string;
};

export type Limits = { name: string; models: number | null; passports: number | null; suppliers: number | null; editable: boolean };

export type TenantDetail = {
  id: string;
  name: string;
  plan: Plan;
  status: TenantStatus;
  status_reason: string | null;
  trial_ends_at: string | null;
  created_at: string;
  require_2fa: boolean;
  support_access_allowed: boolean;
  subscription_status: string | null;
  stripe_customer_id: string | null;
  limits: Limits;
  usage: {
    models: number;
    units: number;
    passports: number;
    suppliers: number;
    open_requests: number;
    registry_failed: number;
  };
  users: TenantUser[];
  recent_activity: { action: string; entity_type: string; created_at: string; data: Record<string, unknown> }[];
  support_sessions: { id: string; reason: string; created_at: string; expires_at: string; ended_at: string | null }[];
};

export type Overview = {
  tenants: number;
  suspended: number;
  plans: Partial<Record<Plan, number>>;
  users: number;
  models: number;
  passports: number;
  open_requests: number;
  registry_failed: number;
  active_support_sessions: number;
  health: { api: string; database: string; worker: string };
};

export type AuditEntry = {
  id: number;
  admin_id: string | null;
  action: string;
  org_id: string | null;
  data: Record<string, unknown>;
  created_at: string;
};

export type Admin = { id: string; email: string; display_name: string | null; active: boolean; created_at: string };

export type MailSecurity = "starttls" | "ssl" | "none";
export type MailSource = "platform" | "env" | "console" | "file";

/** GET /platform/settings/mail. The password is never returned, only `has_password`. */
export type MailSettings = {
  configured: boolean;
  enabled: boolean;
  verified_at: string | null;
  last_test_error?: string | null;
  host?: string;
  port?: number;
  security?: MailSecurity;
  username?: string | null;
  has_password?: boolean;
  from_address?: string;
  from_name?: string | null;
  active_source: MailSource;
};

export type MailTestResult = MailSettings & { ok: boolean; error: string | null };
