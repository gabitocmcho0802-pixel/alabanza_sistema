from django.contrib import admin
from .models import Song, Tag, CalendarEvent


@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    list_display = ('name',)
    search_fields = ('name',)


@admin.register(Song)
class SongAdmin(admin.ModelAdmin):
    list_display = ('title', 'artist', 'duration', 'is_active', 'fecha_creacion')
    list_filter = ('is_active', 'tags', 'fecha_creacion')
    search_fields = ('title', 'artist')
    filter_horizontal = ('tags',)


@admin.register(CalendarEvent)
class CalendarEventAdmin(admin.ModelAdmin):
    list_display = ('titulo', 'song', 'fecha', 'es_activo')
    list_filter = ('fecha', 'es_activo')
    search_fields = ('titulo', 'song__title', 'descripcion')
