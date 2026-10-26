/**
 * Tour interactivo guiado para MusicApp utilizando Driver.js
 * Recorre todos los módulos, botones de acción, calendario, repertorio y reproductor.
 */
document.addEventListener("DOMContentLoaded", function () {

    // 1. Lectura segura de datos de autenticación y rol inyectados por Django
    const isAuthElement = document.getElementById('user-auth-data') || document.getElementById('userAuthData');
    const isAdminElement = document.getElementById('user-admin-data') || document.getElementById('isAdmin');

    // Si no está autenticado, ocultamos el botón de tour y salimos
    if (!isAuthElement) {
        const btnTour = document.getElementById('btn-reabrir-tour');
        if (btnTour) btnTour.style.display = 'none';
        return;
    }

    let isAuth = false;
    let isAdmin = false;

    try {
        isAuth = JSON.parse(isAuthElement.textContent);
        if (isAdminElement) {
            isAdmin = JSON.parse(isAdminElement.textContent);
        }
    } catch (e) {
        console.warn("[Tour MusicApp] Error parseando datos de sesión:", e);
    }

    if (!isAuth) return;

    // 2. Función principal para inicializar y ejecutar el tour interactivo
    function iniciarTour(forzarReinicio = false) {
        // Verificar disponibilidad de Driver.js
        if (!window.driver || !window.driver.js || !window.driver.js.driver) {
            console.warn("[Tour MusicApp] Driver.js no está cargado.");
            return;
        }

        const driver = window.driver.js.driver;

        // Lista completa de pasos disponibles en MusicApp
        const todosLosPasos = [
            {
                element: '#nav-brand',
                popover: {
                    title: '🎵 ¡Bienvenido o Bienvenida!',
                    description: 'Esta plataforma esta designada para el ministerio de alabanza. Aqui podras encontrar las canciones con sus letras, acordes, pistas de audio y el calendario de servicios',
                    side: 'bottom',
                    align: 'start'
                }
            },
            {
                element: '#nav-inicio',
                popover: {
                    title: '📅 Módulo Inicio & Calendario',
                    description: 'Accede a la programación semanal y al calendario de fechas de ensayo y servicios.',
                    side: 'bottom',
                    align: 'center'
                }
            },
            {
                element: '#calendar-month-grid',
                popover: {
                    title: '🗓️ Planificador Mensual',
                    description: 'Haz clic en cualquier día para consultar las canciones y notas del ensayo programadas para esa fecha.',
                    side: 'right',
                    align: 'start'
                }
            },
            {
                element: '#cal-day-songs-container',
                popover: {
                    title: '🎶 Canciones del Día',
                    description: 'Muestra las canciones correspondientes al día seleccionado. ¡Puedes hacer clic sobre una canción para reproducirla inmediatamente!',
                    side: 'left',
                    align: 'center'
                }
            },
            {
                element: '#btn-schedule-event',
                popover: {
                    title: '➕ Programar en Calendario',
                    description: 'Asigna una canción del repertorio a una fecha específica con notas personalizadas (tonalidad, orden, etc.).',
                    side: 'top',
                    align: 'center'
                }
            },
            {
                element: '#nav-canciones',
                popover: {
                    title: '📂 Repertorio de Canciones',
                    description: 'Explora el catálogo completo de temas, partituras en PDF y pistas de audio para estudiar.',
                    side: 'bottom',
                    align: 'center'
                }
            },
            {
                element: '#search-input-canciones',
                popover: {
                    title: '🔍 Buscador Inteligente',
                    description: 'Encuentra canciones al instante buscando por título de la canción o por nombre del artista.',
                    side: 'bottom',
                    align: 'start'
                }
            },
            {
                element: '#filter-buttons-group',
                popover: {
                    title: '⚡ Filtros Rápidos',
                    description: 'Filtra rápidamente el catálogo para ver sólo temas que incluyan audio de referencia o archivos PDF.',
                    side: 'bottom',
                    align: 'center'
                }
            },
            {
                element: '#btn-toggle-az',
                popover: {
                    title: '🔤 Orden Alfabético',
                    description: 'Ordena todo el repertorio en orden ascendente (Az a Z) o descendente (Za a A) con un solo clic.',
                    side: 'bottom',
                    align: 'center'
                }
            },
            {
                element: '.song-card-elevated:first-child .btn-play-trigger',
                popover: {
                    title: '🎧 Reproducir Audio',
                    description: 'Haz clic en "Audios" para escuchar la grabación de referencia o ensayo en el reproductor integrado.',
                    side: 'left',
                    align: 'center'
                }
            },
            {
                element: '.song-card-elevated:first-child .btn-action-letra',
                popover: {
                    title: '📄 Letras y Partituras',
                    description: 'Abre el visor interactivo de documentos para estudiar la letra, cifrados o partituras en PDF.',
                    side: 'left',
                    align: 'center'
                }
            },
            {
                element: '#nav-subir',
                popover: {
                    title: isAdmin ? '☁️ Subir Canciones': '☁️ No tienes permiso para subir canciones',
                    description: isAdmin ? 'Sube nuevas canciones al repertorio junto con sus pistas de audio (MP3/WAV) y documentos PDF.' : 'Solo los usuarios con rol de administrador tienen permitido subir canciones al repertorio.',
                    side: 'bottom',
                    align: 'center'
                }
            },
            {
                element: '#global-audio-player',
                popover: {
                    title: '🔊 Reproductor Continuo',
                    description: 'Controla la reproducción, salta el tiempo y ajusta el volumen mientras navegas libremente por la aplicación.',
                    side: 'top',
                    align: 'center'
                }
            },
            {
                element: '#nav-user-menu',
                popover: {
                    title: isAdmin ? '👑 Perfil & Panel de Administración' : '👤 Mi Perfil y Roles',
                    description: isAdmin
                        ? 'Accede a la gestión de tu perfil, consulta permisos y entra directamente al Panel Django Admin para administrar el sistema.'
                        : 'Consulta tu rol actual en el sistema y los niveles de permiso asignados para canciones, audios y letras.',
                    side: 'bottom',
                    align: 'end'
                }
            },
            {
                element: '#btn-reabrir-tour',
                popover: {
                    title: '❓ ¿Tienes dudas?',
                    description: 'Puedes hacer clic en este botón en cualquier momento para reiniciar este recorrido guiado.',
                    side: 'bottom',
                    align: 'end'
                }
            }
        ];

        // Filtramos para ejecutar únicamente los pasos que existen físicamente en la página actual
        const pasosValidos = todosLosPasos.filter(paso => {
            const el = document.querySelector(paso.element);
            return el !== null && el.offsetParent !== null; // Que exista y sea visible
        });

        if (pasosValidos.length === 0) return;

        // Configuración y lanzamiento de Driver.js
        const tourDriver = driver({
            showProgress: true,
            progressText: '{{current}} de {{total}}',
            animate: true,
            allowClose: true,
            doneBtnText: '¡Entendido, listo!',
            nextBtnText: 'Siguiente →',
            prevBtnText: '← Anterior',
            steps: pasosValidos,
            onDestroyed: () => {
                // Marca el tour como completado en este navegador
                localStorage.setItem('tour_completado', 'true');
            }
        });

        if (forzarReinicio) {
            tourDriver.drive();
        } else {
            const tourVisto = localStorage.getItem('tour_completado');
            if (!tourVisto) {
                // Pequeño retardo para que la página renderice completamente antes de iniciar
                setTimeout(() => {
                    tourDriver.drive();
                }, 600);
            }
        }
    }

    // 3. Ejecución automática si es la primera vez del usuario
    iniciarTour(false);

    // 4. Botón de ayuda (?) para relanzar el tour cuando el usuario lo desee
    const btnReabrir = document.getElementById('btn-reabrir-tour');
    if (btnReabrir) {
        btnReabrir.addEventListener('click', function (e) {
            e.preventDefault();
            iniciarTour(true);
        });
    }

});