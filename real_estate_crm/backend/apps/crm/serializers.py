from rest_framework import serializers
from .models import Client, Application, PreciseSource, ClientLog, RejectionReason, ApplicationLog, ClientPhoneNumber
# --- Сериализаторы для Клиентов ---

class ClientListSerializer(serializers.ModelSerializer):
    # Показываем только основной номер в общем списке
    primary_phone_number = serializers.SerializerMethodField()

    class Meta:
        model = Client
        fields = ['id', 'full_name', 'primary_phone_number', 'email', 'created_at']

    def get_primary_phone_number(self, obj):
        primary_phone = obj.phone_numbers.filter(is_primary=True).first()
        if primary_phone:
            return primary_phone.phone_number
        # Если основного нет, возвращаем первый попавшийся
        first_phone = obj.phone_numbers.first()
        return first_phone.phone_number if first_phone else None

class ClientPhoneNumberSerializer(serializers.ModelSerializer):
    class Meta:
        model = ClientPhoneNumber
        fields = ['id', 'phone_number', 'is_primary']

class ClientLogSerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField()
    class Meta:
        model = ClientLog
        fields = ['id', 'user', 'action', 'created_at']

# --- Сериализаторы для Заявок ---
class ApplicationListSerializer(serializers.ModelSerializer):
    client = serializers.StringRelatedField()
    precise_source = serializers.StringRelatedField()
    created_by = serializers.StringRelatedField()
    class Meta:
        model = Application
        fields = ['id', 'status', 'source', 'client', 'precise_source', 'created_by', 'created_at']

# НЕДОСТАЮЩИЙ СЕРИАЛИЗАТОР
class ApplicationLogSerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField()
    class Meta:
        model = ApplicationLog
        fields = ['id', 'user', 'action', 'created_at']

class RejectionReasonSerializer(serializers.ModelSerializer):
    class Meta:
        model = RejectionReason
        fields = '__all__'

# --- Детальные сериализаторы ---
class ClientDetailSerializer(serializers.ModelSerializer):
    applications = ApplicationListSerializer(many=True, read_only=True)
    logs = ClientLogSerializer(many=True, read_only=True)
    phone_numbers = ClientPhoneNumberSerializer(many=True, required=False)

    # ДОБАВЛЕНО: Поле только для записи для простой формы создания
    phone_number = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = Client
        fields = [
            'id', 'full_name', 'email', 'date_of_birth', 'gender', 'status',
            'marital_status', 'passport_series', 'passport_number', 'passport_issued_by',
            'passport_issued_date', 'inn', 'pinfl', 'registration_address', 'billing_address',
            'file_storage_link', 'comment', 'relatives', 'created_at', 'updated_at',
            'created_by', 'applications', 'logs', 'phone_numbers',
            'phone_number'  # <-- Добавили поле для создания
        ]

    def create(self, validated_data):
        # Извлекаем данные для связанных моделей
        phone_numbers_data = validated_data.pop('phone_numbers', [])
        initial_phone = validated_data.pop('phone_number', None)

        # Создаем основной объект клиента
        client = Client.objects.create(**validated_data)

        # Если в запросе был простой 'phone_number', создаем его как основной
        if initial_phone:
            ClientPhoneNumber.objects.create(client=client, phone_number=initial_phone, is_primary=True)
        # Если была передана сложная структура, создаем номера из нее
        elif phone_numbers_data:
            for phone_data in phone_numbers_data:
                ClientPhoneNumber.objects.create(client=client, **phone_data)

        return client

    def update(self, instance, validated_data):
        phone_numbers_data = validated_data.pop('phone_numbers', None)
        instance = super().update(instance, validated_data)

        if phone_numbers_data is not None:
            instance.phone_numbers.all().delete()
            for phone_data in phone_numbers_data:
                ClientPhoneNumber.objects.create(client=instance, **phone_data)

        return instance

class ApplicationDetailSerializer(serializers.ModelSerializer):
    created_by = serializers.StringRelatedField(read_only=True)
    client = ClientDetailSerializer(read_only=True)
    client_id = serializers.IntegerField(write_only=True)
    logs = ApplicationLogSerializer(many=True, read_only=True)
    rejection_reason = RejectionReasonSerializer(read_only=True)
    rejection_reason_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)

    class Meta:
        model = Application
        fields = [
            'id', 'client', 'client_id', 'status', 'source', 'precise_source',
            'interested_projects', 'interested_property_type',
            'min_area', 'max_area', 'min_floor', 'max_floor',
            'notes', 'created_by', 'created_at', 'updated_at',
            'rejection_reason', 'rejection_reason_id', 'logs'
        ]

    def create(self, validated_data):
        validated_data['client_id'] = validated_data.pop('client_id')
        return super().create(validated_data)

# --- Публичные сериализаторы ---
class PublicApplicationSerializer(serializers.Serializer):
    """ Сериализатор для приема заявок с публичных источников (сайт) """
    full_name = serializers.CharField(max_length=255, required=False)
    phone_number = serializers.CharField(max_length=20)

    # ИЗМЕНЕНИЕ: Убираем default и добавляем проверку на допустимые значения
    source = serializers.ChoiceField(choices=Application.ApplicationSource.choices)

    notes = serializers.CharField(required=False, allow_blank=True)

    def validate_phone_number(self, value):
        if not value.replace('+', '').isdigit():
            raise serializers.ValidationError("Номер телефона должен содержать только цифры и знак '+'")
        return value