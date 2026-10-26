from .models import Tag

def song_context(request):
    """
    Context processor para proveer la lista de etiquetas activas
    a nivel global para los modales de creación y edición.
    """
    try:
        tags = Tag.objects.all().order_by('name')
    except Exception:
        tags = []
    return {
        'all_tags': tags
    }
