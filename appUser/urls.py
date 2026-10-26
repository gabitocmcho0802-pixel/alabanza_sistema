from django.urls import path
from .views import CustomLoginView, CustomLogoutView, UserProfileView

urlpatterns = [
    path('login/', CustomLoginView.as_view(), name='login'),
    path('logout/', CustomLogoutView.as_view(), name='logout'),
    path('perfil/', UserProfileView.as_view(), name='user_profile'),
]
