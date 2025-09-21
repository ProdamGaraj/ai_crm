from rest_framework import serializers
from .models import Deal
from apps.crm.serializers import ClientListSerializer
# ИСПРАВЛЕНИЕ: Импортируем DiscountListSerializer
from apps.realty.serializers import PropertyListSerializer, DiscountListSerializer


class DealCreateSerializer(serializers.ModelSerializer):
    """
    Сериализатор для создания новой сделки (бронирования).
    Принимает ID клиента, объекта и дату окончания брони.
    """

    class Meta:
        model = Deal
        fields = ['client', 'property', 'booking_end_date']


class DealDetailSerializer(serializers.ModelSerializer):
    """
    Сериализатор для детального отображения и обновления сделки.
    Включает вложенные данные о клиенте, объекте и примененных скидках.
    """
    client = ClientListSerializer(read_only=True)
    property = PropertyListSerializer(read_only=True)
    # Используем DiscountListSerializer для отображения краткой информации о скидках
    applied_discounts = DiscountListSerializer(many=True, read_only=True)
    created_by = serializers.StringRelatedField(read_only=True)

    # Поле только для записи (write-only), чтобы принимать массив ID скидок при обновлении
    applied_discounts_ids = serializers.PrimaryKeyRelatedField(
        many=True,
        write_only=True,
        queryset=Deal.applied_discounts.field.related_model.objects.all(),
        source='applied_discounts'
    )

    class Meta:
        model = Deal
        fields = [
            'id', 'status', 'booking_start_date', 'booking_end_date', 'client', 'property',
            'initial_price', 'initial_price_per_sqm', 'contract_price', 'notes',
            'created_by', 'created_at', 'applied_discounts', 'applied_discounts_ids'
        ]
        # Поля, которые нельзя изменять напрямую через этот сериализатор
        read_only_fields = [
            'id', 'status', 'booking_start_date', 'client', 'property',
            'initial_price', 'initial_price_per_sqm', 'created_by', 'created_at', 'applied_discounts'
        ]

