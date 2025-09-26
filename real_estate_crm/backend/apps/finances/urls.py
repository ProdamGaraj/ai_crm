# real_estate_crm/backend/apps/finances/urls.py

from django.urls import path
from .views import (
    PaymentTypeListView, BeneficiaryAccountListView, DealPaymentScheduleCreateView,
    PaymentTypeDetailView, BeneficiaryAccountDetailView,PaymentDetailView  # <--- Добавьте импорты
)

urlpatterns = [
    path('finances/payment-types/', PaymentTypeListView.as_view(), name='payment-type-list'),
    path('finances/payment-types/<int:pk>/', PaymentTypeDetailView.as_view(), name='payment-type-detail'),
    # <--- Добавьте эту строку

    path('finances/beneficiary-accounts/', BeneficiaryAccountListView.as_view(), name='beneficiary-account-list'),
    path('finances/beneficiary-accounts/<int:pk>/', BeneficiaryAccountDetailView.as_view(),
         name='beneficiary-account-detail'),  # <--- Добавьте эту строку
    path('finances/payments/<int:pk>/', PaymentDetailView.as_view(), name='payment-detail'),
    path('deals/<int:deal_pk>/payment-schedule/', DealPaymentScheduleCreateView.as_view(),
         name='deal-payment-schedule-create'),
]