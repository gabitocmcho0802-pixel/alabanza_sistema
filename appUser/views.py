from django.contrib.auth.views import LoginView, LogoutView
from django.views.generic import TemplateView
from django.contrib.auth.mixins import LoginRequiredMixin
from django.urls import reverse_lazy
from django.contrib import messages
from .models import Rol, Usuario


class CustomLoginView(LoginView):
    template_name = 'login.html'
    redirect_authenticated_user = True

    def get_success_url(self):
        messages.success(self.request, f"¡Bienvenido de nuevo, {self.request.user.username}!")
        return reverse_lazy('home')

    def form_invalid(self, form):
        messages.error(self.request, "Credenciales incorrectas. Por favor verifica tu usuario y contraseña.")
        return super().form_invalid(form)


class CustomLogoutView(LogoutView):
    next_page = reverse_lazy('login')

    def dispatch(self, request, *args, **kwargs):
        messages.info(request, "Has cerrado sesión correctamente. ¡Hasta pronto!")
        return super().dispatch(request, *args, **kwargs)


class UserProfileView(LoginRequiredMixin, TemplateView):
    template_name = 'home.html'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['roles_info'] = Rol.objects.all()
        return context
