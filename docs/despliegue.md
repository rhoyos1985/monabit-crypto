# Despliegue en Google Cloud Run

Esta guía explica cómo configurar el proyecto en Google Cloud y el repositorio en GitHub para que los despliegues sean automáticos al hacer merge a `main`.

## Arquitectura

- **Frontend**: imagen Docker con nginx servida desde Cloud Run.
- **Backend**: imagen Docker con Node.js (Express) servida desde Cloud Run.
- **BD**: Supabase Cloud (servicio externo gestionado).
- **Imágenes**: Artifact Registry (GCP).
- **Secretos**: Secret Manager (GCP).
- **IaC**: Terraform aplica los recursos del proyecto.
- **CI/CD**: GitHub Actions usa Workload Identity Federation (sin claves estáticas).

## Despliegue independiente

El pipeline detecta automáticamente qué partes del monorepo cambiaron usando `dorny/paths-filter`:

| Cambios en | Se ejecuta |
|---|---|
| `apps/backend/**` | tests backend → build backend → deploy backend |
| `apps/frontend/**` | tests frontend → build frontend → deploy frontend |
| `infrastructure/terraform/**` | terraform plan + apply |

**No hay redespliegue cruzado**: cambiar el frontend no toca el backend ni viceversa.

## Gate de cobertura (obligatorio)

Cada job de tests ejecuta `yarn test:coverage`, que falla automáticamente si la cobertura no supera el 95 % (configurado en `jest.config.cjs` y `vite.config.ts`). Sin tests pasando con coverage ≥ 95 %, el job de build/deploy correspondiente **no se ejecuta** (relación de dependencia `needs:` en el workflow).

## Configuración inicial (una sola vez)

### 1. Crear proyecto en Google Cloud

```bash
gcloud projects create monabit-crypto --name="MonaBit Crypto"
gcloud config set project monabit-crypto

gcloud billing accounts list  // Se usa para obtener la información que se reemplaza en el BILLING_ACCOUNT_ID 
gcloud billing projects link monabit-crypto --billing-account=BILLING_ACCOUNT_ID   
```

### 2. Crear bucket para el estado de Terraform

```bash
gsutil mb -l us-central1 gs://monabit-terraform-state
gsutil versioning set on gs://monabit-terraform-state
```

### 3. Habilitar APIs y aplicar la infraestructura base

La primera vez se aplica Terraform localmente porque aún no hay deployer. En las siguientes corridas se hace desde GitHub Actions.

```bash
cd infrastructure/terraform
cp terraform.tfvars.example terraform.tfvars
# Editar terraform.tfvars con los valores reales (Supabase URL, keys, etc.)
# IMPORTANTE: github_repository debe ser tu repo real en formato owner/repo
# Si se deja el placeholder, el provider de
# Workload Identity rechaza el token de GitHub Actions con "unauthorized_client:
# rejected by the attribute condition".

terraform init -backend-config="bucket=monabit-terraform-state"
terraform apply
```

Esto crea:
- Cuentas de servicio (`monabit-prod-backend`, `monabit-prod-frontend`, `monabit-prod-deployer`).
- Artifact Registry repository.
- Secretos en Secret Manager.
- Workload Identity Pool y Provider para GitHub Actions.
- Servicios Cloud Run (vacíos hasta el primer push de imagen).

### 3.1. Dar acceso al deployer sobre el bucket de estado

El bucket de estado se crea manualmente (paso 2) y no lo gestiona Terraform, por lo
que la SA del deployer no tiene permiso sobre él por defecto. En el `apply` local se
usan tus credenciales de `gcloud`, pero en GitHub Actions Terraform usa la SA del
deployer; sin este permiso, `terraform init` falla con
`storage.objects.list ... denied`. Concede el acceso una sola vez (la SA ya existe
tras el paso 3):

```bash
gsutil iam ch \
  "serviceAccount:monabit-prod-deployer@monabit-crypto.iam.gserviceaccount.com:roles/storage.objectAdmin" \
  gs://monabit-terraform-state
```

### 4. Obtener los identificadores para GitHub

```bash
terraform output workload_identity_provider
terraform output github_deployer_email
```

### 5. Crear secretos en GitHub

En `Settings → Secrets and variables → Actions` del repositorio crear:

| Secret | Valor |
|---|---|
| `GCP_PROJECT_ID` | `monabit-crypto` |
| `GCP_WORKLOAD_IDENTITY_PROVIDER` | output `workload_identity_provider` |
| `GCP_DEPLOYER_SA` | output `github_deployer_email` |
| `TF_STATE_BUCKET` | `monabit-terraform-state` |
| `SUPABASE_URL` | URL del proyecto Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role key |
| `SUPABASE_ANON_KEY` | anon key (también se embebe en el frontend) |
| `SEED_ADMIN_EMAIL` | `admin@example.com` |
| `SEED_ADMIN_PASSWORD` | password fuerte |
| `VITE_API_BASE_URL` | URL pública del backend en Cloud Run (output `backend_url` de Terraform) |
| `VITE_SUPABASE_URL` | igual a `SUPABASE_URL` |
| `VITE_SUPABASE_ANON_KEY` | igual a `SUPABASE_ANON_KEY` |
| `SUPABASE_ACCESS_TOKEN` | personal access token: https://supabase.com/dashboard/account/tokens |
| `SUPABASE_PROJECT_REF` | identificador del proyecto (subdominio antes de `.supabase.co`) |
| `SUPABASE_DB_PASSWORD` | password de la BD que pusiste al crear el proyecto Supabase |

### 6. Configurar el entorno `production` en GitHub (opcional)

En `Settings → Environments → New environment → production` se puede agregar:
- Aprobación manual antes de desplegar.
- Restricción de rama (`main`).

## Flujo de despliegue automático

1. Desarrollador hace push a `main` (o merge de PR).
2. Workflow `Deploy` detecta qué cambió (`paths-filter`).
3. Jobs de tests corren (backend y/o frontend). **Si coverage < 95 %, todo el pipeline falla aquí.**
4. Si tests pasan:
   - **Migraciones** (si cambiaron `supabase/migrations/**` o si hay deploy de backend) → `supabase db push` contra Supabase Cloud.
   - **Build** de imagen Docker → push a Artifact Registry.
   - **Deploy** a Cloud Run (backend espera a que migraciones terminen para no servir un backend nuevo contra un schema viejo).
5. Si cambió infraestructura: `terraform plan` y `terraform apply`.

### Orden de dependencias del backend

```
backend-test ─┐
              ├─→ backend-build ─┐
migrations-apply ────────────────┴─→ backend-deploy
```

Si las migraciones fallan, el backend nuevo **no** se despliega — la revisión anterior sigue sirviendo tráfico.

## Variables de entorno en Cloud Run

Cloud Run lee los secretos directamente de Secret Manager (configurado vía Terraform). El backend nunca tiene los valores en claro en su configuración.

## URLs públicas

Después del primer despliegue exitoso:

```bash
terraform output backend_url
terraform output frontend_url
```

## Rollback

Cloud Run conserva las revisiones anteriores. Para hacer rollback:

```bash
gcloud run services update-traffic monabit-prod-backend \
  --to-revisions=monabit-prod-backend-00002=100 \
  --region=us-central1
```

O desde la consola: `Cloud Run → servicio → Revisions → Manage Traffic`.
