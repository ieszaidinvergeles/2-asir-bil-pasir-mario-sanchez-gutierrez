# Plataforma Cloud-Native con GitOps

![Kubernetes](https://img.shields.io/badge/kubernetes-%23326ce5.svg?style=for-the-badge&logo=kubernetes&logoColor=white)
![ArgoCD](https://img.shields.io/badge/argo_cd-%23F4653D.svg?style=for-the-badge&logo=argo&logoColor=white)
![Docker](https://img.shields.io/badge/docker-%230db7ed.svg?style=for-the-badge&logo=docker&logoColor=white)
![GitHub Actions](https://img.shields.io/badge/github_actions-%232671E5.svg?style=for-the-badge&logo=githubactions&logoColor=white)
![Nginx](https://img.shields.io/badge/nginx-%23009639.svg?style=for-the-badge&logo=nginx&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/postgresql-%23316192.svg?style=for-the-badge&logo=postgresql&logoColor=white)

Plataforma de infraestructura Cloud-Native basada en microservicios y el paradigma GitOps. Este repositorio es la **Única Fuente de Verdad** (Single Source of Truth) de todo el sistema: cualquier cambio en el clúster pasa obligatoriamente por un commit en este repositorio.

---

## Índice

- [Arquitectura](#arquitectura)
- [Stack tecnológico](#stack-tecnológico)
- [Estructura del repositorio](#estructura-del-repositorio)
- [Dominios y acceso](#dominios-y-acceso)
- [Flujo GitOps](#flujo-gitops)
- [Puesta en marcha desde cero](#puesta-en-marcha-desde-cero)
- [Gestión de secretos](#gestión-de-secretos)
- [TLS / HTTPS](#tls--https)
- [Monitorización](#monitorización)

---

## Arquitectura

El tráfico externo entra siempre por el **NGINX Ingress Controller**, que lo enruta al servicio correspondiente según el host:

```
Internet / Navegador
        │
        ▼
NGINX Ingress Controller  (único punto de entrada, HTTPS forzado)
        │
        ├──▶ tfg-plataforma.test         ──▶ Frontend (Nginx)  ──▶ Backend (Node.js)  ──▶ PostgreSQL
        ├──▶ pgadmin.tfg-plataforma.test ──▶ pgAdmin
        ├──▶ grafana.tfg-plataforma.test ──▶ Grafana (stack Prometheus)
        └──▶ argocd.tfg-plataforma.test  ──▶ ArgoCD
```

### Namespaces

| Namespace | Contenido |
|-----------|-----------|
| `default` | Frontend, Backend, PostgreSQL, pgAdmin |
| `monitoring` | Prometheus, Grafana, Alertmanager |
| `argocd` | ArgoCD |
| `kube-system` | SealedSecrets |

---

## Stack tecnológico

| Capa | Tecnología | Función |
|------|------------|---------|
| Orquestación | Kubernetes (Minikube) | Gestión de contenedores |
| GitOps CD | ArgoCD | Despliegue continuo desde Git |
| CI | GitHub Actions | Construcción y publicación de imágenes |
| Registro | GitHub Container Registry (ghcr.io) | Almacenamiento de imágenes Docker |
| Frontend | Nginx | Servidor de estáticos y proxy inverso |
| Backend | Node.js + Express | API REST (`POST /api/leads`) |
| Base de datos | PostgreSQL 15 | Persistencia (PVC 1Gi) |
| Administración DB | pgAdmin 4 | Interfaz web para PostgreSQL |
| Secretos | SealedSecrets (Bitnami) | Cifrado asimétrico de secretos en Git |
| TLS | mkcert + SealedSecrets | Certificados de confianza local |
| Monitorización | Prometheus + Grafana | Métricas de pods, nodos y red |
| Ingress | NGINX Ingress Controller | Enrutamiento HTTP/HTTPS |

---

## Estructura del repositorio

```
.
├── .github/
│   └── workflows/
│       ├── ci-backend.yml       # Pipeline CI: construye y publica imagen del backend
│       └── ci-frontend.yml      # Pipeline CI: construye y publica imagen del frontend
│
├── apps/                        # Manifiestos de las aplicaciones
│   ├── backend/
│   │   ├── deployment.yml       # Deployment del backend (Node.js)
│   │   └── service.yml          # Service ClusterIP del backend
│   ├── database/
│   │   ├── postgres-db.yml      # Deployment + Service + PVC de PostgreSQL
│   │   ├── postgres-sealed-secret.yaml  # Credenciales de PostgreSQL (cifradas)
│   │   ├── pgadmin.yml          # Deployment + Service de pgAdmin
│   │   └── pgadmin-sealed-secret.yaml   # Credenciales de pgAdmin (cifradas)
│   └── frontend/
│       ├── frontend.yml         # Deployment + Service del frontend (3 réplicas)
│       ├── dockerfile           # Imagen Docker del frontend
│       ├── index.html           # Página principal de la plataforma
│       ├── css/styles.css       # Estilos
│       └── js/app.js            # Lógica del formulario (fetch POST /api/leads)
│
├── infra/                       # Infraestructura gestionada por ArgoCD
│   ├── argocd-apps/             # Definiciones de Applications de ArgoCD (App of Apps)
│   │   ├── app-raiz-orquestador.yml  # App raíz: gestiona todos los demás apps
│   │   ├── backend.yml          # ArgoCD app → apps/backend/
│   │   ├── database.yml         # ArgoCD app → apps/database/
│   │   ├── fronted.yml          # ArgoCD app → apps/frontend/
│   │   ├── monitoring.yml        # ArgoCD app → kube-prometheus-stack (Helm)
│   │   ├── ingresses-app.yml    # ArgoCD app → infra/ingresses/
│   │   ├── sealed-secrets-app.yml    # ArgoCD app → SealedSecrets (Helm)
│   │   └── tls-certs-app.yml    # ArgoCD app → infra/tls-certs/
│   ├── ingresses/               # Todos los Ingress de la plataforma
│   │   ├── plataforma-ingress.yml    # Frontend + Backend (tfg-plataforma.test)
│   │   ├── pgadmin-ingress.yml       # pgAdmin
│   │   ├── grafana-ingress.yml       # Grafana (namespace: monitoring)
│   │   └── argocd-ingress.yml        # ArgoCD
│   └── tls-certs/               # SealedSecrets con certificados TLS (seguros para Git)
│       ├── plataforma-tls.yaml
│       ├── pgadmin-tls.yaml
│       ├── grafana-tls.yaml
│       └── argocd-tls.yaml
│
├── src/
│   └── backend/
│       ├── server.js            # Código fuente del backend (Express + pg)
│       ├── package.json
│       └── dockerfile           # Imagen Docker del backend
│
└── docs/                        # Documentación técnica
    ├── infraestructura.md       # Este fichero
    ├── 01-arquitectura-base.md
    ├── 02-hoja-de-ruta.md
    └── comandos/                # Guías y referencia de comandos
```

---

## Dominios y acceso

| Servicio | URL | Credenciales |
|----------|-----|--------------|
| Plataforma | `https://tfg-plataforma.test` | — |
| ArgoCD | `https://argocd.tfg-plataforma.test` | `admin` / ver abajo |
| Grafana | `https://grafana.tfg-plataforma.test` | `admin` / `prom-operator` |
| pgAdmin | `https://pgadmin.tfg-plataforma.test` | ver SealedSecret |

Para obtener la contraseña de ArgoCD:
```bash
kubectl get secret argocd-initial-admin-secret -n argocd \
  -o jsonpath="{.data.password}" | base64 -d
```

---

## Flujo GitOps

```
Developer
    │
    │  git push → main
    ▼
GitHub Repository  (Single Source of Truth)
    │
    │  GitHub Actions detecta cambio en src/ o apps/frontend/
    ▼
GitHub Actions CI
    ├── docker build --platform linux/amd64,linux/arm64
    └── docker push → ghcr.io/<owner>/tfg-{frontend,backend-api}:latest
    │
    │  ArgoCD detecta nuevo commit (polling cada 3 min)
    ▼
ArgoCD (app-raiz-orquestador)
    ├── Compara estado Git vs estado clúster
    ├── Si hay diferencia → aplica los manifiestos
    └── Si hay drift manual → restaura el estado de Git (selfHeal)
```

### Patrón App of Apps

`app-raiz-orquestador` apunta a `infra/argocd-apps/` y gestiona el ciclo de vida de todas las Applications de ArgoCD. Añadir una nueva app al clúster es tan sencillo como crear un fichero `.yml` en ese directorio y hacer commit.

---

## Puesta en marcha desde cero

### Requisitos previos

- Minikube instalado y corriendo
- `kubectl`, `helm`, `kubeseal`, `mkcert` disponibles en el PATH
- Addon de ingress habilitado:
  ```bash
  minikube addons enable ingress
  ```

### 1. Preparar el clúster

```bash
# Cambiar el servicio de ingress-nginx a LoadBalancer para que minikube tunnel lo exponga en 127.0.0.1
kubectl patch svc ingress-nginx-controller -n ingress-nginx \
  -p '{"spec": {"type": "LoadBalancer"}}'

# Exponer el clúster en los puertos estándar 80 y 443 (dejar corriendo en terminal separada)
minikube tunnel
```

### 2. Configurar /etc/hosts

```bash
sudo sh -c 'echo "127.0.0.1  tfg-plataforma.test pgadmin.tfg-plataforma.test grafana.tfg-plataforma.test argocd.tfg-plataforma.test" >> /etc/hosts'
```

### 3. Instalar ArgoCD

```bash
kubectl create namespace argocd
kubectl apply -n argocd \
  -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

kubectl rollout status deployment argocd-server -n argocd --timeout=120s
```

### 4. Configurar ArgoCD para acceso vía ingress

```bash
# NGINX termina TLS, ArgoCD sirve HTTP internamente
kubectl patch configmap argocd-cmd-params-cm -n argocd \
  --type merge -p '{"data": {"server.insecure": "true"}}'

kubectl patch configmap argocd-cm -n argocd \
  --type merge -p '{"data": {"url": "https://argocd.tfg-plataforma.test"}}'

kubectl rollout restart deployment argocd-server -n argocd
kubectl rollout status deployment argocd-server -n argocd --timeout=60s
```

### 5. Arrancar el patrón App of Apps

```bash
kubectl apply -f infra/argocd-apps/app-raiz-orquestador.yml
```

ArgoCD detectará todos los ficheros en `infra/argocd-apps/` y desplegará el resto de la plataforma de forma automática (backend, frontend, base de datos, ingresses, sealed-secrets, tls-certs).

### 6. Configurar TLS con mkcert

```bash
# Instalar la CA de mkcert en el Keychain del sistema (pide contraseña de macOS)
mkcert -install

# Generar certificado wildcard para todos los subdominios
mkcert "tfg-plataforma.test" "*.tfg-plataforma.test"

# Sellar los secrets TLS para cada namespace
for args in "plataforma-tls default" "pgadmin-tls default" "grafana-tls monitoring" "argocd-tls argocd"; do
  name=$(echo $args | cut -d' ' -f1)
  ns=$(echo $args | cut -d' ' -f2)
  kubectl create secret tls $name -n $ns \
    --cert=tfg-plataforma.test+1.pem \
    --key=tfg-plataforma.test+1-key.pem \
    --dry-run=client -o yaml | \
  kubeseal --controller-name=sealed-secrets \
           --controller-namespace=kube-system \
           --format yaml > infra/tls-certs/${name}.yaml
  echo "✓ $name sellado"
done

# Hacer commit de infra/tls-certs/ y ArgoCD los aplicará automáticamente
git add infra/tls-certs/
git commit -m "feat: add sealed TLS certificates"
git push
```

---

## Gestión de secretos

Los secretos **nunca se guardan en texto plano** en el repositorio. Se usa el operador **SealedSecrets** de Bitnami:

1. El operador genera un par de claves RSA en el clúster. La clave privada nunca sale del clúster.
2. Los secretos se cifran con `kubeseal` usando la clave pública antes de hacer commit.
3. ArgoCD aplica los `SealedSecret` cifrados. El controlador los descifra dentro del clúster y genera el `Secret` nativo de Kubernetes.

```bash
# Ejemplo: crear un nuevo secreto sellado
kubectl create secret generic mi-secreto \
  --from-literal=clave=valor \
  --dry-run=client -o yaml | \
kubeseal --controller-name=sealed-secrets \
         --controller-namespace=kube-system \
         --format yaml > apps/mi-app/mi-secreto-sealed.yaml
```

> **Importante:** los SealedSecrets están ligados al clúster que los cifró. Si se recrea el clúster hay que volver a sellar los secretos con la nueva clave pública.

---

## TLS / HTTPS

Los certificados son generados con **mkcert** y almacenados como SealedSecrets en `infra/tls-certs/`. La CA de mkcert se instala en el Keychain de macOS, por lo que Chrome y Safari muestran el candado verde sin advertencias.

- Todo el tráfico HTTP es redirigido automáticamente a HTTPS (`ssl-redirect: "true"`).
- El certificado cubre `tfg-plataforma.test` y `*.tfg-plataforma.test` (wildcard).
- Los secrets TLS son gestionados por la Application `tls-certs` de ArgoCD.
- **Caducidad del certificado actual: 12 de agosto de 2028.**

Para renovar los certificados cuando caduquen:
```bash
mkcert "tfg-plataforma.test" "*.tfg-plataforma.test"
# Volver a ejecutar el bucle de sellado de la sección anterior y hacer push
```

> **Firefox:** la CA de mkcert no se instala automáticamente en Firefox. Para añadirla manualmente: `about:preferences#privacy` → Ver certificados → Autoridades → Importar → seleccionar `~/Library/Application Support/mkcert/rootCA.pem`.

---

## Monitorización

El stack de observabilidad (Prometheus + Grafana + Alertmanager) se despliega mediante Helm en el namespace `monitoring`.

Grafana incluye dashboards preconfigurados para:
- Uso de CPU y memoria por pod y nodo
- Tráfico de red
- Estado de los deployments y réplicas

Acceso: `https://grafana.tfg-plataforma.test` — credenciales: `admin` / `prom-operator`
