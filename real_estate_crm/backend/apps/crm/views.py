from django.utils import timezone
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .models import Client, Application, ClientLog, RejectionReason, ApplicationLog, Meeting, MeetingLog
from .serializers import (
    ClientListSerializer, ClientDetailSerializer,
    ApplicationListSerializer, ApplicationDetailSerializer,
    PublicApplicationSerializer, RejectionReasonSerializer, MeetingSerializer
)
from .filters import ClientFilter, ApplicationFilter, MeetingFilter
from django.contrib.auth.models import User # Добавьте этот импорт в начало файла
from .serializers import UserSerializer


class RejectionReasonListView(generics.ListCreateAPIView):
    serializer_class = RejectionReasonSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = RejectionReason.objects.filter(is_active=True)
        reason_type = self.request.query_params.get('type')
        if reason_type:
            queryset = queryset.filter(reason_type=reason_type)
        return queryset


class ClientListView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]
    queryset = Client.objects.all()
    filterset_class = ClientFilter

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return ClientDetailSerializer
        return ClientListSerializer

    def perform_create(self, serializer):
        client_instance = serializer.save(created_by=self.request.user)

        today = timezone.now()
        Meeting.objects.create(
            client=client_instance,
            creator=None,
            executor=self.request.user,
            status=Meeting.MeetingStatus.COMPLETED,
            planned_date=today,
            actual_date=today,
            comment="Автоматически созданная встреча при регистрации клиента.",
            is_auto_created=True
        )

        ClientLog.objects.create(
            client=client_instance,
            user=self.request.user,
            action=f"Клиент создан."
        )


class ClientDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated]
    queryset = Client.objects.prefetch_related('phone_numbers').all()
    serializer_class = ClientDetailSerializer

    def perform_update(self, serializer):
        old_instance = self.get_object()
        old_data = self.get_serializer(old_instance).data
        old_phones = sorted([p['phone_number'] for p in old_data.get('phone_numbers', [])])
        instance = serializer.save()
        new_data = self.get_serializer(instance).data
        new_phones = sorted([p['phone_number'] for p in new_data.get('phone_numbers', [])])
        changes = []
        for key, value in old_data.items():
            if key not in ['updated_at', 'logs', 'applications', 'phone_numbers', 'meetings']:
                new_value = new_data.get(key)
                if value != new_value:
                    old_value_str = value or "пусто"
                    new_value_str = new_value or "пусто"
                    changes.append(f"Поле '{key}' изменено с '{old_value_str}' на '{new_value_str}'")
        if old_phones != new_phones:
            old_phones_str = ", ".join(old_phones) or "пусто"
            new_phones_str = ", ".join(new_phones) or "пусто"
            changes.append(f"Поле 'phone_numbers' изменено с '{old_phones_str}' на '{new_phones_str}'")
        if changes:
            action_text = "Данные клиента обновлены. " + "; ".join(changes)
            ClientLog.objects.create(
                client=instance,
                user=self.request.user,
                action=action_text
            )

class ApplicationListView(generics.ListCreateAPIView):
    queryset = Application.objects.select_related('client', 'precise_source', 'created_by').all()
    permission_classes = [IsAuthenticated]
    filterset_class = ApplicationFilter

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return ApplicationDetailSerializer
        return ApplicationListSerializer

    def perform_create(self, serializer):
        if serializer.validated_data.get('source') == 'OFFICE':
            serializer.save(created_by=self.request.user)
        else:
            serializer.save()

class RejectionReasonDetailView(generics.RetrieveUpdateAPIView):
    queryset = RejectionReason.objects.all()
    serializer_class = RejectionReasonSerializer
    permission_classes = [IsAuthenticated]

class ApplicationDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Application.objects.all()
    serializer_class = ApplicationDetailSerializer
    permission_classes = [IsAuthenticated]

    def perform_update(self, serializer):
        old_instance = self.get_object()
        old_data = self.get_serializer(old_instance).data
        instance = serializer.save()
        new_data = self.get_serializer(instance).data
        changes = []
        for key in old_data:
            if old_data[key] != new_data[key]:
                if key not in ['updated_at', 'logs', 'client', 'meetings']:
                    old_value = old_data[key] or "пусто"
                    new_value = new_data[key] or "пусто"
                    changes.append(f"Поле '{key}' изменено с '{old_value}' на '{new_value}'")
        if changes:
            action_text = "Заявка обновлена. " + "; ".join(changes)
            ApplicationLog.objects.create(
                application=instance,
                user=self.request.user,
                action=action_text
            )

class PublicApplicationCreateView(generics.CreateAPIView):
    serializer_class = PublicApplicationSerializer
    permission_classes = []

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        phone_number = data.get('phone_number')
        client, created = Client.objects.get_or_create(
            phone_number=phone_number,
            defaults={'full_name': data.get('full_name', '')}
        )
        if not created and data.get('full_name') and client.full_name != data.get('full_name'):
            client.full_name = data.get('full_name')
            client.save()
        Application.objects.create(
            client=client,
            source=data.get('source'),
            notes=data.get('notes', '')
        )
        return Response({'status': 'success'}, status=status.HTTP_201_CREATED)


# --- Views для Встреч ---
class MeetingListCreateView(generics.ListCreateAPIView):
    serializer_class = MeetingSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        client_id = self.request.query_params.get('client_id')
        if client_id:
            return Meeting.objects.filter(client_id=client_id).select_related(
                'client', 'creator', 'executor', 'interested_building'
            )
        return Meeting.objects.all().select_related(
            'client', 'creator', 'executor', 'interested_building'
        )

    def perform_create(self, serializer):
        serializer.save(creator=self.request.user)


class MeetingDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Meeting.objects.all()
    serializer_class = MeetingSerializer
    permission_classes = [IsAuthenticated]

    def perform_update(self, serializer):
        instance = serializer.save()
        MeetingLog.objects.create(
            meeting=instance,
            user=self.request.user,
            action="Встреча обновлена."
        )
class UserListView(generics.ListAPIView):
    queryset = User.objects.filter(is_active=True)
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
# --- Views для Встреч ---
class MeetingListCreateView(generics.ListCreateAPIView):
    serializer_class = MeetingSerializer
    permission_classes = [IsAuthenticated]
    filterset_class = MeetingFilter # <-- ДОБАВЬТЕ ЭТУ СТРОКУ

    def get_queryset(self):
        # Удаляем старую логику фильтрации, теперь это делает filterset_class
        return Meeting.objects.all().select_related(
            'client', 'creator', 'executor', 'interested_building'
        )

    def perform_create(self, serializer):
        serializer.save(creator=self.request.user)
