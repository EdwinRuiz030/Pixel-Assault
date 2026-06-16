# Justificación del Proyecto: Pixel Assault

Este documento detalla la justificación técnica, práctica y social del desarrollo de **Pixel Assault**, un videojuego web híbrido en 2D/3D con temática medieval, enfocado en el alto rendimiento, la accesibilidad multiplataforma y el diseño de experiencia de usuario (UX/UI) de nivel premium.

---

## 1. Introducción

El panorama de los videojuegos independientes en la web ha evolucionado a un ritmo acelerado. Los jugadores ya no solo buscan mecánicas simples, sino experiencias visualmente ricas, inmersivas y con dinámicas de juego desafiantes que puedan ejecutarse de forma instantánea sin la necesidad de instalaciones complejas. 

**Pixel Assault** nace como una propuesta moderna que fusiona el encanto clásico de los juegos de plataformas y acción medievales con las tecnologías de vanguardia de la web abierta (HTML5 Canvas, Vanilla JavaScript modular y Three.js). Al operar directamente en el navegador, democratiza el acceso al entretenimiento digital interactivo de alta calidad.

---

## 2. Planteamiento del Problema

En el contexto actual del desarrollo de videojuegos basados en web, se identifican las siguientes problemáticas:

1. **Dependencia de Frameworks Pesados:** Muchos videojuegos web modernos se desarrollan utilizando motores sobredimensionados que requieren descargas masivas de bibliotecas y tiempos de carga prolongados. Esto reduce drásticamente la tasa de retención de usuarios casuales.
2. **Deficiente Adaptabilidad Móvil:** Gran parte de los juegos de navegador tradicionales están diseñados exclusivamente para ordenadores, ignorando la creciente base de usuarios de dispositivos móviles o proporcionando controles táctiles rudimentarios e incómodos.
3. **Mecánicas de Juego Monótonas y Pasivas:** Los juegos de supervivencia clásicos a menudo sufren del problema de "campeo" (donde el jugador permanece inmóvil en una zona segura), lo que disminuye el dinamismo, el reto y la diversión.
4. **Falta de Equilibrio Visual:** Existe una brecha entre los juegos rápidos desarrollados con Canvas 2D plano (que a menudo se sienten visualmente obsoletos) y los pesados entornos 3D que exigen tarjetas gráficas dedicadas.

---

## 3. Justificación del Proyecto

**Pixel Assault** se fundamenta sobre cuatro pilares esenciales que justifican plenamente su desarrollo y su arquitectura técnica:

### 3.1. Justificación Técnica: Rendimiento y Optimización Pura
El proyecto rechaza los motores preconstruidos masivos en favor de una arquitectura híbrida de código optimizado:
* **Física y Renderizado Ligero:** Utiliza el elemento `<canvas>` de HTML5 y un motor de renderizado 2D propio escrito en **Vanilla JavaScript (ES6 Modules)**. Esto garantiza tasas de refresco sólidas de **60 FPS** incluso en dispositivos de gama baja.
* **Integración Híbrida 3D (Three.js):** El uso de Three.js está limitado estratégicamente a elementos visuales de alto impacto (fondos y menús interactivos en 3D). Esto genera un efecto visual inmersivo premium ("efecto wow") sin penalizar el rendimiento del bucle principal del gameplay en 2D.
* **Consistencia de Física (Delta Time):** El cálculo físico utiliza una integración de Euler normalizada con Delta Time, evitando desincronizaciones en pantallas de alta frecuencia de actualización (90Hz, 120Hz, 144Hz).

### 3.2. Justificación Práctica: Innovación en Jugabilidad y UX
El juego introduce mecánicas dinámicas que renuevan la fórmula clásica de los plataformas de supervivencia:
* **Sistema Anti-Camping Dinámico:** Para combatir el sedentarismo en el gameplay, el motor monitoriza la posición del jugador. Si detecta inactividad posicional por más de 5 segundos, invoca hordas de enemigos directamente en su retaguardia, obligándolo a mantenerse en constante movimiento.
* **Control Dual y Adaptativo (Responsive Layout):** Detecta automáticamente pantallas táctiles para renderizar un HUD móvil intuitivo (joysticks y botones de ataque/salto medievales) manteniendo la compatibilidad nativa con teclado para computadoras.
* **Progresión de Dificultad Exponencial:** A través de un multiplicador de dificultad temporal, el daño, la velocidad y la frecuencia de aparición de los duendes escala cada 60 segundos, manteniendo un alto nivel de desafío constante.

### 3.3. Justificación Social y Accesibilidad
* **Cero Barreras de Entrada:** Al ser una aplicación web de una sola página (SPA), el usuario puede jugar al instante simplemente accediendo a una dirección web, sin registrarse, sin descargar instaladores y sin riesgo de malware.
* **Portabilidad Total:** Funciona de forma idéntica en Windows, macOS, Linux, iOS y Android, permitiendo que cualquier persona con un navegador web moderno disfrute de la experiencia.

### 3.4. Justificación Educativa y Extensibilidad
* **Arquitectura Limpia:** La base de código de Pixel Assault sirve como un modelo pedagógico de referencia para entender la lógica interna de un motor de física personalizado, animaciones por sprite sheets en cuadrícula (7x7), y la gestión modular de estados en JavaScript sin librerías externas.

---

## 4. Objetivos del Proyecto

### Objetivo General
Desarrollar e implementar un videojuego web híbrido en 2D/3D de plataformas y supervivencia medieval, optimizado para alto rendimiento, accesibilidad multiplataforma y diseño premium.

### Objetivos Específicos
1. **Desarrollar un motor de física y colisiones personalizado** basado en rectángulos alineados con los ejes (AABB) y normalizado mediante Delta Time.
2. **Diseñar una UI/UX inmersiva** con temática medieval utilizando efectos visuales modernos como Glassmorphism, animaciones CSS fluidas y tipografía responsiva.
3. **Implementar un sistema inteligente de control híbrido** que adapte automáticamente el juego a teclados o mandos táctiles responsivos en dispositivos móviles.
4. **Crear algoritmos de IA dinámicos** para enemigos (duendes), incluyendo persecución en plataformas, spawneo estratégico y mecanismos anti-camping.
5. **Optimizar el rendimiento gráfico** combinando la ligereza de Canvas 2D en el juego principal con la sofisticación visual de Three.js en la pantalla de bienvenida y menús.

---

## 5. Conclusión

**Pixel Assault** no es solo un videojuego; es un testimonio de la potencia actual de los estándares web abiertos. Logra resolver de manera elegante la brecha entre accesibilidad, fluidez técnica y riqueza visual. A través de este proyecto, se demuestra que con un diseño de software inteligente y modular, es posible crear experiencias de entretenimiento sumamente interactivas, seguras y de aspecto premium sin la sobrecarga tecnológica del software nativo convencional.
