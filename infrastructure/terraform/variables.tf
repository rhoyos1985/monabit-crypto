variable "project_id" {
  description = "ID del proyecto de Google Cloud"
  type        = string
}

variable "region" {
  description = "Region de Google Cloud"
  type        = string
  default     = "us-central1"
}

variable "environment" {
  description = "Entorno (dev, prod)"
  type        = string
  default     = "prod"

  validation {
    condition     = contains(["dev", "prod"], var.environment)
    error_message = "environment debe ser 'dev' o 'prod'."
  }
}

variable "backend_image" {
  description = "URI completa de la imagen Docker del backend en Artifact Registry"
  type        = string
}

variable "frontend_image" {
  description = "URI completa de la imagen Docker del frontend en Artifact Registry"
  type        = string
}

# Origen permitido por CORS en el backend. Detras del reverse proxy de nginx el
# navegador es mismo-origen y CORS no se ejercita, por lo que es opcional; se
# mantiene para accesos directos al backend. Se deja como variable (en vez de
# referenciar la URL del frontend) para evitar una dependencia circular entre
# los servicios de Cloud Run.
variable "cors_origin" {
  description = "Origen permitido por CORS en el backend (opcional con reverse proxy)"
  type        = string
  default     = ""
}

variable "supabase_url" {
  description = "URL del proyecto Supabase"
  type        = string
  sensitive   = true
}

variable "supabase_service_role_key" {
  description = "Service role key de Supabase (solo backend)"
  type        = string
  sensitive   = true
}

variable "supabase_anon_key" {
  description = "Anon key de Supabase (publica, frontend la usa)"
  type        = string
  sensitive   = true
}

variable "seed_admin_email" {
  description = "Email del admin inicial creado por el seed"
  type        = string
  default     = "admin@example.com"
}

variable "seed_admin_password" {
  description = "Password del admin inicial"
  type        = string
  sensitive   = true
}

variable "crypto_private_key" {
  description = "Llave privada RSA (PKCS8 PEM) para el cifrado de extremo a extremo del backend"
  type        = string
  sensitive   = true
}

variable "github_repository" {
  description = "Repositorio de GitHub en formato 'owner/repo' para Workload Identity Federation"
  type        = string
}
