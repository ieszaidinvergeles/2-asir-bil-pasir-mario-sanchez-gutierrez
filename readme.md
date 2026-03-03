# 🚀 Plataforma Cloud-Native y Despliegue Continuo (GitOps)

![Kubernetes](https://img.shields.io/badge/kubernetes-%23326ce5.svg?style=for-the-badge&logo=kubernetes&logoColor=white)
![ArgoCD](https://img.shields.io/badge/argo_cd-%23F4653D.svg?style=for-the-badge&logo=argo&logoColor=white)
![Docker](https://img.shields.io/badge/docker-%230db7ed.svg?style=for-the-badge&logo=docker&logoColor=white)

## Visión General
Este proyecto es el núcleo de una **Plataforma como Servicio (PaaS)**. Su objetivo es modernizar la gestión de infraestructura tecnológica en PYMES, sustituyendo la administración de sistemas tradicional (servidores estáticos y configuración manual) por una arquitectura distribuida, inmutable y automatizada.

El sistema se basa íntegramente en el paradigma **GitOps**, donde este repositorio no solo almacena código, sino que actúa como la **Única Fuente de Verdad** (Single Source of Truth) de toda la infraestructura y las aplicaciones de producción.

## El Problema que Resuelve
Las arquitecturas tradicionales sufren de caídas de servicio durante los despliegues y de "deriva de configuración" (*configuration drift*), donde el estado real del servidor deja de coincidir con lo documentado tras realizar cambios manuales. Esto genera entornos frágiles, costosos de mantener y difíciles de auditar.

## La Solución y Metodología Operativa
Esta plataforma elimina el acceso humano directo a los servidores de producción mediante la implementación de las siguientes directrices operativas:

1. **Infraestructura Declarativa:** Todos los recursos de red, almacenamiento y servicios están definidos en código (archivos YAML). 
2. **Despliegue basado en "Pull":** Se rechazan los pipelines tradicionales (CI/CD) que inyectan código desde fuera. En su lugar, un motor interno de GitOps vigila este repositorio 24/7 y extrae los cambios de forma autónoma.
3. **Auto-curación (Self-Healing):** Si se produce una alteración manual no autorizada o un fallo en el clúster, el sistema detecta la divergencia respecto a este repositorio y restaura el estado original en milisegundos.
4. **Cero Tiempo de Inactividad (Zero Downtime):** Despliegues estructurados para garantizar la alta disponibilidad de los servicios críticos durante las actualizaciones.

## Arquitectura y Stack Tecnológico
* **Orquestación del Clúster:** Kubernetes. Abstrae el hardware subyacente y proporciona escalabilidad horizontal.
* **Controlador GitOps:** ArgoCD. Actúa como el cerebro reconciliador entre el estado declarado en Git y el estado real del clúster.
* **Cargas de Trabajo Aisladas:** Arquitectura de microservicios con separación estricta entre capas de presentación (Nginx), lógica (API) y persistencia (PostgreSQL).