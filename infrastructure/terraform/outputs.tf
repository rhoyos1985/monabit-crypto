output "backend_url" {
  description = "URL publica del backend en Cloud Run"
  value       = google_cloud_run_v2_service.backend.uri
}

output "frontend_url" {
  description = "URL publica del frontend en Cloud Run"
  value       = google_cloud_run_v2_service.frontend.uri
}

output "artifact_registry_repository" {
  description = "URI del repositorio Docker"
  value       = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.monabit_docker.repository_id}"
}

output "github_deployer_email" {
  description = "Email de la cuenta de servicio que GitHub Actions impersona"
  value       = google_service_account.github_deployer.email
}

output "workload_identity_provider" {
  description = "Provider de Workload Identity para configurar en GitHub Actions"
  value       = "projects/${data.google_project.current.number}/locations/global/workloadIdentityPools/${google_iam_workload_identity_pool.github.workload_identity_pool_id}/providers/${google_iam_workload_identity_pool_provider.github.workload_identity_pool_provider_id}"
}

data "google_project" "current" {
  project_id = var.project_id
}
