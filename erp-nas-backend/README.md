# ERP NAS Backend · MMHIGHMETRIK

Proxy Node.js que conecta el frontend ERP al NAS Synology DS425+ vía WebDAV.

## Arquitectura

```
[Frontend localhost:8000]  →  [Backend localhost:3001]  →  [NAS Synology WebDAV]
```

## Setup inicial · primera vez

### 1. Activar WebDAV en el NAS Synology

1. DSM → **Centro de paquetes** → buscar **WebDAV Server** → Instalar
2. Abrir paquete WebDAV Server → activar **HTTP puerto 5005**
3. **Panel de control** → **Carpeta compartida** → crear carpeta `Proyectos` (si no existe)
4. **Panel de control** → **Usuario y grupo** → crear usuario `erp-user`
   - Asignar permisos lectura/escritura a `/Proyectos`
5. Crear estructura inicial dentro de `/Proyectos/OB-2026-009/`:
   ```
   00_Generales/
   01_Contratos/
   02_Planos/
   03_Cronograma/
   04_Presupuestos/
   05_Valorizaciones/
   06_Fotografias/
   07_Personal/
   08_Calidad/
   09_SSOMA/
   10_Actas/
   11_RFI_RDI/
   12_Adicionales/
   ```
6. Verificar acceso: abrir browser en `http://[IP_NAS]:5005/Proyectos` → debe pedir login

### 2. Instalar backend

Requiere **Node.js 18+** instalado en la laptop.

```bash
cd erp-nas-backend
npm install
```

### 3. Configurar credenciales

```bash
# Copiar archivo de ejemplo
cp config.example.json config.json

# Editar config.json con tus datos reales
```

Editar `config.json`:
```json
{
  "nas": {
    "url": "http://192.168.1.50:5005",        // IP real del NAS
    "user": "erp-user",                       // usuario creado
    "pass": "TU_PASSWORD_REAL",               // password
    "rootPath": "/Proyectos"                  // carpeta share
  },
  "server": {
    "port": 3001,
    "host": "0.0.0.0",
    "uploadLimitMB": 500,
    "corsOrigin": "*"
  }
}
```

### 4. Arrancar el backend

```bash
node server.js
```

Salida esperada:
```
✅ ERP NAS Backend corriendo en http://localhost:3001
✅ Conectado a NAS http://192.168.1.50:5005
```

Si falla la conexión al NAS, verifica:
- IP correcta y NAS encendido
- WebDAV Server activo en DSM
- Usuario y password correctos
- Firewall permite puerto 5005

## Uso

Una vez corriendo, el frontend ERP detecta automáticamente `localhost:3001`. Tab **Documentos** del proyecto se conecta solo.

## Endpoints API

- `GET /api/health` — verifica conexión NAS
- `GET /api/files/list?path=/OB-2026-009/02_Planos` — lista contenido carpeta
- `POST /api/files/upload` — subir archivo (multipart, fields: `path`, `file`)
- `GET /api/files/download?path=...` — descargar archivo
- `GET /api/files/preview?path=...` — preview inline (PDF, imágenes)
- `POST /api/files/mkdir` — crear carpeta `{ path, name }`
- `POST /api/files/move` — mover/renombrar `{ from, to }`
- `DELETE /api/files/delete?path=...` — eliminar archivo/carpeta

## Producción (post-demo · futuro)

Para producción recomendamos correr este backend dentro del propio NAS via Docker:
- DSM → Container Manager → instalar
- Build imagen + correr en NAS
- Frontend en Vercel apunta a `https://[NAS_DDNS]:3001`

Ver `DEPLOY.md` (próximamente) para guía detallada.

## Troubleshooting

**Error: "ECONNREFUSED 192.168.x.x:5005"**
- WebDAV Server no está corriendo en DSM
- IP del NAS cambió
- Firewall bloquea

**Error: "401 Unauthorized"**
- Usuario o password incorrectos
- Usuario no tiene permisos en /Proyectos

**Error CORS desde frontend**
- Verifica `corsOrigin: "*"` en config.json

**Uploads lentos**
- Conexión WiFi débil entre laptop y NAS
- Cable Ethernet recomendado para archivos grandes
