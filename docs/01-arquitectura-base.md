# Arquitectura Base y Motor GitOps

Este documento describe la fase inicial de aprovisionamiento de infraestructura y la implementación del motor de Despliegue Continuo (CD) mediante el patrón "App of Apps" para el Trabajo de Fin de Grado.

## 1. Stack Tecnológico Base
* **Entorno Local:** macOS (Arquitectura ARM64 / Apple Silicon).
* **Motor de Contenedores:** Docker (vía OrbStack).
* **Clúster Kubernetes:** Minikube.
* **Orquestador GitOps:** ArgoCD.

## 2. Topología del Repositorio (Single Source of Truth)
La infraestructura se gestiona estrictamente bajo el paradigma de Infraestructura como Código (IaC). El repositorio está dividido estratégicamente por dominios:

```text
├── docs/                       # Documentación técnica (Docs as Code)
├── infra/                      # Configuración core del clúster
│   └── argocd-apps/            # Manifiestos del patrón App of Apps
└── apps/                       # Cargas de trabajo de negocio
    ├── frontend/               # Nginx (Capa de Presentación)
    └── database/               # PostgreSQL (Capa de persistencia)
```

## 3. Secuencia de arranque
El nodo base se levanta utilizando el driver de docker


### 3.1 Aprovisonamiento del clúster

```bash
minikube start --driver=docker
```

### 3.2 Instalación del orquestador (ARGOCD)
Se instala el orquestador ArgoCD en el clúster de Kubernetes.

> **Nota Arquitectónica (Resolución de Bugs)::** Se utiliza obligatoriamente el flag --server-side=true para eludir el límite físico de 256KB en las anotaciones last-applied-configuration de la base de datos etcd de Kubernetes, evitando así el fallo en la instalación del CRD ApplicationSet que provocaba un CrashLoopBackOff en el controlador.
```bash
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
```

## 4. Patrón "App of Apps"
En lugar de crear aplicaciones manualmente en la interfaz web (ClickOps), se ha implementado una Aplicación Raíz (app-raiz-orquestador).

Esta aplicación vigila el directorio infra/argocd-apps/ del repositorio Git. Cualquier manifiesto de tipo Application depositado en esa carpeta genera automáticamente el despliegue en cascada de la carga de trabajo correspondiente, eliminando la intervención humana.  

## 5. Cargas de trabajo de actuales (fase 1)


### 1. Frontend (Nginx)

Desplegado mediante un Deployment de 2 réplicas y expuesto internamente con un Service tipo NodePort.

### 2. Database (PostgreSQL)

Desplegada con persistencia de datos real garantizada mediante un PersistentVolumeClaim (PVC) de 1Gi, asegurando la supervivencia de los datos ante la muerte del pod.   

## 6. Validación de datos

Se ha superado la prueba de estrés de Nivel 2.
Al eliminar manualmente recursos críticos estructurales en producción (kubectl delete service postgres-service y kubectl delete deployment postgres), el Reconciliation Loop de ArgoCD detectó la divergencia (Drift) entre el estado del clúster y el estado en Git. El sistema restauró automáticamente la base de datos y su red en aproximadamente 60 segundos, cumpliendo los principios fundamentales de OpenGitOps.

## 7. Capa de Enrutamiento y Exposición (Ingress)

Se ha superado la limitación de los servicios `NodePort` implementando un controlador de tráfico de grado de producción.

* **Ingress Controller:** Despliegue de NGINX Ingress Controller como puerta de enlace única al clúster.
* **Resolución Local:** Configuración de DNS estático en el host (`/etc/hosts`) para enrutar el dominio local `tfg-plataforma.test` hacia la IP de Minikube.
* **Reglas de Enrutamiento:** Creación de manifiestos `Ingress` tipados estrictamente para mapear las peticiones HTTP del dominio hacia el servicio interno del Frontend, delegando en el controlador la carga del balanceo L7.

## 8. Arquitectura de Seguridad y Confianza Cero (Zero-Trust)

Para evitar la exposición de credenciales en el repositorio, se ha implementado un modelo de gestión segura de secretos basado en criptografía asimétrica.

### 8.1 Criptografía Asimétrica (GitOps Seguro)

La inyección de secretos en texto plano en repositorios de Git es un antipatrón crítico. Para solucionarlo, se ha integrado **Bitnami Sealed Secrets**.

* **Despliegue Helm:** Inyección automatizada del controlador mediante ArgoCD utilizando el empaquetador Helm, apuntando al repositorio nativo de Bitnami y fijando una versión estable moderna.
* **Cifrado Offline:** Utilización del CLI `kubeseal` para encriptar la contraseña de PostgreSQL con la clave pública del clúster directamente en la máquina del desarrollador.
* **Inyección Dinámica:** El manifiesto `SealedSecret` encriptado reside de forma segura en GitHub. Al ser sincronizado por ArgoCD, el controlador lo descifra en memoria RAM y lo inyecta dinámicamente como variable de entorno en el Pod de PostgreSQL.

## 9. Cadena de Suministro e Integración Continua (CI)

Para alimentar el motor de Despliegue Continuo (CD) de ArgoCD, se ha construido un pipeline de CI automatizado desligando el código fuente de la infraestructura.

### 9.1 Microservicio Backend (Node.js)

Creación de la API de negocio encargada de consumir el secreto inyectado y conectarse al servicio interno de PostgreSQL, paquetizada con su correspondiente `Dockerfile`.

### 9.2 Pipeline de Compilación (GitHub Actions)

Automatización del proceso de empaquetado y distribución utilizando un enfoque agnóstico de hardware.

* **Multi-Arquitectura:** Implementación de emuladores QEMU y Docker Buildx en los *runners* de GitHub para generar manifiestos de imagen duales (`linux/amd64` y `linux/arm64`), garantizando la portabilidad entre entornos de nube (x86) y entornos locales como Apple Silicon.
* **Registro Nativo (GHCR):** Publicación de las imágenes directamente en *GitHub Container Registry* mediante inyección automática del token efímero de GitHub, eliminando la necesidad de gestionar credenciales estáticas de terceros (como Docker Hub).
* **Prevención de Deuda Técnica:** Inyección global de variables de entorno (`FORCE_JAVASCRIPT_ACTIONS_TO_NODE24`) para forzar el uso del motor Node.js 24 en los *runners*, mitigando proactivamente los avisos de obsolescencia de GitHub.

## 10. Estado Actual y Gobernanza (RBAC)

*Fase Bloqueada:* La imagen del backend se encuentra compilada y alojada en GHCR. El despliegue automatizado hacia Kubernetes está pausado a la espera de resolución de políticas de Gobernanza e Identidad de la organización para modificar la visibilidad del paquete a "Público", o en su defecto, implementar el flujo de autenticación privada mediante `ImagePullSecrets`.



