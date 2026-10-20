# SIFFA - Sindicato Internacional de Fútbol Femenino y Afines
## Plataforma Institucional, Credenciales Digitales QR Dinámicas y Control de Accesos

Convenio Oficial de Cooperación con el Ministerio de Justicia y Derechos Humanos de la Provincia de Buenos Aires y el Servicio Penitenciario Bonaerense (SPB).

---

### 📋 Requisitos Previos
- **Node.js** v18 o superior
- **npm** v9 o superior (o bun / yarn / pnpm)

---

### 🚀 Instalación y Puesta en Marcha

1. **Instalar dependencias**:
   ```bash
   npm install
   ```

2. **Iniciar en modo desarrollo**:
   ```bash
   npm run dev
   ```
   La aplicación se abrirá en `http://localhost:3000`.

3. **Construir para producción**:
   ```bash
   npm run build
   ```

4. **Ejecutar servidor en producción**:
   ```bash
   npm start
   ```

---

### 🔑 Perfiles de Prueba Pre-configurados

| Perfil | Correo de Acceso | Contraseña | Rol / Función |
| :--- | :--- | :--- | :--- |
| **Matías Medina** | `matiasmedina.n@gmail.com` | `admin2026` | Super Administrador SIFFA |
| **Lic. Marcela Giménez** | `marcela.gimenez@siffa.org` | `marcela2026` | Docente DT Fútbol 11 (UP33) |
| **Prof. Romina Albornoz** | `romina.albornoz@siffa.org` | `romina2026` | Preparadora Física (UP47) |
| **Lic. Florencia Navarro** | `florencia.navarro@siffa.org` | `florencia2026` | Psicóloga Social (UP50) |
| **Camila Benítez** | `camila.benitez@siffa.org` | `camila2026` | Tallerista Textil (UP40) |
| **Dr. Esteban Valenzuela** | `esteban.valenzuela@siffa.org` | `esteban2026` | Médico Deportólogo (UP45/51) |
| **Valeria Sosa** | `valeria.sosa@siffa.org` | `valeria2026` | Árbitra Oficial AFA (UP33) |
| **Dra. Silvina Campos** | `silvina.campos@siffa.org` | `campos2026` | Directora General SIFFA - SPB |
| **Guardia Garita UP33** | `guardia.u33@spb.gba.gob.ar` | `garita33` | Validador de Acceso SPB |
| **Auditoría Forense** | `auditoria@siffa.org` | `auditor2026` | Auditor de Trazabilidad |

---

### 🛠️ Arquitectura Técnica
- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS.
- **Backend**: Node.js, Express (`server.ts`, `server/routes.ts`, `server/store.ts`).
- **Criptografía**: Criptografía asimétrica Ed25519 (`tweetnacl`) para firma y verificación inmutable de tokens QR dinámicos offline.
- **Gestión Visual**: Gestor de imágenes en tiempo real para el administrador.
