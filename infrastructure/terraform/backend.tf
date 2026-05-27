# State remoto en GCS para permitir despliegues desde CI sin perder estado.
# El bucket debe existir antes (creado manualmente una sola vez).

terraform {
  backend "gcs" {
    # bucket = "monabit-terraform-state"   se inyecta con: terraform init -backend-config="bucket=..."
    prefix = "terraform/state"
  }
}
