from django.urls import path
from .views import (
    HomeView,
    SongListView,
    SongDetailView,
    SongCreateView,
    SongUpdateView,
    SongDeleteView,
    CalendarEventCreateView,
    CalendarEventDeleteView,
)

urlpatterns = [
    path('', HomeView.as_view(), name='home'),
    path('repertorio/', SongListView.as_view(), name='playlist'),
    path('cancion/crear/', SongCreateView.as_view(), name='song_create'),
    path('cancion/<int:pk>/', SongDetailView.as_view(), name='song_detail'),
    path('cancion/<int:pk>/editar/', SongUpdateView.as_view(), name='song_update'),
    path('cancion/<int:pk>/eliminar/', SongDeleteView.as_view(), name='song_delete'),
    path('calendario/evento/crear/', CalendarEventCreateView.as_view(), name='calendar_event_create'),
    path('calendario/evento/<int:pk>/eliminar/', CalendarEventDeleteView.as_view(), name='calendar_event_delete'),
]
