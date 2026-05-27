# Habilitar las APIs de Google Cloud necesarias

locals {
  enabled_apis = [
    "run.googleapis.com",                # Cloud Run
    "artifactregistry.googleapis.com",   # Artifact Registry
    "secretmanager.googleapis.com",      # Secret Manager
    "iam.googleapis.com",                # IAM (Workload Identity)
    "iamcredentials.googleapis.com",     # IAM Credentials
    "cloudresourcemanager.googleapis.com",
    "logging.googleapis.com",            # Cloud Logging
    "monitoring.googleapis.com",         # Cloud Monitoring
  ]
}

resource "google_project_service" "enabled" {
  for_each           = toset(local.enabled_apis)
  service            = each.value
  disable_on_destroy = false
}
