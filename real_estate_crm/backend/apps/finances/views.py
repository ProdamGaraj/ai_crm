# real_estate_crm/backend/apps/finances/views.py

from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from decimal import Decimal
from .models import PaymentLog
from .models import Payment, PaymentType, BeneficiaryAccount
from apps.deals.models import Deal
from .serializers import PaymentSerializer, PaymentTypeSerializer, BeneficiaryAccountSerializer
from datetime import date

class PaymentTypeListView(generics.ListCreateAPIView):
    queryset = PaymentType.objects.all()
    serializer_class = PaymentTypeSerializer
    permission_classes = [IsAuthenticated]


class BeneficiaryAccountListView(generics.ListCreateAPIView):
    queryset = BeneficiaryAccount.objects.all()
    serializer_class = BeneficiaryAccountSerializer
    permission_classes = [IsAuthenticated]


class DealPaymentScheduleCreateView(APIView):
    """
    Создает график платежей для сделки.
    Принимает список объектов платежей.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, deal_pk, *args, **kwargs):
        try:
            deal = Deal.objects.get(pk=deal_pk)
        except Deal.DoesNotExist:
            return Response({"error": "Сделка не найдена."}, status=status.HTTP_404_NOT_FOUND)

        if not deal.contract_price:
            return Response({"error": "Для создания графика необходимо указать 'Стоимость по договору' в сделке."},
                            status=status.HTTP_400_BAD_REQUEST)

        payments_data = request.data
        if not isinstance(payments_data, list):
            return Response({"error": "Ожидается список платежей."}, status=status.HTTP_400_BAD_REQUEST)

        total_amount = sum(Decimal(p.get('amount', 0)) for p in payments_data)

        if total_amount != deal.contract_price:
            return Response({
                "error": f"Сумма платежей ({total_amount}) не совпадает со стоимостью по договору ({deal.contract_price})."
            }, status=status.HTTP_400_BAD_REQUEST)

        # Удаляем старый график, если он был
        deal.payments.all().delete()

        created_payments = []
        for payment_data in payments_data:
            serializer = PaymentSerializer(data=payment_data)
            if serializer.is_valid(raise_exception=True):
                # Сохраняем платеж, привязывая его к сделке, клиенту и текущему пользователю
                payment = serializer.save(
                    deal=deal,
                    client=deal.client,
                    created_by=request.user
                )
                created_payments.append(PaymentSerializer(payment).data)

        return Response(created_payments, status=status.HTTP_201_CREATED)

class PaymentTypeDetailView(generics.DestroyAPIView):
    queryset = PaymentType.objects.all()
    serializer_class = PaymentTypeSerializer
    permission_classes = [IsAuthenticated]
class BeneficiaryAccountDetailView(generics.DestroyAPIView):
    queryset = BeneficiaryAccount.objects.all()
    serializer_class = BeneficiaryAccountSerializer
    permission_classes = [IsAuthenticated]


class PaymentDetailView(generics.RetrieveUpdateAPIView):
    """
    View для обновления данных по конкретному платежу.
    Используется для проставления/отмены даты оплаты.
    """
    queryset = Payment.objects.all()
    serializer_class = PaymentSerializer
    permission_classes = [IsAuthenticated]

    def perform_update(self, serializer):
        instance_before_update = self.get_object()

        # Проверяем, было ли поле payment_date в запросе
        if 'payment_date' in self.request.data:
            new_payment_date = self.request.data.get('payment_date')

            if new_payment_date and not instance_before_update.payment_date:
                # Случай: ПЛАТЕЖ ОТМЕЧЕН КАК ОПЛАЧЕННЫЙ
                instance = serializer.save()
                PaymentLog.objects.create(
                    payment=instance,
                    user=self.request.user,
                    action=f"Платеж отмечен как оплаченный. Дата оплаты: {new_payment_date}."
                )
            elif not new_payment_date and instance_before_update.payment_date:
                # Случай: ОПЛАТА ОТМЕНЕНА
                instance = serializer.save(payment_date=None)
                PaymentLog.objects.create(
                    payment=instance,
                    user=self.request.user,
                    action=f"Оплата отменена. Предыдущая дата: {instance_before_update.payment_date}."
                )
            else:
                # Другие случаи (например, изменение даты)
                serializer.save()
        else:
            # Обновление других полей, не связанных с датой оплаты
            serializer.save()