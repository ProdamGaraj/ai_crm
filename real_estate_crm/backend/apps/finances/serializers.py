# real_estate_crm/backend/apps/finances/serializers.py

from rest_framework import serializers
from .models import Payment, PaymentType, BeneficiaryAccount

class PaymentTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = PaymentType
        fields = '__all__'

class BeneficiaryAccountSerializer(serializers.ModelSerializer):
    class Meta:
        model = BeneficiaryAccount
        fields = '__all__'

class PaymentSerializer(serializers.ModelSerializer):
    # Поля только для чтения, чтобы отображать названия, а не ID
    payment_type = serializers.StringRelatedField(read_only=True)
    beneficiary_account = serializers.StringRelatedField(read_only=True)
    created_by = serializers.StringRelatedField(read_only=True)
    responsible_employee = serializers.StringRelatedField(read_only=True)

    # Поля только для записи, чтобы принимать ID при создании/обновлении
    payment_type_id = serializers.IntegerField(write_only=True)
    beneficiary_account_id = serializers.IntegerField(write_only=True)
    responsible_employee_id = serializers.IntegerField(write_only=True, required=False)

    class Meta:
        model = Payment
        fields = [
            'id', 'amount', 'currency', 'method', 'due_date', 'payment_date',
            'get_status_display', 'created_at', 'payment_type', 'beneficiary_account',
            'created_by', 'responsible_employee', 'payment_type_id',
            'beneficiary_account_id', 'responsible_employee_id'
        ]
        read_only_fields = ['get_status_display', 'created_at']