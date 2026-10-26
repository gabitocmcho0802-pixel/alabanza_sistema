from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import Usuario, Rol


@admin.register(Rol)
class RolAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'inventario', 'audios', 'letras', 'administrador')
    list_editable = ('inventario', 'audios', 'letras', 'administrador')


@admin.register(Usuario)
class UsuarioAdmin(UserAdmin):
    list_display = ('username', 'email', 'rol', 'is_staff', 'is_superuser', 'activo')
    list_filter = ('rol', 'is_staff', 'is_superuser', 'activo')
    fieldsets = UserAdmin.fieldsets + (
        ('Rol y Permisos del Sistema', {'fields': ('rol', 'activo')}),
    )
