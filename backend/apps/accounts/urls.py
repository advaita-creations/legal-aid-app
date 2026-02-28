"""Account app URLs."""
from django.urls import path
from . import views

urlpatterns = [
    path('auth/login/', views.login_view, name='login'),
    path('auth/logout/', views.logout_view, name='logout'),
    path('auth/me/', views.me_view, name='me'),
    path('me/', views.update_profile_view, name='update-profile'),
    path('dashboard/stats/', views.dashboard_stats_view, name='dashboard-stats'),
    path('admin/advocates/', views.admin_advocates_list, name='admin-advocates-list'),
    path('admin/advocates/<int:pk>/', views.admin_toggle_advocate, name='admin-toggle-advocate'),
    path('admin/stats/', views.admin_stats_view, name='admin-stats'),
]
