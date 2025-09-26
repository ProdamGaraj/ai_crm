from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Q
from .models import Deal
from apps.realty.models import Property, Discount
from .serializers import DealCreateSerializer, DealDetailSerializer
from apps.realty.serializers import DiscountListSerializer
from rest_framework import generics, status
from apps.realty.models import Property
from .models import Deal, DealLog
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser
from rest_framework import serializers


class DealCreateView(generics.CreateAPIView):
    queryset = Deal.objects.all()
    serializer_class = DealCreateSerializer
    permission_classes = [IsAuthenticated]

    def create(self, request, *args, **kwargs):
        """
        Переопределяем метод для возврата полного объекта сделки после создания.
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Проверяем, что объект не в активной сделке
        property_instance = serializer.validated_data['property']
        active_statuses = [Deal.DealStatus.BOOKING, Deal.DealStatus.IN_PROGRESS]
        if Deal.objects.filter(property=property_instance, status__in=active_statuses).exists():
            return Response({"error": "Этот объект уже находится в другой активной сделке."},
                            status=status.HTTP_400_BAD_REQUEST)

        # Вызываем наш кастомный метод сохранения из perform_create
        self.perform_create(serializer)

        # Для ответа используем детальный сериализатор, который включает ID
        response_serializer = DealDetailSerializer(serializer.instance)
        headers = self.get_success_headers(response_serializer.data)

        return Response(response_serializer.data, status=status.HTTP_201_CREATED, headers=headers)

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

class DealCancelOrTerminateView(APIView):
    """
    View для отмены или расторжения сделки.
    """
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser] # Для загрузки файлов

    def post(self, request, deal_pk, *args, **kwargs):
        try:
            deal = Deal.objects.select_related('property').prefetch_related('payments').get(pk=deal_pk)
        except Deal.DoesNotExist:
            return Response({"error": "Сделка не найдена."}, status=status.HTTP_404_NOT_FOUND)

        # Проверка, что сделка еще не в финальном статусе
        if deal.status in [Deal.DealStatus.CLOSED_WON, Deal.DealStatus.CANCELLED, Deal.DealStatus.TERMINATED]:
            return Response({"error": "Сделка уже находится в финальном статусе."}, status=status.HTTP_400_BAD_REQUEST)

        # Определяем, есть ли финансовые операции или подпись
        has_paid_payments = deal.payments.filter(payment_date__isnull=False).exists()
        is_signed = bool(deal.client_signature_date)

        action_log = ""

        if has_paid_payments or is_signed:
            # --- ЛОГИКА РАСТОРЖЕНИЯ ---
            document = request.data.get('termination_document_scan')
            date = request.data.get('termination_date')
            if not document or not date:
                return Response({"error": "Для расторжения необходимо загрузить документ и указать дату."}, status=status.HTTP_400_BAD_REQUEST)

            deal.status = Deal.DealStatus.TERMINATED
            deal.termination_document_scan = document
            deal.termination_date = date
            action_log = f"Сделка расторгнута. Дата: {date}."

        else:
            # --- ЛОГИКА ОТМЕНЫ ---
            reason = request.data.get('cancellation_reason')
            if not reason:
                return Response({"error": "Для отмены необходимо указать причину."}, status=status.HTTP_400_BAD_REQUEST)
            deal.status = Deal.DealStatus.CANCELLED
            deal.cancellation_reason = reason
            action_log = f"Сделка отменена. Причина: {reason}."

        # Обновляем статус объекта недвижимости
        property_obj = deal.property
        property_obj.status = Property.PropertyStatus.SELECTION
        property_obj.save()

        deal.save()

        # Логируем действие
        DealLog.objects.create(deal=deal, user=request.user, action=action_log)

        return Response(DealDetailSerializer(deal).data, status=status.HTTP_200_OK)

class DealDetailView(generics.RetrieveUpdateAPIView):
    queryset = Deal.objects.select_related('client', 'property', 'created_by').prefetch_related('applied_discounts', 'logs') # <--- СТАЛО
    serializer_class = DealDetailSerializer
    permission_classes = [IsAuthenticated]


class AvailableDiscountsView(generics.ListAPIView):
    """
    Возвращает список скидок, доступных для объекта в сделке.
    """
    serializer_class = DiscountListSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        deal_id = self.kwargs['deal_pk']
        try:
            deal = Deal.objects.select_related('property__building').get(pk=deal_id)
            property_obj = deal.property
            building_obj = property_obj.building

            # --- ИСПРАВЛЕННАЯ ЛОГИКА ФИЛЬТРАЦИИ ---
            return Discount.objects.filter(
                # Условие 1: Скидка привязана к конкретному дому ИЛИ
                Q(buildings=building_obj) |
                # Условие 2: Скидка привязана к типу недвижимости нашего объекта
                Q(property_type=property_obj.property_type) |
                # Условие 3: Скидка общая для всех (не привязана ни к дому, ни к типу)
                Q(buildings__isnull=True, property_type__isnull=True),
                is_active=True
            ).distinct()
            # -----------------------------------------

        except Deal.DoesNotExist:
            return Discount.objects.none()