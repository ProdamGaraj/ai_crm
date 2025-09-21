from django.urls import path
from .views import (
    ClientListView,
    ClientDetailView,
    ApplicationListView,
    ApplicationDetailView,
    PublicApplicationCreateView,
    RejectionReasonListView  # <-- ДОБАВЬТЕ ЭТОТ ИМПОРТ
)

urlpatterns = [
    # Clients
    path('clients/', ClientListView.as_view(), name='client-list-create'),
    path('clients/<int:pk>/', ClientDetailView.as_view(), name='client-detail'),

    # Applications
    path('applications/', ApplicationListView.as_view(), name='application-list-create'),
    path('applications/<int:pk>/', ApplicationDetailView.as_view(), name='application-detail'),

    # Public Applications
    path('public/applications/', PublicApplicationCreateView.as_view(), name='public-application-create'),

    # Rejection Reasons
    path('rejection-reasons/', RejectionReasonListView.as_view(), name='rejection-reason-list'),
]