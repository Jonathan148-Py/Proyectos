# 🚨 ReportaYa Web

**ReportaYa** es una plataforma web de gestión comunitaria y seguridad ciudadana orientada a la comuna de San Bernardo, Chile. El sistema permite la gestión y visualización de reportes de incidentes, multas, alertas vecinales y el monitoreo de solicitudes de cámaras de seguridad en tiempo real.

---

## 🚀 Características Principales

*   **🗺️ Mapa Interactivo Comunal:** Visualización de zonas e incidentes basada en capas geográficas (Plan Regulador Comunal mediante archivos GeoJSON).
*   **🔔 Sistema de Alertas Vecinales:** Creación, filtrado y visualización detallada de alarmas comunitarias e incidentes de seguridad.
*   **🎫 Gestión de Infracciones:** Módulo para la revisión detallada de multas y partes emitidos.
*   **👥 Administración de Usuarios:** Panel de control para el registro, listado y gestión de roles/usuarios de la plataforma.
*   **🔒 Seguridad y Accesos:** Rutas protegidas mediante Guards para garantizar que solo usuarios autenticados ingresen al sistema.

---

## 🛠️ Tecnologías Utilizadas

*   **Framework Principal:** [Angular](https://angular.dev/) (Versión 18+)
*   **Base de Datos y Autenticación:** [Firebase](https://firebase.google.com/) (Autenticación y almacenamiento de datos en tiempo real)
*   **Geolocalización:** Datos geoespaciales estructurados en formato GeoJSON para mapeo local.

---

## 📁 Estructura del Proyecto

El código fuente se encuentra organizado bajo una arquitectura modular limpia dentro de la carpeta `/src/app`:

*   `📁 paginas/`: Contiene los componentes de pantalla completa (Login, Inicio, Alertas, Multas, Cámaras, Mapa y Gestión de Usuarios).
*   `📁 servicios/`: Lógica de comunicación con Firebase y manejo de datos compartidos (Alertas y Usuarios).
*   `📁 guards/`: Guardianes de ruta encargados de la seguridad y autenticación del sitio.
*   `📁 assets/`: Recursos visuales de la aplicación, mapas comunales en GeoJSON e imágenes de interfaz.

---

## 💻 Desarrollo Local

Este proyecto fue generado con [Angular CLI](https://github.com/angular/angular-cli).

### Servidor de Desarrollo

Para levantar el proyecto localmente, ejecuta en la terminal:

```bash
ng serve
