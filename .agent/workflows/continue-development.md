---
description: Continuar desarrollo estructurado del Notion Clone
---

# 🎯 PROMPT PARA CONTINUAR DESARROLLO - NOTION CLONE

## Contexto del Proyecto

### Stack Tecnológico
- **Backend**: NestJS + TypeORM + PostgreSQL (puerto 4000)
- **Frontend**: Next.js 14 + React Query + Zustand + Tailwind + Radix UI (puerto 3000)
- **Docker**: 8 containers (postgres, redis, meilisearch, minio, backend, frontend)
- **Directorio raíz**: `c:\Users\RYZEN 7\Desktop\notion-clone`

### Credenciales de prueba
```
Email: admin@notion.local
Password: admin123
```

### Comandos Docker
```bash
# turbo
docker-compose up -d --build     # Rebuild y deploy completo

# turbo
docker-compose up -d --build backend   # Solo backend

# turbo
docker-compose up -d --build frontend  # Solo frontend

# turbo
docker-compose logs backend -f   # Ver logs backend

# turbo
docker-compose logs frontend -f  # Ver logs frontend
```

---

## Estado Actual - Rounds Completados

| Round | Descripción | Estado |
|-------|-------------|--------|
| R1-R60 | Auth, Workspaces, Pages, Blocks, Database, Property Types | ✅ COMPLETADO |
| R61-R70 | Relations & Rollups | ⏳ SIGUIENTE |
| R71-R80 | Formulas | ⏳ Pendiente |
| R81-R90 | Filtros & Sorts | ⏳ Pendiente |
| R91-R100 | Board/Calendar Views | ⏳ Pendiente |

---

## Archivos Clave Existentes

### Backend
| Archivo | Propósito |
|---------|-----------|
| `backend/src/modules/databases/` | CRUD de databases |
| `backend/src/modules/database-properties/` | Propiedades (columnas) |
| `backend/src/modules/database-rows/` | Filas (Pages con parentDatabaseId) |
| `backend/src/modules/database-property-values/` | Valores de celdas |
| `backend/src/modules/database-views/` | Vistas (entity existe, falta implementar) |
| `backend/src/modules/database-relations/` | Relaciones (entity existe, falta implementar) |

### Frontend
| Archivo | Propósito |
|---------|-----------|
| `frontend/src/components/database/TableView.tsx` | Vista de tabla |
| `frontend/src/components/database/PropertyCell.tsx` | Router de celdas |
| `frontend/src/components/database/cells/` | Componentes por tipo |
| `frontend/src/hooks/useDatabases.ts` | CRUD hooks |
| `frontend/src/hooks/useDatabaseProperties.ts` | Hook propiedades |
| `frontend/src/hooks/useDatabaseRows.ts` | Hook filas |

---

## Patrones Establecidos (CRÍTICO)

### ✅ Correcto
```typescript
// Token de auth
localStorage.getItem('access_token')

// UUID nativo
crypto.randomUUID()

// Backend response
return { ...row, propertyValues: values }

// workspaceId en componentes anidados
<PersonCell workspaceId={workspaceId} ... />
```

### ❌ Incorrecto - EVITAR
```typescript
// NO usar
localStorage.getItem('token')  // Causa 401

// NO usar
import { v4 as uuidv4 } from 'uuid'  // No resuelve en Docker

// NO retornar
return { ...row, values: values }  // Frontend espera propertyValues

// NO usar en componentes anidados
const { id } = useParams()  // Puede ser undefined
```

---

## TAREA ACTUAL: R61-R70 Relations & Rollups

### Objetivo
Implementar propiedades RELATION y ROLLUP para conectar databases.

### Especificación

#### RELATION Property
- Vincula filas de una database con filas de otra
- Valor: `string[]` (array de rowIds)
- Config: `{ relatedDatabaseId: string, isBidirectional: boolean }`
- UI: Dropdown con títulos de filas de la database relacionada

#### ROLLUP Property
- Calcula agregaciones sobre propiedades de filas relacionadas
- Config: `{ relationPropertyId: string, targetPropertyId: string, aggregation: 'count'|'sum'|'avg'|'min'|'max' }`
- UI: Read-only, muestra valor calculado

### Archivos a Modificar

**Backend:**
1. `database-properties.entity.ts` - Agregar tipos 'relation', 'rollup'
2. `database-relations.service.ts` - Lógica de relaciones
3. `database-rows.service.ts` - Incluir relaciones en respuesta

**Frontend:**
4. `cells/RelationCell.tsx` - Selector de filas relacionadas
5. `cells/RollupCell.tsx` - Display de agregación
6. `PropertyCell.tsx` - Agregar casos relation/rollup
7. `PropertyConfigModal.tsx` - Config de relaciones

### Orden de Implementación
1. Backend: Entidades y DTOs
2. Backend: Endpoints y servicios
3. Frontend: Hooks
4. Frontend: Componentes UI
5. Verificación: Docker rebuild + tests

---

## Instrucciones de Testing

### 1. Tests de API con PowerShell

```powershell
# Login y obtener token
$login = Invoke-RestMethod -Uri "http://localhost:4000/auth/login" -Method Post -Body '{"email":"admin@notion.local","password":"admin123"}' -ContentType "application/json"
$token = $login.access_token
$headers = @{ Authorization = "Bearer $token"; "Content-Type" = "application/json" }

# Obtener workspace
$ws = (Invoke-RestMethod -Uri "http://localhost:4000/workspaces" -Headers $headers)[0]
Write-Host "Workspace: $($ws.id)"

# Listar databases
$pages = Invoke-RestMethod -Uri "http://localhost:4000/pages?workspaceId=$($ws.id)" -Headers $headers
$dbs = $pages | Where-Object { $_.type -eq 'database' }
$dbs | ForEach-Object { Write-Host "DB: $($_.title) - $($_.id)" }

# Crear database
$body = @{workspaceId=$ws.id; title="Test DB"; icon="📊"} | ConvertTo-Json
$db = Invoke-RestMethod -Uri "http://localhost:4000/databases" -Method Post -Headers $headers -Body $body

# Crear propiedad
$propBody = @{name="Status"; type="select"; config=@{options=@()}} | ConvertTo-Json -Depth 5
Invoke-RestMethod -Uri "http://localhost:4000/databases/$($db.id)/properties" -Method Post -Headers $headers -Body $propBody

# Crear fila
$rowBody = @{title="Row 1"} | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:4000/databases/$($db.id)/rows" -Method Post -Headers $headers -Body $rowBody

# Verificar datos
Invoke-RestMethod -Uri "http://localhost:4000/databases/$($db.id)" -Headers $headers
```

### 2. Test de Frontend (Manual)

```markdown
1. Abrir http://localhost:3000
2. Login con admin@notion.local / admin123
3. Navegar a una database existente
4. Verificar que la tabla carga sin errores (F12 → Console)
5. Crear nueva propiedad → seleccionar tipo
6. Editar celdas → verificar que guardan
7. F5 → verificar persistencia
```

### 3. Verificación de Docker

```powershell
# Ver estado de containers
docker ps --format "table {{.Names}}\t{{.Status}}"

# Ver logs de errores
docker logs notion-clone-backend-1 2>&1 | Select-String "error" -Context 0,2
docker logs notion-clone-frontend-1 2>&1 | Select-String "error" -Context 0,2

# Verificar health endpoints
Invoke-WebRequest -Uri "http://localhost:4000/health" -UseBasicParsing
Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing
```

### 4. Criterios de Éxito para R61-R70

- [ ] Puedo crear propiedad "Relation" y seleccionar database destino
- [ ] Puedo vincular filas entre databases (aparece dropdown)
- [ ] Las relaciones bidireccionales muestran en ambas databases
- [ ] Puedo crear Rollup que cuenta/suma valores relacionados
- [ ] Rollup se actualiza automáticamente cuando cambian datos
- [ ] Los datos persisten después de F5
- [ ] No hay errores en Console del navegador

---

## Formato de Respuesta Esperado

1. **Mostrar plan** de implementación antes de codificar
2. **Pedir aprobación** para cambios significativos
3. **Implementar** archivo por archivo
4. **Verificar** con tests después de cada sección
5. **Notificar** cuando esté listo para testing manual
