from django.urls import path
from .views import DealCreateView, DealDetailView, AvailableDiscountsView

urlpatterns = [
    path('deals/', DealCreateView.as_view(), name='deal-create'),
    path('deals/<int:pk>/', DealDetailView.as_view(), name='deal-detail'),
    # Новый маршрут для получения доступных скидок
    path('deals/<int:deal_pk>/available-discounts/', AvailableDiscountsView.as_view(), name='available-discounts'),
]
