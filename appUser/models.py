from django.db import models
from django.contrib.auth.models import AbstractUser

class Rol(models.Model):
    PERMISOS_OPCIONES = (
        (1, 'Sin acceso'),
        (2, 'Solo lectura'),
        (3, 'Crear y modificar')
    )

    nombre = models.CharField(max_length=100, unique=True)
    administrador = models.IntegerField(choices=PERMISOS_OPCIONES, default=1)
    vendedor = models.IntegerField(choices=PERMISOS_OPCIONES, default=1)
    inventario = models.IntegerField(choices=PERMISOS_OPCIONES, default=1) # Canciones
    audios = models.IntegerField(choices=PERMISOS_OPCIONES, default=3)
    letras = models.IntegerField(choices=PERMISOS_OPCIONES, default=1)
    
    def __str__(self):
        return self.nombre

    class Meta:
        verbose_name = 'Rol'
        verbose_name_plural = 'Roles'


class Usuario(AbstractUser):
    GENERO_OPCIONES = [
        ('FEMENINO', 'Femenino'),
        ('MASCULINO', 'Masculino')
    ]

    rol = models.ForeignKey(Rol, on_delete=models.SET_NULL, null=True, blank=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)
    activo = models.BooleanField(default=True)

    @property
    def nivel_canciones(self):
        if self.is_superuser:
            return 3
        if self.rol:
            return self.rol.inventario
        return 1

    @property
    def nivel_audios(self):
        if self.is_superuser:
            return 3
        if self.rol:
            return getattr(self.rol, 'audios', 3)
        return 1

    @property
    def nivel_letras(self):
        if self.is_superuser:
            return 3
        if self.rol:
            return getattr(self.rol, 'letras', 1)
        return 1

    @property
    def nivel_admin(self):
        if self.is_superuser:
            return 3
        if self.rol:
            return self.rol.administrador
        return 1

    @property
    def puede_editar_canciones(self):
        return self.nivel_canciones >= 3

    @property
    def puede_ver_canciones(self):
        return self.nivel_canciones >= 2

    @property
    def puede_editar_letras(self):
        return self.nivel_letras >= 3

    @property
    def puede_editar_audios(self):
        return self.nivel_audios >= 3

    @property
    def puede_administrar(self):
        return self.is_superuser or (self.nivel_admin >= 3)

    class Meta:
        verbose_name = 'Usuario'
        verbose_name_plural = 'Usuarios'