/**
 * MUSICAPP - SCRIPTS PRINCIPALES ELEVADOS
 * Controlador del Calendario Dinámico Mensual, Reproductor de Audio y Filtros de Repertorio
 */

// =========================================================
// 1. CONTROLADOR DEL REPRODUCTOR DE AUDIO GLOBAL
// =========================================================
const MusicPlayer = (function () {
  let audioElement = new Audio();
  let currentTrack = null;
  let isPlaying = false;
  let synthAudioCtx = null;
  let synthInterval = null;

  let playerContainer = null;
  let playerTitle = null;
  let playerArtist = null;
  let playerPlayBtn = null;
  let playerProgress = null;
  let playerCurrentTime = null;
  let playerDuration = null;
  let playerVolume = null;

  function init() {
    playerContainer = document.getElementById('global-audio-player');
    if (!playerContainer) return;

    playerTitle = document.getElementById('player-song-title');
    playerArtist = document.getElementById('player-song-artist');
    playerPlayBtn = document.getElementById('player-play-btn');
    playerProgress = document.getElementById('player-progress');
    playerCurrentTime = document.getElementById('player-time-current');
    playerDuration = document.getElementById('player-time-total');
    playerVolume = document.getElementById('player-volume');

    audioElement.addEventListener('timeupdate', updateProgress);
    audioElement.addEventListener('loadedmetadata', onMetadataLoaded);
    audioElement.addEventListener('ended', onTrackEnded);

    if (playerPlayBtn) playerPlayBtn.addEventListener('click', togglePlay);
    if (playerProgress) playerProgress.addEventListener('input', seekAudio);
    if (playerVolume) playerVolume.addEventListener('input', setVolume);

    audioElement.volume = 0.85;

    bindPlayButtons();
  }

  function bindPlayButtons() {
    document.querySelectorAll('.btn-play-trigger').forEach((btn) => {
      btn.onclick = function (e) {
        e.preventDefault();
        e.stopPropagation();
        const songId = this.dataset.songId;
        const songTitle = this.dataset.songTitle || 'Canción';
        const songArtist = this.dataset.songArtist || 'Artista';
        const audioUrl = this.dataset.audioUrl || '';
        const duration = this.dataset.duration || '03:45';

        playSong({
          id: songId,
          title: songTitle,
          artist: songArtist,
          url: audioUrl,
          durationStr: duration,
        });
      };
    });
  }

  function playSong(track) {
    currentTrack = track;
    stopSynth();

    if (playerTitle) playerTitle.textContent = track.title;
    if (playerArtist) playerArtist.textContent = track.artist;
    if (playerDuration) playerDuration.textContent = track.durationStr;
    if (playerContainer) playerContainer.classList.add('active');

    document.querySelectorAll('.song-card-elevated, .song-row-card').forEach((card) => {
      card.classList.remove('is-playing');
    });
    const activeCard = document.getElementById(`song-card-${track.id}`);
    if (activeCard) activeCard.classList.add('is-playing');

    if (playerPlayBtn) {
      playerPlayBtn.innerHTML = '<i class="bi bi-pause-fill"></i>';
    }

    if (track.url && track.url.trim() !== '') {
      audioElement.src = track.url;
      audioElement
        .play()
        .then(() => {
          isPlaying = true;
        })
        .catch((err) => {
          console.warn('Reproduciendo melodía sintetizada de prueba:', err);
          playDemoSynth(track);
        });
    } else {
      playDemoSynth(track);
    }
  }

  function togglePlay() {
    if (!currentTrack) return;

    if (isPlaying) {
      if (audioElement.src) audioElement.pause();
      stopSynth();
      isPlaying = false;
      if (playerPlayBtn) playerPlayBtn.innerHTML = '<i class="bi bi-play-fill"></i>';
    } else {
      if (audioElement.src && !synthInterval) {
        audioElement.play();
      } else {
        playDemoSynth(currentTrack);
      }
      isPlaying = true;
      if (playerPlayBtn) playerPlayBtn.innerHTML = '<i class="bi bi-pause-fill"></i>';
    }
  }

  function updateProgress() {
    if (!audioElement.duration) return;
    const current = audioElement.currentTime;
    const total = audioElement.duration;
    const percent = (current / total) * 100;

    if (playerProgress) playerProgress.value = percent;
    if (playerCurrentTime) playerCurrentTime.textContent = formatTime(current);
  }

  function onMetadataLoaded() {
    if (playerDuration) playerDuration.textContent = formatTime(audioElement.duration);
  }

  function seekAudio() {
    if (!audioElement.duration) return;
    const seekTime = (playerProgress.value / 100) * audioElement.duration;
    audioElement.currentTime = seekTime;
  }

  function setVolume(e) {
    const vol = parseFloat(e.target.value);
    audioElement.volume = vol;
    const volIcon = document.getElementById('player-vol-icon');
    if (volIcon) {
      if (vol === 0) volIcon.className = 'bi bi-volume-mute-fill text-muted fs-6';
      else if (vol < 0.5) volIcon.className = 'bi bi-volume-down-fill text-muted fs-6';
      else volIcon.className = 'bi bi-volume-up-fill text-muted fs-6';
    }
  }

  function onTrackEnded() {
    isPlaying = false;
    if (playerPlayBtn) playerPlayBtn.innerHTML = '<i class="bi bi-play-fill"></i>';
    if (playerProgress) playerProgress.value = 0;
    if (playerCurrentTime) playerCurrentTime.textContent = '00:00';
  }

  function formatTime(seconds) {
    if (isNaN(seconds)) return '00:00';
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min < 10 ? '0' : ''}${min}:${sec < 10 ? '0' : ''}${sec}`;
  }

  function playDemoSynth(track) {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!synthAudioCtx) synthAudioCtx = new AudioCtx();

      const chords = [
        [261.63, 329.63, 392.0], // Do Mayor
        [220.0, 261.63, 329.63], // La menor
        [174.61, 220.0, 261.63], // Fa Mayor
        [196.0, 246.94, 293.66], // Sol Mayor
      ];
      let step = 0;
      let mockSeconds = 0;

      function playChord(freqs) {
        if (!synthAudioCtx) return;
        freqs.forEach((freq) => {
          const osc = synthAudioCtx.createOscillator();
          const gain = synthAudioCtx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, synthAudioCtx.currentTime);
          gain.gain.setValueAtTime(0.04, synthAudioCtx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, synthAudioCtx.currentTime + 1.8);
          osc.connect(gain);
          gain.connect(synthAudioCtx.destination);
          osc.start();
          osc.stop(synthAudioCtx.currentTime + 1.8);
        });
      }

      playChord(chords[0]);
      synthInterval = setInterval(() => {
        step = (step + 1) % chords.length;
        playChord(chords[step]);
        mockSeconds += 2;
        if (playerCurrentTime) playerCurrentTime.textContent = formatTime(mockSeconds);
        if (playerProgress) playerProgress.value = (mockSeconds % 60) * 1.66;
      }, 2000);

      isPlaying = true;
    } catch (e) {
      console.warn('Web Audio no soportado:', e);
    }
  }

  function stopSynth() {
    if (synthInterval) {
      clearInterval(synthInterval);
      synthInterval = null;
    }
  }

  return {
    init: init,
    playSong: playSong,
    togglePlay: togglePlay,
    bindPlayButtons: bindPlayButtons,
  };
})();

// =========================================================
// 2. CALENDARIO DINÁMICO MEJORADO (CON NAVEGACIÓN Y EVENTOS)
// =========================================================
const CalendarApp = (function () {
  let currentYear = 2026;
  let currentMonth = 9; // Octubre (0-indexed: 9)
  let selectedDate = '2026-10-15'; // 15 de Octubre 2026 por defecto como en el modelo
  let eventsData = [];

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  function init() {
    const calendarGrid = document.getElementById('calendar-month-grid');
    if (!calendarGrid) return;

    // Cargar eventos serializados de Django
    const dataTag = document.getElementById('calendar-events-data');
    if (dataTag) {
      try {
        eventsData = JSON.parse(dataTag.textContent.trim()) || [];
      } catch (e) {
        console.warn('Error leyendo calendar-events-data:', e);
      }
    }

    // Botones de navegación de mes
    const monthPrevBtn = document.getElementById('cal-month-prev');
    const monthNextBtn = document.getElementById('cal-month-next');
    const todayBtn = document.getElementById('cal-btn-today');

    if (monthPrevBtn) {
      monthPrevBtn.addEventListener('click', () => changeMonth(-1));
    }
    if (monthNextBtn) {
      monthNextBtn.addEventListener('click', () => changeMonth(1));
    }
    if (todayBtn) {
      todayBtn.addEventListener('click', goToToday);
    }

    // Botones de día anterior y siguiente en la cabecera derecha
    const prevDayBtn = document.getElementById('cal-prev-day-btn');
    const nextDayBtn = document.getElementById('cal-next-day-btn');

    if (prevDayBtn) {
      prevDayBtn.addEventListener('click', () => changeDay(-1));
    }
    if (nextDayBtn) {
      nextDayBtn.addEventListener('click', () => changeDay(1));
    }

    // Render inicial
    renderMonth(currentYear, currentMonth);
    selectDay(selectedDate);
  }

  function renderMonth(year, month) {
    const gridEl = document.getElementById('calendar-month-grid');
    const monthTitleEl = document.getElementById('cal-month-title');
    if (!gridEl) return;
    gridEl.innerHTML = '';

    if (monthTitleEl) {
      monthTitleEl.textContent = `${monthNames[month]} ${year}`;
    }

    // Calcular día de inicio de semana (0=Lun ... 6=Dom)
    const firstDayDate = new Date(year, month, 1);
    let startDayOfWeek = firstDayDate.getDay();
    startDayOfWeek = (startDayOfWeek + 6) % 7;

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();

    // Días del mes anterior (relleno tenue)
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const fillerCell = document.createElement('div');
      fillerCell.className = 'cal-day-cell is-filler';
      fillerCell.innerHTML = `<span class="cal-day-num">${prevMonthDays - i}</span>`;
      gridEl.appendChild(fillerCell);
    }

    // Días reales del mes actual
    const todayStr = new Date().toISOString().split('T')[0];

    for (let day = 1; day <= daysInMonth; day++) {
      const dayCell = document.createElement('div');
      dayCell.className = 'cal-day-cell';
      dayCell.dataset.day = day;

      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      dayCell.dataset.date = dateStr;

      // Eventos en este día
      const dayEvents = eventsData.filter((ev) => ev.fecha === dateStr);
      const hasEvents = dayEvents.length > 0;
      if (hasEvents) {
        dayCell.classList.add('has-event');
        const titulos = dayEvents.map((e) => e.titulo || e.song_title).join(' | ');
        dayCell.title = `${dayEvents.length} actividad(es) programada(s): ${titulos}`;
      }

      // Si es hoy
      if (dateStr === todayStr) {
        dayCell.classList.add('is-today');
      }

      // Si es la fecha seleccionada
      if (dateStr === selectedDate) {
        dayCell.classList.add('is-selected');
      }

      // Estructura interna con icono distintivo si hay evento
      dayCell.innerHTML = `
        <span class="cal-day-num">${day}</span>
        ${
          hasEvents
            ? `<span class="cal-event-icon-badge" title="Ensayo / Canción programada">
                <i class="bi bi-music-note-beamed"></i>
               </span>`
            : ''
        }
      `;

      dayCell.addEventListener('click', function () {
        selectDay(dateStr);
      });

      gridEl.appendChild(dayCell);
    }

    // Completar filas para mantener 35 o 42 celdas simétricas
    const totalRendered = startDayOfWeek + daysInMonth;
    const remaining = totalRendered % 7 === 0 ? 0 : 7 - (totalRendered % 7);
    for (let d = 1; d <= remaining; d++) {
      const nextFiller = document.createElement('div');
      nextFiller.className = 'cal-day-cell is-filler';
      nextFiller.innerHTML = `<span class="cal-day-num">${d}</span>`;
      gridEl.appendChild(nextFiller);
    }
  }

  function selectDay(dateStr) {
    selectedDate = dateStr;

    // Actualizar clase visual en celdas
    document.querySelectorAll('.cal-day-cell').forEach((cell) => {
      if (cell.dataset.date === dateStr) {
        cell.classList.add('is-selected');
      } else {
        cell.classList.remove('is-selected');
      }
    });

    const [y, m, d] = dateStr.split('-').map(Number);
    const displayDateEl = document.getElementById('cal-display-date');
    if (displayDateEl) {
      displayDateEl.textContent = `${d} de ${monthNames[m - 1]} ${y}`;
    }

    const modalDateInput = document.getElementById('schedule-event-date');
    if (modalDateInput) {
      modalDateInput.value = dateStr;
    }

    // Filtrar canciones y eventos del día
    const dayEvents = eventsData.filter((ev) => ev.fecha === dateStr);
    const eventTagEl = document.getElementById('cal-display-event-title');
    const songsContainer = document.getElementById('cal-day-songs-container');

    if (songsContainer) {
      songsContainer.innerHTML = '';

      if (dayEvents.length > 0) {
        if (eventTagEl) {
          eventTagEl.innerHTML = `
            <i class="bi bi-clock-fill"></i>
            <span>${dayEvents[0].titulo || 'Ensayo General - 20:00 PM'}</span>
          `;
        }

        dayEvents.forEach((ev) => {
          const pill = document.createElement('button');
          pill.type = 'button';
          pill.className = 'calendar-song-pill';
          pill.title = 'Reproducir pista de audio';

          pill.innerHTML = `
            <div class="d-flex align-items-center gap-2 text-truncate">
              <i class="bi bi-music-note-beamed fs-5"></i>
              <div class="text-truncate text-start">
                <span class="d-block fw-bold text-truncate">${ev.song_title}</span>
                <small class="opacity-75" style="font-size: 0.75rem;">${ev.song_artist || 'Artista'}</small>
              </div>
            </div>
            <div class="pill-arrow-circle">
              <i class="bi bi-play-fill fs-6"></i>
            </div>
          `;

          pill.onclick = function () {
            MusicPlayer.playSong({
              id: ev.song_id,
              title: ev.song_title,
              artist: ev.song_artist,
              url: ev.audio_url,
              durationStr: ev.duration,
            });
            if (ev.pdf_url) {
              openPdfModal(ev.song_title, ev.song_artist, ev.pdf_url);
            }
          };

          songsContainer.appendChild(pill);
        });
      } else {
        if (eventTagEl) {
          eventTagEl.innerHTML = `
            <i class="bi bi-calendar3"></i>
            <span>Sin ensayos programados</span>
          `;
        }

        const emptyMsg = document.createElement('div');
        emptyMsg.className = 'calendar-empty-state';
        emptyMsg.innerHTML = `
          <i class="bi bi-calendar4-week fs-1 text-muted d-block mb-2 opacity-50"></i>
          <h6 class="fw-bold text-dark mb-1">Sin temas asignados</h6>
          <p class="text-muted small mb-0">No hay canciones programadas para esta fecha.</p>
        `;
        songsContainer.appendChild(emptyMsg);
      }
    }
  }

  function changeMonth(delta) {
    currentMonth += delta;
    if (currentMonth < 0) {
      currentMonth = 11;
      currentYear -= 1;
    } else if (currentMonth > 11) {
      currentMonth = 0;
      currentYear += 1;
    }

    renderMonth(currentYear, currentMonth);

    // Ajustar día seleccionado al primer día del nuevo mes
    const newDateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-01`;
    selectDay(newDateStr);
  }

  function changeDay(delta) {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const currentDate = new Date(y, m - 1, d);
    currentDate.setDate(currentDate.getDate() + delta);

    const newYear = currentDate.getFullYear();
    const newMonth = currentDate.getMonth();
    const newDay = currentDate.getDate();

    const newDateStr = `${newYear}-${String(newMonth + 1).padStart(2, '0')}-${String(newDay).padStart(2, '0')}`;

    if (newYear !== currentYear || newMonth !== currentMonth) {
      currentYear = newYear;
      currentMonth = newMonth;
      renderMonth(currentYear, currentMonth);
    }

    selectDay(newDateStr);
  }

  function goToToday() {
    const now = new Date();
    currentYear = now.getFullYear();
    currentMonth = now.getMonth();
    const dateStr = now.toISOString().split('T')[0];

    renderMonth(currentYear, currentMonth);
    selectDay(dateStr);
  }

  return {
    init: init,
    selectDay: selectDay,
  };
})();

// =========================================================
// 3. MODAL DE LETRAS / PARTITURAS EN PDF
// =========================================================
function openPdfModal(title, artist, pdfUrl) {
  const modalEl = document.getElementById('pdfViewerModal');
  if (!modalEl) return;

  const titleEl = document.getElementById('pdfModalTitle');
  const artistEl = document.getElementById('pdfModalArtist');
  const frameEl = document.getElementById('pdfModalFrame');
  const downloadBtn = document.getElementById('pdfModalDownload');
  const newTabBtn = document.getElementById('pdfModalNewTab');
  const noPdfAlert = document.getElementById('pdfModalEmpty');

  if (titleEl) titleEl.textContent = title;
  if (artistEl) artistEl.textContent = artist;

  if (pdfUrl && pdfUrl.trim() !== '') {
    if (frameEl) {
      frameEl.src = pdfUrl;
      frameEl.style.display = 'block';
    }
    if (downloadBtn) {
      downloadBtn.href = pdfUrl;
      downloadBtn.style.display = 'inline-flex';
    }
    if (newTabBtn) {
      newTabBtn.href = pdfUrl;
      newTabBtn.style.display = 'inline-flex';
    }
    if (noPdfAlert) noPdfAlert.style.display = 'none';
  } else {
    if (frameEl) {
      frameEl.src = '';
      frameEl.style.display = 'none';
    }
    if (downloadBtn) downloadBtn.style.display = 'none';
    if (newTabBtn) newTabBtn.style.display = 'none';
    if (noPdfAlert) noPdfAlert.style.display = 'block';
  }

  const bsModal = new bootstrap.Modal(modalEl);
  bsModal.show();
}

// =========================================================
// 4. MODAL DE EDICIÓN RÁPIDA DE CANCIÓN
// =========================================================
function openEditSongModal(id, title, artist, duration, isActive, tagIds) {
  const modalEl = document.getElementById('editSongModal');
  if (!modalEl) return;

  const formEl = document.getElementById('editSongForm');
  if (formEl) {
    formEl.action = `/cancion/${id}/editar/`;
  }

  const titleInput = document.getElementById('edit-song-title');
  const artistInput = document.getElementById('edit-song-artist');
  const durationInput = document.getElementById('edit-song-duration');
  const activeInput = document.getElementById('editIsActiveCheck');

  if (titleInput) titleInput.value = title;
  if (artistInput) artistInput.value = artist;
  if (durationInput) durationInput.value = duration || '';
  if (activeInput) activeInput.checked = (isActive !== undefined && isActive !== null) ? Boolean(isActive) : true;

  // Reset all edit tag checkboxes, then check the assigned ones
  document.querySelectorAll('input[name="tags"].edit-tag-check').forEach((input) => {
    input.checked = false;
  });
  if (tagIds && Array.isArray(tagIds)) {
    tagIds.forEach((tId) => {
      const tagCheck = document.getElementById(`edit-tag-${tId}`);
      if (tagCheck) tagCheck.checked = true;
    });
  }

  const bsModal = new bootstrap.Modal(modalEl);
  bsModal.show();
}


// =========================================================
// 5. INICIALIZACIÓN GLOBAL AL CARGAR EL DOM
// =========================================================
document.addEventListener('DOMContentLoaded', function () {
  MusicPlayer.init();
  CalendarApp.init();

  // Control del botón de ordenamiento A-Z
  const sortBtn = document.getElementById('btn-toggle-az');
  const sortInput = document.getElementById('sort-order-input');
  const sortForm = document.getElementById('searchSortForm');

  if (sortBtn && sortInput && sortForm) {
    sortBtn.addEventListener('click', function () {
      const currentOrder = sortInput.value;
      if (currentOrder === 'a-z' || currentOrder === '') {
        sortInput.value = 'z-a';
      } else {
        sortInput.value = 'a-z';
      }
      sortForm.submit();
    });
  }

  // Atajo de teclado: Ctrl + K enfoca el buscador de canciones
  document.addEventListener('keydown', function (e) {
    if ((e.ctrlKey && e.key.toLowerCase() === 'k') || (e.key === '/' && document.activeElement.tagName !== 'INPUT')) {
      const searchInput = document.getElementById('search-input-canciones');
      if (searchInput) {
        e.preventDefault();
        searchInput.focus();
        searchInput.select();
      }
    }
  });
});
