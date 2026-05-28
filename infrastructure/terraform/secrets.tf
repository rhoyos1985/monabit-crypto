# Secretos gestionados con Secret Manager.
# El backend los lee en runtime; nunca se commitean valores reales.

locals {
  secrets = {
    supabase_service_role_key = var.supabase_service_role_key
    supabase_anon_key         = var.supabase_anon_key
    seed_admin_password       = var.seed_admin_password
    crypto_private_key        = var.crypto_private_key
  }
}

resource "google_secret_manager_secret" "app_secrets" {
  for_each  = local.secrets
  secret_id = "monabit-${var.environment}-${each.key}"

  replication {
    auto {}
  }

  depends_on = [google_project_service.enabled]
}

resource "google_secret_manager_secret_version" "app_secrets_version" {
  for_each    = local.secrets
  secret      = google_secret_manager_secret.app_secrets[each.key].id
  secret_data = each.value
}

# Acceso desde la cuenta de servicio del backend
resource "google_secret_manager_secret_iam_member" "backend_access" {
  for_each  = local.secrets
  secret_id = google_secret_manager_secret.app_secrets[each.key].id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.backend_runtime.email}"
}
