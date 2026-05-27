# Repositorios Docker para almacenar imagenes del backend y frontend

resource "google_artifact_registry_repository" "monabit_docker" {
  location      = var.region
  repository_id = "monabit-${var.environment}"
  description   = "Imagenes Docker del proyecto MonaBit"
  format        = "DOCKER"

  depends_on = [google_project_service.enabled]
}
