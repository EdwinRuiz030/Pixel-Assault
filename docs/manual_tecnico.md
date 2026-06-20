# Manual Técnico - El legado del rey

Este documento describe la arquitectura técnica, la lógica de programación y la estructura de componentes del juego **El legado del rey**.

## 1. Arquitectura General
El legado del rey está construido como una aplicación web de una sola página (SPA) utilizando **JavaScript Vanilla** (ES6+) con un enfoque basado en módulos. El renderizado se realiza mediante el elemento `<canvas>` de HTML5 utilizando un motor 2D personalizado.

### Tecnologías Utilizadas:
*   **HTML5/CSS3**: Estructura de la UI y efectos de estilo (Glassmorphism, animaciones CSS).
*   **JavaScript (ES6 Modules)**: Lógica central, gestión de estados y física.
*   **Three.js**: Utilizado principalmente para la gestión de fondos y elementos 3D proyectados en el menú.
*   **Canvas API**: Motor de renderizado principal para el gameplay.

## 2. Estructura de Archivos
*   `/index.html`: Punto de entrada que define los contenedores de las pantallas (Splash, Menú, Juego, Controles).
*   `/css/style.css`: Sistema de diseño, estilos medievales y animaciones.
*   `/js/main.js`: Orquestador principal. Gestiona el ciclo de vida de las pantallas y la inicialización de instancias de juego.
*   `/js/story.js`: Contiene la clase `StoryMode`, que encapsula toda la lógica del modo supervivencia (física, enemigos, coleccionables).
*   `/js/knight_controller.js`: Gestiona específicamente el estado de animación y los frames del personaje principal.
*   `/js/menu_intro.js`: Maneja la lógica visual y efectos del menú principal.
*   `/img/`: Directorio de activos visuales (Sprite sheets, fondos, iconos).
*   `/songs/`: Archivos de audio (música ambiente y efectos).

## 3. Lógica del Juego (`StoryMode`)

### Ciclo de Vida del Juego
El juego utiliza un `requestAnimationFrame` que ejecuta el método `gameLoop()`. Este ciclo se divide en:
1.  **Input Handling**: Captura de eventos de teclado y toques.
2.  **Update**: Cálculo de física, IA de enemigos y detección de colisiones.
3.  **Render**: Dibujado de capas (Fondo, Plataformas, Entidades, HUD).

### Sistema de Física
Utiliza una integración de Euler simple para el movimiento:
*   **Gravedad**: Constante aplicada al eje Y cuando las entidades no están en "suelo" (`isGrounded`).
*   **Fricción**: Reducción gradual de la velocidad horizontal para un movimiento más natural.
*   **Delta Time (dt)**: La física está normalizada a 60fps para asegurar consistencia en diferentes monitores.

### Detección de Colisiones (AABB)
Se utiliza el método de **Axis-Aligned Bounding Box**:
```javascript
checkCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}
```

## 4. Gestión de Sprites y Animaciones
El sistema utiliza hojas de sprites (sprite sheets) unificadas:
*   **Personaje principal**: Hoja de 7x7 frames (192x192px c/u).
*   **Estados**: `idle`, `walking`, `jumping`, `attacking`.
*   **Lógica**: Se calcula el frame actual basándose en un temporizador (`animationTimer`) y la configuración definida en `spriteConfig`.

## 5. Configuración y Extensibilidad
Los parámetros clave del juego se encuentran en el constructor de `StoryMode`:
*   `this.worldWidth`: Define la longitud total del nivel (actualmente 10,000px).
*   `this.difficultyMultiplier`: Escala el daño y vida de enemigos cada 60 segundos.
*   `this.platforms`: Generadas mediante el método `generatePlatforms()`, permitiendo diseñar niveles programáticamente.

## 6. Mantenimiento y Despliegue
Para desplegar el proyecto, basta con servir el directorio raíz mediante cualquier servidor web (como Apache vía XAMPP).
*   **Añadir enemigos**: Modificar `spawnEnemy()` y `updateEnemies()`.
*   **Añadir niveles**: Crear nuevos métodos de generación de plataformas o cargar datos desde un JSON.

---
*Manual técnico actualizado al 17 de Abril de 2026.*
