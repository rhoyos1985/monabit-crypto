# Servicios Cloud Run para backend y frontend (independientes)

resource "google_cloud_run_v2_service" "backend" {
  name     = "monabit-${var.environment}-backend"
  location = var.region
  ingress  = "INGRESS_TRAFFIC_ALL"

  template {
    service_account = google_service_account.backend_runtime.email

    scaling {
      min_instance_count = 0
      max_instance_count = 5
    }

    containers {
      image = var.backend_image

      ports {
        container_port = 8080
      }

      resources {
        limits = {
          cpu    = "1"
          memory = "512Mi"
        }
      }

      env {
        name  = "NODE_ENV"
        value = "production"
      }

      env {
        name  = "PORT"
        value = "8080"
      }

      env {
        name  = "SUPABASE_URL"
        value = var.supabase_url
      }

      env {
        name = "SUPABASE_SERVICE_ROLE_KEY"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.app_secrets["supabase_service_role_key"].secret_id
            version = "latest"
          }
        }
      }

      env {
        name = "SUPABASE_ANON_KEY"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.app_secrets["supabase_anon_key"].secret_id
            version = "latest"
          }
        }
      }

      env {
        name  = "COINGECKO_API_BASE"
        value = "https://api.coingecko.com/api/v3"
      }

      env {
        name  = "API_COLOMBIA_BASE"
        value = "https://api-colombia.com/api/v1"
      }

      env {
        name  = "CORS_ORIGIN"
        value = google_cloud_run_v2_service.frontend.uri
      }

      env {
        name  = "SEED_ADMIN_EMAIL"
        value = var.seed_admin_email
      }

      env {
        name = "SEED_ADMIN_PASSWORD"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.app_secrets["seed_admin_password"].secret_id
            version = "latest"
          }
        }
      }

      env {
        name  = "LOG_LEVEL"
        value = "info"
      }

      startup_probe {
        http_get {
          path = "/health"
        }
        initial_delay_seconds = 5
        timeout_seconds       = 5
        period_seconds        = 10
        failure_threshold     = 5
      }

      liveness_probe {
        http_get {
          path = "/health"
        }
        period_seconds    = 30
        failure_threshold = 3
      }
    }
  }

  traffic {
    type    = "TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST"
    percent = 100
  }

  depends_on = [
    google_project_service.enabled,
    google_secret_manager_secret_version.app_secrets_version,
  ]
}

resource "google_cloud_run_v2_service" "frontend" {
  name     = "monabit-${var.environment}-frontend"
  location = var.region
  ingress  = "INGRESS_TRAFFIC_ALL"

  template {
    service_account = google_service_account.frontend_runtime.email

    scaling {
      min_instance_count = 0
      max_instance_count = 5
    }

    containers {
      image = var.frontend_image

      ports {
        container_port = 8080
      }

      resources {
        limits = {
          cpu    = "1"
          memory = "256Mi"
        }
      }
    }
  }

  traffic {
    type    = "TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST"
    percent = 100
  }

  depends_on = [google_project_service.enabled]
}

# Permitir acceso publico (Cloud Run no autenticado)
resource "google_cloud_run_v2_service_iam_member" "backend_public" {
  project  = var.project_id
  location = google_cloud_run_v2_service.backend.location
  name     = google_cloud_run_v2_service.backend.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}

resource "google_cloud_run_v2_service_iam_member" "frontend_public" {
  project  = var.project_id
  location = google_cloud_run_v2_service.frontend.location
  name     = google_cloud_run_v2_service.frontend.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}
