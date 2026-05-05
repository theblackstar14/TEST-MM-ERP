# ERP MMHIGHMETRIK Engineers

ERP empresarial para empresa constructora MM HIGH METRIK ENGINEERS S.A.C. (RUC 20610639764).

Frontend React + Babel-standalone (sin build step). Backend Node.js Express + WebDAV para conexión NAS Synology.

## Setup en máquina nueva

### 1. Prerequisitos

Instalar **Node.js 18+** desde https://nodejs.org/ (usa el instalador LTS).

Verificar instalación:
```cmd
node --version
npm --version
```

### 2. Descargar el proyecto

Opción A · Git:
```cmd
git clone https://github.com/TU_USUARIO/TU_REPO.git
cd TU_REPO
```

Opción B · ZIP: descargar desde GitHub → "Code" → "Download ZIP" → extraer.

### 3. Configurar backend NAS

Copiar archivo de ejemplo y editarlo:
```cmd
cd erp-nas-backend
copy config.example.json config.json
```

Abrir `config.json` con Notepad y completar:
```json
{
  "nas": {
    "url": "https://192.168.1.200:5006",
    "user": "Soporte",
    "pass": "Gabriel123",
    "rootPath": "/Proyectos",
    "tlsInsecure": true
  },
  "server": { "port": 3001, "host": "0.0.0.0", "uploadLimitMB": 500, "corsOrigin": "*" }
}
```

Instalar dependencias:
```cmd
npm install
```

### 4. Arrancar el sistema

**Opción A · Doble clic** en `start.bat` (recomendado · abre 2 ventanas).

**Opción B · Manual** (2 ventanas CMD):

Ventana 1 — backend NAS:
```cmd
cd erp-nas-backend
node server.js
```

Ventana 2 — servidor web frontend:
```cmd
npx http-server -p 8000 -c-1
```

### 5. Abrir el ERP

Browser: http://localhost:8000

Listo.

## Estructura del proyecto

```
/
├── index.html              · entrada frontend
├── src/                    · código React (modules, components, data)
├── assets/                 · logo + libs (qrcode, jsQR)
├── erp-nas-backend/        · proxy Node.js para NAS
│   ├── server.js
│   ├── config.json         · gitignored (secreto)
│   └── package.json
├── api/                    · endpoint legacy (Vercel)
├── start.bat               · arranque rápido Windows
└── vercel.json
```

## Solución de problemas

**Backend no conecta al NAS**:
- Verifica laptop en misma red que NAS (`ping 192.168.1.200`)
- WebDAV Server activo en DSM Synology
- Usuario/password correctos en `config.json`

**Frontend tab Documentos sale "Modo demo"**:
- Backend no arrancó o crasheó · revisa la ventana CMD del backend
- Si querés solo demo, modo demo funciona con datos simulados

**Puerto 8000 ocupado**:
```cmd
npx http-server -p 8080 -c-1
```
Y abrir http://localhost:8080

## Tecnología

- React 18 vía Babel-standalone (sin build/bundler)
- Express 4 + WebDAV cliente (backend)
- pdf.js, ECharts, Leaflet (libs externas)
- localStorage para persistencia local

## Licencia

Propietaria · MM HIGH METRIK ENGINEERS S.A.C.
