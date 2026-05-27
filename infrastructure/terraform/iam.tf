# Cuentas de servicio y permisos

# Cuenta de servicio para el runtime del backend
resource "google_service_account" "backend_runtime" {
  account_id   = "monabit-${var.environment}-backend"
  display_name = "MonaBit Backend Runtime (${var.environment})"
  description  = "Cuenta de servicio que ejecuta el contenedor del backend en Cloud Run"
}

# Cuenta de servicio para el runtime del frontend
resource "google_service_account" "frontend_runtime" {
  account_id   = "monabit-${var.environment}-frontend"
  display_name = "MonaBit Frontend Runtime (${var.environment})"
  description  = "Cuenta de servicio que ejecuta el contenedor del frontend (nginx) en Cloud Run"
}

# Cuenta de servicio para el pipeline de GitHub Actions
resource "google_service_account" "github_deployer" {
  account_id   = "monabit-${var.environment}-deployer"
  display_name = "MonaBit GitHub Deployer (${var.environment})"
  description  = "Cuenta de servicio impersonada por GitHub Actions via Workload Identity Federation"
}

# Permisos para el deployer: build/push imagenes + deploy a Cloud Run
resource "google_project_iam_member" "deployer_artifact_registry" {
  project = var.project_id
  role    = "roles/artifactregistry.writer"
  member  = "serviceAccount:${google_service_account.github_deployer.email}"
}

resource "google_project_iam_member" "deployer_run_admin" {
  project = var.project_id
  role    = "roles/run.admin"
  member  = "serviceAccount:${google_service_account.github_deployer.email}"
}

resource "google_project_iam_member" "deployer_service_account_user" {
  project = var.project_id
  role    = "roles/iam.serviceAccountUser"
  member  = "serviceAccount:${google_service_account.github_deployer.email}"
}

# Permisos de logging y monitoring para los servicios runtime
resource "google_project_iam_member" "backend_logging" {
  project = var.project_id
  role    = "roles/logging.logWriter"
  member  = "serviceAccount:${google_service_account.backend_runtime.email}"
}

resource "google_project_iam_member" "frontend_logging" {
  project = var.project_id
  role    = "roles/logging.logWriter"
  member  = "serviceAccount:${google_service_account.frontend_runtime.email}"
}

# Workload Identity Federation para GitHub Actions
resource "google_iam_workload_identity_pool" "github" {
  workload_identity_pool_id = "monabit-github-${var.environment}"
  display_name              = "GitHub Actions (${var.environment})"
  description               = "Pool para autenticar GitHub Actions sin claves estaticas"

  depends_on = [google_project_service.enabled]
}

resource "google_iam_workload_identity_pool_provider" "github" {
  workload_identity_pool_id          = google_iam_workload_identity_pool.github.workload_identity_pool_id
  workload_identity_pool_provider_id = "github-${var.environment}"
  display_name                       = "GitHub OIDC Provider"

  attribute_mapping = {
    "google.subject"       = "assertion.sub"
    "attribute.actor"      = "assertion.actor"
    "attribute.repository" = "assertion.repository"
    "attribute.ref"        = "assertion.ref"
  }

  attribute_condition = "assertion.repository == \"${var.github_repository}\""

  oidc {
    issuer_uri = "https://token.actions.githubusercontent.com"
  }
}

# Permitir que GitHub Actions del repo configurado impersone al deployer
resource "google_service_account_iam_member" "github_deployer_impersonate" {
  service_account_id = google_service_account.github_deployer.name
  role               = "roles/iam.workloadIdentityUser"
  member             = "principalSet://iam.googleapis.com/${google_iam_workload_identity_pool.github.name}/attribute.repository/${var.github_repository}"
}
