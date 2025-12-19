# Prompt: Implementación del Motor Avanzado de Base de Datos

**Contexto:**
Estás actuando como un **Senior Backend Engineer** experto en arquitecturas NestJS y motores de cálculo. Estás trabajando en un clon de Notion existente. Actualmente, el sistema tiene entidades básicas (`Page`, `DatabaseProperty`, `DatabasePropertyValue`), pero carece de lógica de negocio profunda para propiedades computadas.

**Objetivo:**
Implementar el **"Cerebro" de la Base de Datos**: un motor capaz de evaluar Fórmulas complejas y Rollups recursivos, y asegurar que los datos se actualicen en cascada cuando sus dependencias cambian.

**Tech Stack:**
- **Backend:** NestJS, TypeORM, Postgres.
- **Frontend:** Next.js, React.
- **Librerías sugeridas:** `mathjs` o `hyperformula` para el backend; construir un parser AST personalizado si es necesario para sintaxis tipo Notion (`prop("Name")`).

## Requerimientos Técnicos

### 1. Servicio de Evaluación de Fórmulas (`FormulaService`)
Necesitamos un servicio en el backend que:
- Reciba una expresión de fórmula (string) y el contexto de la fila (propiedades).
- **Parsee** la expresión. Notion usa un estilo funcional (ej: `concat(prop("First"), " ", prop("Last"))`) o estilo Excel. Define qué sintaxis apoyaremos (se sugiere estilo JavaScript simplificado o Excel-like).
- **Evalúe** el resultado de manera segura (sandbox).
- Soporte tipos de retorno dinámicos: `string`, `number`, `boolean`, `date`.

### 2. Grafo de Dependencias (Dependency Graph)
El mayor reto es la **reactividad**.
- Si la propiedad "Precio" cambia, la fórmula "IVA" (Precio * 0.21) debe actualizarse automáticamente.
- Y si "Total" depende de "IVA", también debe actualizarse.
- **Tarea:** Implementar un sistema (posiblemente usando `Subscribers` de TypeORM o un servicio de orquestación) que detecte cambios en `DatabasePropertyValue`, identifique qué fórmulas dependen de ese valor, y re-calcule en orden topológico.

### 3. Rollups Avanzados
- Implementar la lógica para agregar valores de relaciones.
- Soportar operaciones: `count`, `sum`, `average`, `min`, `max`, `show_original`.
- El Rollup debe ser capaz de "mirar" a través de una relación y traer los valores de la otra tabla.

### 4. API & Persistencia
- Actualizar `database-property-value.entity.ts` para no solo guardar el valor "crudo", sino quizás cachear el resultado calculado para evitar re-calcular en cada lectura (read-heavy optimization).
- Crear endpoints para validar fórmulas desde el frontend (check syntax errors).

### 5. Frontend: Editor de Fórmulas
- Crear un componente `FormulaInput` que ofrezca autocompletado de propiedades existentes.
- Resaltado de sintaxis básico.

## Pasos de Ejecución Sugeridos para la IA
1.  **Investigación**: Elegir la librería de math/parser.
2.  **Backend - Core**: Crear `FormulaService` con tests unitarios para lógica pura (sin tocar DB aún).
3.  **Backend - Integration**: Integrar con `DatabasePropertyValue` usando Subscribers para triggering automático.
4.  **Backend - Rollups**: Implementar la agregación a través de relaciones.
5.  **Frontend**: UI para escribir la fórmula.

---
**Instrucción Final:**
Por favor, comienza analizando las entidades actuales en `backend/src/modules/database-properties` y propón el plan de implementación detallado para la **Fase 1: Motor de Fórmulas**.
