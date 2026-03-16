from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import register, login, profile

urlpatterns = [
    path('register/', register, name='register'),
    path('login/', login, name='login'),
    path('profile/', profile, name='profile'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token-refresh'),
]