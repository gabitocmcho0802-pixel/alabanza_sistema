from django.db import models

class Tag(models.Model):
    name = models.CharField(max_length=50, unique=True)

    def __str__(self):
        return self.name


class Song(models.Model):
    tags = models.ManyToManyField(Tag, related_name='songs', blank=True)
    title = models.CharField(max_length=100)
    artist = models.CharField(max_length=100)
    file = models.FileField(upload_to='songs/', blank=True, null=True)
    audio = models.FileField(upload_to='songs/', blank=True, null=True)
    duration = models.DurationField(blank=True, null=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.title

    @property
    def formatted_duration(self):
        if not self.duration:
            return ""
        total_seconds = int(self.duration.total_seconds())
        minutes = total_seconds // 60
        seconds = total_seconds % 60
        return f"{minutes:02d}:{seconds:02d}"


class CalendarEvent(models.Model):
    song = models.ForeignKey(Song, on_delete=models.CASCADE)
    titulo = models.CharField(max_length=100)
    fecha = models.DateField()
    descripcion = models.CharField(max_length=200, blank=True, null=True, default='')
    es_activo = models.BooleanField(default=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.titulo} - {self.song.title}"


