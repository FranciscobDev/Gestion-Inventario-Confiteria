from django.contrib.auth.views import LoginView
from django.contrib.auth import logout
from django.shortcuts import redirect
from django.views import View
from django.contrib import messages
from django.urls import reverse_lazy
from .forms import AdminAuthenticationForm

class AdminLoginView(LoginView):
    """
    Vista de inicio de sesión exclusiva para el panel de administración.
    Utiliza AdminAuthenticationForm para verificar credenciales y rol de administrador.
    """
    form_class = AdminAuthenticationForm
    template_name = 'registration/login.html'
    redirect_authenticated_user = True

    def get_success_url(self):
        return reverse_lazy('gestion:inicio')

    def form_invalid(self, form):
        messages.error(self.request, "Credenciales incorrectas o usuario sin permisos de administración.")
        return super().form_invalid(form)


class AdminLogoutView(View):
    """
    Vista de cierre de sesión. Admite tanto peticiones POST como GET
    para mayor comodidad, redirigiendo siempre al login con un mensaje flash.
    """
    def dispatch(self, request, *args, **kwargs):
        if request.user.is_authenticated:
            logout(request)
            messages.info(request, "Has cerrado sesión correctamente.")
        return redirect('login')
