// Exclude auto-created platform_accounts/platform_users and incidental telemetry.
export const ownedWorkspaceTables = [
  'settings','projects','records','files','file_folders','company_members','builders',
  'safety_docs','om_manuals','schedule_entries','subscriptions','billing_accounts',
  'app_settings','payroll_config','payroll_reviews',
] as const;
export function ownedWorkspacePredicate(placeholder:'?') {
  return ownedWorkspaceTables.map(table=>`EXISTS(SELECT 1 FROM ${table} WHERE owner=${placeholder})`).join(' OR ');
}
