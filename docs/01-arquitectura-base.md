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


