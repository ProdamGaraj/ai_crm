from django.urls import path
from .views import DealCreateView, DealDetailView, AvailableDiscountsView, DealCancelOrTerminateView
urlpatterns = [
    path('deals/', DealCreateView.as_view(), name='deal-create'),
    path('deals/<int:pk>/', DealDetailView.as_view(), name='deal-detail'),
    path('deals/<int:deal_pk>/cancel/', DealCancelOrTerminateView.as_view(), name='deal-cancel-terminate'),

    path('deals/<int:deal_pk>/available-discounts/', AvailableDiscountsView.as_view(), name='available-discounts'),
]
