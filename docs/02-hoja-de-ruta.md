# Hoja de Ruta y Backlog del Proyecto (GitOps Platform)

Este documento centraliza el estado de las tareas (Kanban) y la evolución arquitectónica del clúster de Kubernetes, operado bajo el modelo GitOps con ArgoCD.

## FASE 1: Fundación y Orquestación Base (Completada)
El núcleo del clúster y el sistema de despliegue continuo están operativos.
- [x] Aprovisionar arquitectura base local (Minikube sobre OrbStack).
- [x] Instalar controlador GitOps (ArgoCD) eludiendo límite de CRDs (`--server-side`).
- [x] Declarar conexión ArgoCD-GitHub como Código.
- [x] Implementar patrón "App of Apps" para orquestación global.
- [x] Desplegar Capa de Presentación (Nginx Frontend).
- [x] Desplegar Capa de Persistencia (PostgreSQL con PVC).
- [x] Validar resiliencia base y Self-Healing ante destrucción de recursos.
- [x] Solucionar fallo de resolución DNS interno (CoreDNS) tras suspensión del nodo.

## FASE 2: Enrutamiento y Exposición (En Progreso)
Transición de túneles locales (`port-forward`) a resolución de nombres de dominio reales.
- [x] **[BLOCKED]** Habilitar NGINX Ingress Controller en el clúster.
- [x] Declarar reglas de `Ingress` para enrutar tráfico HTTP hacia el Frontend.
- [x] Configurar resolución DNS local (`/etc/hosts`) apuntando a la IP de Minikube.
- [x] Configurar reglas de `Ingress` por subdominios para servicios de gestión (Grafana, pgAdmin, ArgoCD).

## FASE 3: Criptografía y Seguridad Operativa (Pendiente)
Implementación de Zero-Trust y gestión de credenciales seguras.
- [x] Instalar controlador de Bitnami Sealed Secrets vía GitOps.
- [x] Generar par de claves asimétricas en el clúster.
- [x] Encriptar credenciales en texto plano de PostgreSQL (`kubeseal`) y migrar a `SealedSecret`.

## FASE 4: Flujo CI/CD y Cargas de Trabajo (Pendiente)
Desarrollo de la API lógica y automatización de la integración continua.
- [ ] Desarrollar API Backend (Node.js/Python) para gestión de incidencias.
- [ ] Dockerizar la API (arquitectura ARM64).
- [ ] Construir pipeline de GitHub Actions (CI) para build y push a Docker Hub / GHCR.
- [ ] Automatizar actualización de tags en el repositorio GitOps desde GitHub Actions.

## FASE 5: Alta Disponibilidad y Resiliencia Avanzada (Pendiente)
Preparación del clúster para picos de tráfico.
- [ ] Habilitar Metrics Server en el clúster.
- [ ] Configurar Autoescalado Horizontal de Pods (HPA) para el Frontend (escala por CPU > 70%).
- [x] Declarar stack de observabilidad mínima (Grafana) e Ingress integrado bajo el patrón App of Apps.