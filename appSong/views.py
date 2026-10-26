import json
from django.urls import reverse_lazy
from django.views.generic import ListView, DetailView, CreateView, UpdateView, DeleteView, TemplateView
from django.contrib.auth.mixins import LoginRequiredMixin
from django.core.exceptions import PermissionDenied
from django.db.models import Q
from django.utils import timezone
from datetime import timedelta
from django.contrib import messages
from django.shortcuts import redirect
from .models import Song, CalendarEvent, Tag
from .forms import SongForm, CalendarEventForm



# =========================================================
# 1. MIXIN DE SEGURIDAD PERSONALIZADO (Para los Roles)
# =========================================================
class PermisoRolMixin:
    """
    Verifica que el usuario tenga el nivel requerido en su Rol.
    Nivel 1 = Sin Acceso / Bloqueado
    Nivel 2 = Sólo Lectura
    Nivel 3 = Lectura y Edición
    """
    nivel_requerido = 2  # Por defecto requiere al menos nivel de lectura
    modulo_a_evaluar = 'inventario'  # Módulo 'inventario' representa las Canciones

    def dispatch(self, request, *args, **kwargs):
        # 1. Verifica si inició sesión
        if not request.user.is_authenticated:
            return self.handle_no_permission()

        # 2. El Super Administrador (superuser) tiene acceso total nivel 3
        if request.user.is_superuser:
            return super().dispatch(request, *args, **kwargs)

        # 3. Verifica si el usuario tiene un rol asignado
        if not request.user.rol:
            messages.error(request, "No tienes un rol asignado en el sistema.")
            raise PermissionDenied("No tienes un rol asignado en el sistema.")

        # 4. Obtiene el nivel (1, 2 o 3) del módulo específico
        nivel_usuario = getattr(request.user.rol, self.modulo_a_evaluar, 1)

        # 5. Compara: Si el nivel del usuario es menor al requerido, bloquea
        if nivel_usuario < self.nivel_requerido:
            messages.error(request, "Acceso denegado: No posees permisos suficientes para esta sección.")
            raise PermissionDenied("No tienes permisos suficientes para realizar esta acción.")

        return super().dispatch(request, *args, **kwargs)


# =========================================================
# 2. MÓDULO DE INICIO (HOME & CALENDARIO SEMANAL)
# =========================================================
class HomeView(LoginRequiredMixin, PermisoRolMixin, TemplateView):
    template_name = 'home.html'
    nivel_requerido = 2  # Lectura de repertorio e inicio

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        hoy = timezone.localdate()
        inicio_semana = hoy - timedelta(days=hoy.weekday())  # Lunes de esta semana
        fin_semana = inicio_semana + timedelta(days=6)       # Domingo de esta semana

        # Eventos del calendario ordenados por fecha
        todos_eventos = CalendarEvent.objects.filter(es_activo=True).select_related('song').order_by('fecha')
        eventos_semana = todos_eventos.filter(fecha__range=[inicio_semana, fin_semana])

        # Métricas generales
        canciones_activas = Song.objects.filter(is_active=True)
        context['total_canciones'] = canciones_activas.count()
        context['canciones_con_audio'] = canciones_activas.exclude(audio='').exclude(audio__isnull=True).count()
        context['canciones_con_pdf'] = canciones_activas.exclude(file='').exclude(file__isnull=True).count()
        context['eventos_semana_count'] = eventos_semana.count()

        # Eventos para la vista
        context['eventos_semana'] = eventos_semana
        context['proximos_eventos'] = todos_eventos.filter(fecha__gte=hoy)[:8]
        context['ultimas_canciones'] = canciones_activas.order_by('-fecha_creacion')[:6]
        context['todas_canciones'] = canciones_activas.order_by('title')
        context['todos_eventos'] = todos_eventos
        context['hoy'] = hoy
        context['inicio_semana'] = inicio_semana
        context['fin_semana'] = fin_semana

        # Serialización de eventos para el calendario interactivo
        eventos_data = []
        for ev in todos_eventos:
            eventos_data.append({
                'id': ev.id,
                'fecha': ev.fecha.strftime('%Y-%m-%d'),
                'titulo': ev.titulo,
                'descripcion': ev.descripcion or '',
                'song_id': ev.song.id,
                'song_title': ev.song.title,
                'song_artist': ev.song.artist,
                'audio_url': ev.song.audio.url if ev.song.audio else '',
                'pdf_url': ev.song.file.url if ev.song.file else '',
                'duration': ev.song.formatted_duration or '03:45',
            })
        context['eventos_json'] = json.dumps(eventos_data)

        return context


# =========================================================
# 3. MÓDULO DE REPERTORIO (PLAYLIST & INVENTARIO)
# =========================================================
class SongListView(LoginRequiredMixin, PermisoRolMixin, ListView):
    model = Song
    template_name = 'playlist.html'
    context_object_name = 'songs'
    nivel_requerido = 2  # Nivel 2 o 3 para ver repertorio

    def get_queryset(self):
        queryset = Song.objects.filter(is_active=True).prefetch_related('tags')

        # 1. Búsqueda por Nombre de Canción o Artista
        query = self.request.GET.get('q', '').strip()
        if query:
            queryset = queryset.filter(
                Q(title__icontains=query) | Q(artist__icontains=query)
            )

        # 2. Filtrado por Etiqueta (Tag)
        tag_id = self.request.GET.get('tag')
        if tag_id and tag_id.isdigit():
            queryset = queryset.filter(tags__id=int(tag_id))

        # 3. Filtro rápido: sólo con Audio o sólo con Letra/PDF
        filtro_tipo = self.request.GET.get('filtro')
        if filtro_tipo == 'audio':
            queryset = queryset.exclude(audio='').exclude(audio__isnull=True)
        elif filtro_tipo == 'pdf':
            queryset = queryset.exclude(file='').exclude(file__isnull=True)

        # 4. Filtrado por A-Z, a-z, Z-A, z-a y fechas
        orden = self.request.GET.get('orden', 'a-z')
        if orden in ['a-z', 'az', 'title_asc']:
            queryset = queryset.order_by('title')
        elif orden in ['z-a', 'za', 'title_desc']:
            queryset = queryset.order_by('-title')
        elif orden == 'artista_az':
            queryset = queryset.order_by('artist', 'title')
        elif orden == 'artista_za':
            queryset = queryset.order_by('-artist', 'title')
        elif orden == 'recientes':
            queryset = queryset.order_by('-fecha_creacion')
        else:
            queryset = queryset.order_by('title')

        return queryset

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        canciones_activas = Song.objects.filter(is_active=True)

        context['tags'] = Tag.objects.all().order_by('name')
        context['current_q'] = self.request.GET.get('q', '').strip()
        context['current_tag'] = self.request.GET.get('tag', '')
        context['current_orden'] = self.request.GET.get('orden', 'a-z')
        context['current_filtro'] = self.request.GET.get('filtro', 'todos')

        # Contadores estadísticos para los badges
        context['total_canciones'] = canciones_activas.count()
        context['total_con_audio'] = canciones_activas.exclude(audio='').exclude(audio__isnull=True).count()
        context['total_con_pdf'] = canciones_activas.exclude(file='').exclude(file__isnull=True).count()

        return context


# VISTA DE DETALLE (Lectura de Canción y PDF/Audio)
class SongDetailView(LoginRequiredMixin, PermisoRolMixin, DetailView):
    model = Song
    template_name = 'playlist.html'
    context_object_name = 'song'
    nivel_requerido = 2


# VISTA DE CREACIÓN (Nivel 3: Lectura y Edición)
class SongCreateView(LoginRequiredMixin, PermisoRolMixin, CreateView):
    model = Song
    form_class = SongForm
    template_name = 'playlist.html'
    success_url = reverse_lazy('playlist')
    nivel_requerido = 3  # Exclusivo Nivel 3

    def form_valid(self, form):
        song = form.save()
        messages.success(self.request, f"¡Éxito! La canción '{song.title}' fue registrada correctamente en el repertorio.")
        # Retorna a la página previa o a playlist
        next_url = self.request.POST.get('next') or self.request.META.get('HTTP_REFERER') or self.success_url
        return redirect(next_url)

    def form_invalid(self, form):
        errores = []
        for field, error_list in form.errors.items():
            field_label = form.fields[field].label if field in form.fields and form.fields[field].label else field
            errores.append(f"{field_label}: {', '.join(error_list)}")
        msg_detalle = " | ".join(errores) if errores else "Por favor revisa los campos requeridos."
        messages.error(self.request, f"Hubo un error al guardar la canción: {msg_detalle}")
        next_url = self.request.POST.get('next') or self.request.META.get('HTTP_REFERER') or self.success_url
        return redirect(next_url)


# VISTA DE EDICIÓN (Nivel 3: Lectura y Edición)
class SongUpdateView(LoginRequiredMixin, PermisoRolMixin, UpdateView):
    model = Song
    form_class = SongForm
    template_name = 'playlist.html'
    success_url = reverse_lazy('playlist')
    nivel_requerido = 3  # Exclusivo Nivel 3

    def form_valid(self, form):
        song = form.save()
        messages.success(self.request, f"¡Actualizada! La canción '{song.title}' fue modificada correctamente.")
        next_url = self.request.POST.get('next') or self.request.META.get('HTTP_REFERER') or self.success_url
        return redirect(next_url)

    def form_invalid(self, form):
        errores = []
        for field, error_list in form.errors.items():
            field_label = form.fields[field].label if field in form.fields and form.fields[field].label else field
            errores.append(f"{field_label}: {', '.join(error_list)}")
        msg_detalle = " | ".join(errores) if errores else "Revisa los datos ingresados."
        messages.error(self.request, f"Error al actualizar la canción: {msg_detalle}")
        next_url = self.request.POST.get('next') or self.request.META.get('HTTP_REFERER') or self.success_url
        return redirect(next_url)


# VISTA DE ELIMINACIÓN (Nivel 3: Lectura y Edición / Super Admin)
class SongDeleteView(LoginRequiredMixin, PermisoRolMixin, DeleteView):
    model = Song
    success_url = reverse_lazy('playlist')
    nivel_requerido = 3

    def delete(self, request, *args, **kwargs):
        cancion = self.get_object()
        titulo = cancion.title
        cancion.delete()
        messages.warning(request, f"La canción '{titulo}' ha sido eliminada del repertorio.")
        return redirect(self.success_url)


# =========================================================
# 4. GESTIÓN DEL CALENDARIO SEMANAL
# =========================================================
class CalendarEventCreateView(LoginRequiredMixin, PermisoRolMixin, CreateView):
    model = CalendarEvent
    form_class = CalendarEventForm
    success_url = reverse_lazy('home')
    nivel_requerido = 3

    def form_valid(self, form):
        evento = form.save()
        messages.success(self.request, f"¡Listo! Canción '{evento.song.title}' programada en el calendario para el {evento.fecha.strftime('%d/%m/%Y')}.")
        return redirect(self.success_url)

    def form_invalid(self, form):
        errores = []
        for field, error_list in form.errors.items():
            field_label = form.fields[field].label if field in form.fields and form.fields[field].label else field
            errores.append(f"{field_label}: {', '.join(error_list)}")
        msg_detalle = " | ".join(errores) if errores else "Revisa los datos requeridos."
        messages.error(self.request, f"Error al programar en el calendario: {msg_detalle}")
        return redirect('home')



class CalendarEventDeleteView(LoginRequiredMixin, PermisoRolMixin, DeleteView):
    model = CalendarEvent
    success_url = reverse_lazy('home')
    nivel_requerido = 3

    def delete(self, request, *args, **kwargs):
        evento = self.get_object()
        evento.delete()
        messages.info(request, "El evento del calendario fue retirado con éxito.")
        return redirect(self.success_url)