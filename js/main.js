import { Game } from './game.js';
import { SupervivenciaGame } from './supervivencia.js';
import { StoryMode } from './story.js';

// Manejador de pantallas
document.addEventListener('DOMContentLoaded', () => {
    // Elementos del DOM
    const menuScreen = document.getElementById('menu');
    const gameScreen = document.getElementById('game');
    const supervivenciaScreen = document.getElementById('supervivencia');
    const controlsScreen = document.getElementById('controls');
    const gameOverScreen = document.getElementById('game-over');
    
    // Botones
    const startBtn = document.getElementById('start-btn');
    const supervivenciaBtn = document.getElementById('supervivencia-btn');
    const controlsBtn = document.getElementById('controls-btn');
    const backToMenuBtn = document.getElementById('back-to-menu');
    const playAgainBtn = document.getElementById('play-again');
    const mainMenuBtn = document.getElementById('main-menu');
    
    // Botones del menú de pausa
    const pauseMenuScreen = document.getElementById('pause-menu');
    const resumeBtn = document.getElementById('resume-btn');
    const settingsBtn = document.getElementById('settings-btn');
    const pauseMainMenuBtn = document.getElementById('pause-main-menu-btn');
    
    // Inicialización del juego
    let game;
    let supervivenciaGame;
    let storyMode;
    
    // Música del menú
    const menuMusic = new Audio('songs/Arrival_at_the_Citadel.mp3');
    menuMusic.loop = true;
    let musicStarted = false;

    // Función para intentar reproducir la música
    const startMenuMusic = () => {
        if (!musicStarted) {
            menuMusic.play()
                .then(() => {
                    musicStarted = true;
                })
                .catch(e => {
                    console.log('Autoplay bloqueado. Esperando interacción del usuario...');
                });
        }
    };
    
    // Función para mostrar una pantalla específica
    function showScreen(screen) {
        // Ocultar todas las pantallas
        document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
        // Mostrar la pantalla solicitada
        document.getElementById(screen).classList.remove('hidden');
        
        // Manejar música según la pantalla
        if (screen === 'menu' || screen === 'controls') {
            startMenuMusic();
        } else {
            menuMusic.pause();
            musicStarted = false; // Resetear para que pueda volver a sonar al regresar al menú
        }
        
        // Inicializar el juego cuando se muestra la pantalla de juego
        if (screen === 'game') {
            // Esperar un poco para asegurar que el DOM esté listo
            setTimeout(() => {
                // Si el juego ya existe, reiniciarlo
                if (game) {
                    game.stop();
                }
                if (storyMode) {
                    storyMode.stop();
                }
                // Crear nueva instancia del modo historia
                storyMode = new StoryMode();
                if (storyMode.canvas && storyMode.ctx) {
                    storyMode.start();
                }
            }, 100);
        }
        
        // Inicializar el juego Supervivencia cuando se muestra esa pantalla
        if (screen === 'supervivencia') {
            // Si el juego ya existe, reiniciarlo
            if (supervivenciaGame) {
                supervivenciaGame.stop();
            }
            // Crear nueva instancia del juego
            supervivenciaGame = new SupervivenciaGame();
            if (supervivenciaGame.canvas && supervivenciaGame.ctx) {
                supervivenciaGame.start();
            }
        }
    }
    
    // Lógica de la Pantalla de Inicio (Splash Screen)
    const splashScreen = document.getElementById('splash-screen');
    if (splashScreen) {
        splashScreen.addEventListener('click', () => {
            splashScreen.classList.add('fade-out');
            startMenuMusic();
            
            // Mostrar el menú principal después de la animación de fade-out
            setTimeout(() => {
                splashScreen.remove(); // Eliminar del DOM para limpiar
                showScreen('menu');
            }, 800);
        }, { once: true });
    }
    
    // Función para mostrar aviso de 'Próximamente'
    function showComingSoon() {
        // Crear el elemento si no existe
        let notice = document.querySelector('.coming-soon-notice');
        if (!notice) {
            notice = document.createElement('div');
            notice.className = 'coming-soon-notice';
            notice.innerHTML = `<div class="notice-content"><span>⚔️</span> PRÓXIMAMENTE <span>⚔️</span></div>`;
            document.body.appendChild(notice);
        }
        
        // Mostrar el aviso
        notice.classList.add('show');
        
        // Ocultar después de 3 segundos
        setTimeout(() => {
            notice.classList.remove('show');
        }, 3000);
    }
    
    // Manejadores de eventos
    startBtn.addEventListener('click', () => showScreen('game'));
    supervivenciaBtn.addEventListener('click', () => showScreen('supervivencia'));
    controlsBtn.addEventListener('click', () => showScreen('controls'));
    backToMenuBtn.addEventListener('click', () => showScreen('menu'));
    playAgainBtn.addEventListener('click', () => showScreen('game'));
    mainMenuBtn.addEventListener('click', () => showScreen('menu'));
    
    // Listeners del menú de pausa
    resumeBtn.addEventListener('click', () => {
        if (storyMode && storyMode.paused) {
            storyMode.paused = false;
        }
        if (supervivenciaGame && supervivenciaGame.paused) {
            supervivenciaGame.paused = false;
        }
        pauseMenuScreen.classList.add('hidden');
    });
    
    settingsBtn.addEventListener('click', () => {
        showComingSoon();
    });
    
    pauseMainMenuBtn.addEventListener('click', () => {
        if (storyMode) storyMode.stop();
        if (supervivenciaGame) supervivenciaGame.stop();
        pauseMenuScreen.classList.add('hidden');
        showScreen('menu');
    });
    
    // Intentar reproducir música en la primera interacción (respaldo)
    document.addEventListener('click', startMenuMusic, { once: true });
});
