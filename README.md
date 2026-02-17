# 🔦 API Documentation: Bureau of Paranormal Control

**Repositorio:** [GitHub - joadelviajaca/paranormalControl](https://gemini.google.com/app/cce03ef49a97eaef)

**Endpoint Base:** `http://localhost:4000`

### ⚠️ Formato de Respuesta

Todas las respuestas exitosas devuelven los datos dentro de una propiedad `data`.

JSON

```
{
  "status": "success",
  "timestamp": "2024-02-14T10:00:00Z",
  "data": { ... } // TU INFORMACIÓN AQUÍ
}
```

### 🔐 Autenticación & Usuarios

| **Método** | **Endpoint** | **Descripción** | **Body / Params** |
| --- | --- | --- | --- |
| **POST** | `/auth/login` | Iniciar sesión | `{ email, password }` |
| **POST** | `/auth/register` | Nuevo Agente | `{ email, password, codeName, department }` |
| **GET** | `/auth/validate-token` | Verificar validez de sesión | *Header Token* |
| **GET** | `/check-codename` | Verificar disponibilidad | `?codeName=AgenteK` |
| **GET** | `/users` | **Listar Agentes** (Para selects) | -   |

*Nota: El endpoint de Login devuelve el Token. Los datos del usuario (Rol, Nombre, ID) están codificados DENTRO del token (Payload).*

---

### 📂 Anomalías (Gestión de Casos)

*Requiere Header `Authorization: Bearer <TOKEN>`*

| **Método** | **Endpoint** | **Descripción** | **Body Requerido** | **Restricciones** |
| --- | --- | --- | --- | --- |
| **GET** | `/anomalies` | Listar todas | -   | -   |
| **GET** | `/anomalies/:id` | Obtener una | -   | -   |
| **POST** | `/anomalies` | Registrar nueva | `{ subject, description, dangerLevel, discoveryDate, containmentDate }` | Dates: YYYY-MM-DD |
| **PUT** | `/anomalies/:id` | Modificar datos | `{ description, status, dangerLevel, discoveryDate, containmentDate }` | -   |
| **DELETE** | `/anomalies/:id` | Eliminar registro | -   | **Solo Nivel 5** |

---

### 🎒 Inventario (Equipamiento)

*Requiere Header `Authorization: Bearer <TOKEN>`* *Recurso adicional para la gestión de material de campo.*

| **Método** | **Endpoint** | **Descripción** | **Body Requerido** |
| --- | --- | --- | --- |
| **GET** | `/equipment` | Listar inventario | -   |
| **POST** | `/equipment` | Añadir item | `{ name, type, condition, assignedTo }` |
| **PUT** | `/equipment/:id` | Actualizar item | `{ condition, assignedTo }` |
| **DELETE** | `/equipment/:id` | Dar de baja | -   |

*Nota: `assignedTo` debe ser el ID de un agente (obtenido de `/users`) o `null`.*

---

### 🌍 Ubicaciones (Red de Seguridad)

*Requiere Header `Authorization: Bearer <TOKEN>`*

| **Método** | **Endpoint** | **Descripción** |
| --- | --- | --- |
| **GET** | `/locations` | Listar zonas seguras y puntos calientes |

---

### 🧪 Datos de Acceso (Seed Data)

| **Rol** | **Email** | **Password** | **Code Name** | **Clearance** |
| --- | --- | --- | --- | --- |
| **DIRECTOR** | `director@bureau.com` | `1234` | Director Faden | **5** (Admin) |
| **AGENTE** | `agent@bureau.com` | `1234` | Agente Mulder | **1** (Básico) |