# Manual Técnico - El legado del rey

Este documento describe la arquitectura técnica, la lógica de programación y la estructura de componentes del juego **El legado del rey**.

## 1. Arquitectura General
El legado del rey está construido como una aplicación web de una sola página (SPA) utilizando **JavaScript Vanilla** (ES6+) con un enfoque basado en módulos. El renderizado se realiza mediante el elemento `<canvas>` de HTML5 utilizando un motor 2D personalizado.

### Tecnologías Utilizadas:
*   **HTML5/CSS3**: Estructura de la UI, efectos de estilo (Glassmorphism, animaciones CSS).
*   **JavaScript (ES6 Modules)**: Lógica central, gestión de estados y física.
*   **Three.js**: Utilizado para la gestión de fondos y elementos 3D del menú.
*   **Canvas API**: Motor de renderizado principal para el gameplay y filtros CRT retro.

## 2. Estructura de Archivos
*   `/index.html`: Punto de entrada que define los contenedores de las pantallas (Splash, Menú, Juego, Controles).
*   `/css/style.css`: Sistema de diseño, estilos medievales y animaciones.
*   `/js/main.js`: Orquestador principal. Gestiona el ciclo de vida de las pantallas y la inicialización de instancias de juego.
*   `/js/story.js`: Contiene la clase `StoryMode`, que encapsula toda la lógica del modo historia (física, enemigos, coleccionables).
*   `/js/supervivencia.js`: Contiene la clase `SupervivenciaGame`, que maneja el modo de juego de supervivencia contra el reloj.
*   `/js/knight_controller.js`: Entorno sandbox aislado para pruebas del caballero.
*   `/js/menu_intro.js`: Maneja la lógica visual y efectos del menú principal.
*   `/img/`: Directorio de activos visuales (Sprite sheets, fondos, iconos).
*   `/songs/` y `/audios/`: Archivos de audio (música ambiente en `.mp3` y efectos de sonido en `.ogg`).

## 3. Lógica del Juego y Físicas Avanzadas

### Ciclo de Vida del Juego
El juego utiliza un `requestAnimationFrame` que ejecuta el método `gameLoop()`. Este ciclo se divide en:
1.  **Input Handling**: Captura de eventos de teclado y toques.
2.  **Update**: Cálculo de física, IA de enemigos, control de estado y detección de colisiones.
3.  **Render**: Dibujado de capas (Fondo, Plataformas, Entidades, HUD).

### Detección de Colisiones (AABB)
Se utiliza el método de **Axis-Aligned Bounding Box**:
```javascript
checkCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height >= rect2.y;
}
```

### Cálculo de Distancia de Borde a Borde (Edge-to-Edge)
Para evitar que los enemigos gigantes (como el jefe) sufran problemas de rango por su ancho, calculamos la distancia real entre los bordes más cercanos de los hitboxes en lugar de medir desde la esquina superior izquierda:
```javascript
const horizontalGap = Math.max(0, Math.abs((player.x + player.width/2) - (enemy.x + enemy.width/2)) - (player.width + enemy.width)/2);
const verticalGap = Math.max(0, Math.abs((player.y + player.height/2) - (enemy.y + enemy.height/2)) - (player.height + enemy.height)/2);
const edgeDistance = Math.sqrt(horizontalGap * horizontalGap + verticalGap * verticalGap);
```

### IA de Combate y Rangos de Ataque
1. **Detención en rango**: El duende y el caballero no se superponen. El enemigo detiene su avance horizontal de inmediato cuando la distancia de separación (`edgeDistance`) es menor a su rango de ataque (35px para duendes comunes, 60px para el jefe).
2. **Caja de Ataque del Enemigo (`attackBox`)**: Al lanzar el golpe, el duende genera una caja de impacto temporal que se proyecta hacia adelante según su dirección visual (+45px para comunes, +70px para el jefe):
   ```javascript
   const attackBox = {
       x: enemy.facing === -1 ? enemy.x - rangeExtension : enemy.x,
       y: enemy.y,
       width: enemy.width + rangeExtension,
       height: enemy.height
   };
   ```
3. **Hitbox de Impacto del Enemigo (`enemyHitBox`)**: Como la flecha del jugador se dispara desde el pecho/ballesta (`player.y - 18`), volaría por encima de la hitbox física básica del enemigo (que es de 60px de alto). Creamos una hitbox extendida verticalmente 30px hacia arriba (`y: enemy.y - 30`, `height: enemy.height + 30`) exclusivamente para recibir flechas.

### Cooldowns e Inmunidad
* **Ciclo de Ataque Comprometido**: Cuando un duende ataca, está bloqueado en ese estado de animación hasta completar sus 3 frames, asegurando que no se cancele. Al terminar, entra en cooldown (1.5s comunes, 1.2s jefe) antes de poder volver a atacar.
* **Invincibilidad Visual (i-frames)**: Al recibir daño, el jugador se vuelve inmune por 1 segundo, parpadeando con opacidad (`globalAlpha = 0.3`) cada 75ms.

## 4. Renderizado y Gráficos

### Reordenamiento de Capas (Z-Index)
Para que los duendes y su mazo aparezcan al frente al golpear al caballero, el orden de dibujado secuencial en el canvas es:
1. **Fondo de Paralaje** (Cielo y horizontes infinitos).
2. **Elementos de Fondo** (Árboles).
3. **Coleccionables** (Gemas y Tokens).
4. **Jugador** (Caballero).
5. **Proyectiles** (Flechas).
6. **Enemigos** (Duendes, barras de vida, Jefe).
7. **Partículas y Efectos de Brillo**.

### Paralaje Infinito según Hora del Día
El sistema renderiza 3 capas de paralaje repetidas horizontalmente para simular profundidad infinita, adaptándose a `this.timeOfDay`:
* **sunset** -> Dibuja `tarde.png`
* **night** -> Dibuja `noche.png`
* **day** / default -> Dibuja `dia.png` (Con fallbacks a `castleGif` en Historia y `bosque.png` en Supervivencia).

## 5. Audio y Conversión
Los audios del juego han sido convertidos a formato de compresión Vorbis (`.ogg`) mediante un script integrado (`convert-audios.js` ejecutado vía `ffmpeg-static`) para acelerar la carga de la página y reducir el lag al reproducir efectos de sonido en bucle. Se ha integrado el sonido de activación medieval para las hogueras (`tono de fogata mejorado.ogg`) que se reproduce dinámicamente al encender cada checkpoint.

---
*Manual técnico actualizado al 6 de Julio de 2026.*
