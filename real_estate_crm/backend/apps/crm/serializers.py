from rest_framework import serializers
from .models import Client, Application, PreciseSource, ClientLog, RejectionReason, ApplicationLog

# --- Сериализаторы для Клиентов ---
class ClientListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Client
        fields = ['id', 'full_name', 'phone_number', 'email', 'created_at']

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
    class Meta:
        model = Client
        fields = [
            'id', 'full_name', 'phone_number', 'email', 'date_of_birth', 'gender',
            'marital_status', 'passport_series_number', 'passport_issued_by',
            'passport_issued_date', 'pinfl', 'registration_address', 'relatives',
            'created_at', 'updated_at', 'created_by', 'applications', 'logs'
        ]

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