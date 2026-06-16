import { Game } from './game.js?v=3';
import { SupervivenciaGame } from './supervivencia.js?v=3';
import { StoryMode } from './story.js?v=3';

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

    // Botones e inputs de Ajustes
    const menuSettingsBtn = document.getElementById('menu-settings-btn');
    const settingsMenuScreen = document.getElementById('settings-menu');
    const settingsBackBtn = document.getElementById('settings-back-btn');
    const musicVolumeSlider = document.getElementById('music-volume-slider');
    const musicVolumeValue = document.getElementById('music-volume-value');
    const sfxVolumeSlider = document.getElementById('sfx-volume-slider');
    const sfxVolumeValue = document.getElementById('sfx-volume-value');
    const timeOfDaySelect = document.getElementById('time-of-day-select');
    const crtFilterToggle = document.getElementById('crt-filter-toggle');
    const crtOverlay = document.getElementById('crt-overlay');
    
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

    // Cargar y aplicar ajustes desde localStorage
    function loadSettings() {
        const musicVolume = localStorage.getItem('musicVolume') !== null ? parseFloat(localStorage.getItem('musicVolume')) : 0.5;
        const sfxVolume = localStorage.getItem('sfxVolume') !== null ? parseFloat(localStorage.getItem('sfxVolume')) : 0.5;
        const timeOfDay = localStorage.getItem('timeOfDay') || 'day';
        const crtFilter = localStorage.getItem('crtFilter') === 'true';

        // Aplicar a los controles UI
        musicVolumeSlider.value = musicVolume;
        musicVolumeValue.textContent = `${Math.round(musicVolume * 100)}%`;
        sfxVolumeSlider.value = sfxVolume;
        sfxVolumeValue.textContent = `${Math.round(sfxVolume * 100)}%`;
        timeOfDaySelect.value = timeOfDay;
        crtFilterToggle.checked = crtFilter;

        // Aplicar volumen de música
        menuMusic.volume = musicVolume;

        // Aplicar filtro CRT
        if (crtFilter) {
            crtOverlay.classList.remove('hidden');
        } else {
            crtOverlay.classList.add('hidden');
        }
    }
    
    let settingsOrigin = 'menu'; // 'menu' o 'pause'
    
    // Función para mostrar una pantalla específica
    function showScreen(screen) {
        // Ocultar todas las pantallas
        document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
        // Mostrar la pantalla solicitada
        document.getElementById(screen).classList.remove('hidden');
        
        // Manejar música según la pantalla
        if (screen === 'menu' || screen === 'controls' || screen === 'settings-menu') {
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
                // Obtener ajustes actuales
                const currentSettings = {
                    sfxVolume: parseFloat(sfxVolumeSlider.value),
                    timeOfDay: timeOfDaySelect.value
                };
                // Crear nueva instancia del modo historia
                storyMode = new StoryMode(currentSettings);
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
            // Obtener ajustes actuales
            const currentSettings = {
                sfxVolume: parseFloat(sfxVolumeSlider.value),
                timeOfDay: timeOfDaySelect.value
            };
            // Crear nueva instancia del juego
            supervivenciaGame = new SupervivenciaGame(currentSettings);
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
    
    // Manejadores de eventos
    startBtn.addEventListener('click', () => showScreen('game'));
    supervivenciaBtn.addEventListener('click', () => showScreen('supervivencia'));
    controlsBtn.addEventListener('click', () => showScreen('controls'));
    backToMenuBtn.addEventListener('click', () => showScreen('menu'));
    playAgainBtn.addEventListener('click', () => showScreen('game'));
    mainMenuBtn.addEventListener('click', () => showScreen('menu'));
    
    // Panel de Ajustes
    menuSettingsBtn.addEventListener('click', () => {
        settingsOrigin = 'menu';
        showScreen('settings-menu');
    });

    settingsBtn.addEventListener('click', () => {
        settingsOrigin = 'pause';
        pauseMenuScreen.classList.add('hidden');
        settingsMenuScreen.classList.remove('hidden');
    });

    settingsBackBtn.addEventListener('click', () => {
        if (settingsOrigin === 'pause') {
            // Regresar al juego y mostrar menú de pausa sin reiniciar partida
            settingsMenuScreen.classList.add('hidden');
            pauseMenuScreen.classList.remove('hidden');
        } else {
            showScreen('menu');
        }
    });

    // Controladores de los elementos de Ajustes
    musicVolumeSlider.addEventListener('input', (e) => {
        const vol = parseFloat(e.target.value);
        musicVolumeValue.textContent = `${Math.round(vol * 100)}%`;
        menuMusic.volume = vol;
        localStorage.setItem('musicVolume', vol);
    });

    sfxVolumeSlider.addEventListener('input', (e) => {
        const vol = parseFloat(e.target.value);
        sfxVolumeValue.textContent = `${Math.round(vol * 100)}%`;
        localStorage.setItem('sfxVolume', vol);
        
        // Actualizar efectos de sonido de juego en tiempo real
        if (storyMode) {
            storyMode.setSfxVolume(vol);
        }
        if (supervivenciaGame) {
            supervivenciaGame.setSfxVolume(vol);
        }
    });

    timeOfDaySelect.addEventListener('change', (e) => {
        const time = e.target.value;
        localStorage.setItem('timeOfDay', time);
        
        // Actualizar iluminación en tiempo real
        if (storyMode) {
            storyMode.setTimeOfDay(time);
        }
        if (supervivenciaGame) {
            supervivenciaGame.setTimeOfDay(time);
        }
    });

    crtFilterToggle.addEventListener('change', (e) => {
        const crt = e.target.checked;
        localStorage.setItem('crtFilter', crt);
        if (crt) {
            crtOverlay.classList.remove('hidden');
        } else {
            crtOverlay.classList.add('hidden');
        }
    });

    // Inicializar ajustes al cargar
    loadSettings();

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
    
    pauseMainMenuBtn.addEventListener('click', () => {
        if (storyMode) storyMode.stop();
        if (supervivenciaGame) supervivenciaGame.stop();
        pauseMenuScreen.classList.add('hidden');
        showScreen('menu');
    });
    
    // Intentar reproducir música en la primera interacción (respaldo)
    document.addEventListener('click', startMenuMusic, { once: true });
});
