from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Q
from .models import Deal
from apps.realty.models import Property, Discount
from .serializers import DealCreateSerializer, DealDetailSerializer
# ИСПРАВЛЕНИЕ: Импортируем DiscountListSerializer
from apps.realty.serializers import DiscountListSerializer


class DealCreateView(generics.CreateAPIView):
    queryset = Deal.objects.all()
    serializer_class = DealCreateSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        property_instance = serializer.validated_data['property']

        initial_price = property_instance.price
        initial_price_per_sqm = property_instance.price_per_sqm

        deal = serializer.save(
            created_by=self.request.user,
            initial_price=initial_price,
            initial_price_per_sqm=initial_price_per_sqm
        )

        property_instance.status = Property.PropertyStatus.BOOKING
        property_instance.save()


class DealDetailView(generics.RetrieveUpdateAPIView):
    queryset = Deal.objects.select_related('client', 'property', 'created_by').prefetch_related('applied_discounts')
    serializer_class = DealDetailSerializer
    permission_classes = [IsAuthenticated]


class AvailableDiscountsView(generics.ListAPIView):
    """
    Возвращает список скидок, доступных для объекта в сделке.
    """
    # ИСПРАВЛЕНИЕ: Используем DiscountListSerializer
    serializer_class = DiscountListSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        deal_id = self.kwargs['deal_pk']
        try:
            deal = Deal.objects.get(pk=deal_id)
            property_obj = deal.property
            building_obj = property_obj.building

            return Discount.objects.filter(
                Q(properties=property_obj) |
                Q(property_type=property_obj.property_type) |
                Q(buildings=building_obj),
                is_active=True
            ).distinct()
        except Deal.DoesNotExist:
            return Discount.objects.none()