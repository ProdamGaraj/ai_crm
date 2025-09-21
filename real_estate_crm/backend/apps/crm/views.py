from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from .models import Client, Application, ClientLog
from .serializers import (
    ClientListSerializer, ClientDetailSerializer,
    ApplicationListSerializer
)
from .serializers import ApplicationListSerializer, ApplicationDetailSerializer
from .serializers import PublicApplicationSerializer
from rest_framework.response import Response
from rest_framework import status
from .models import ApplicationLog, RejectionReason # <-- Импорты
from .serializers import ApplicationLogSerializer, RejectionReasonSerializer # <-- Импорты


class RejectionReasonListView(generics.ListCreateAPIView):
    serializer_class = RejectionReasonSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = RejectionReason.objects.filter(is_active=True)
        # Фильтруем по параметру 'type' в URL, например /api/rejection-reasons/?type=JUNK
        reason_type = self.request.query_params.get('type')
        if reason_type:
            queryset = queryset.filter(reason_type=reason_type)
        return queryset


class ClientListView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]
    queryset = Client.objects.all()

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return ClientDetailSerializer
        return ClientListSerializer

    def perform_create(self, serializer):
        instance = serializer.save(created_by=self.request.user)
        # ИСПРАВЛЕНО: Создаем лог для Клиента (ClientLog)
        ClientLog.objects.create(
            client=instance,
            user=self.request.user,
            action=f"Клиент создан."
        )


class ClientDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated]
    queryset = Client.objects.all()
    serializer_class = ClientDetailSerializer

    def perform_update(self, serializer):
        old_instance = self.get_object()
        old_data = self.get_serializer(old_instance).data

        instance = serializer.save()

        changes = []
        for key, value in old_data.items():
            new_value = self.get_serializer(instance).data.get(key)
            if value != new_value and key not in ['updated_at', 'logs']:
                changes.append(f"Поле '{key}' изменено с '{value}' на '{new_value}'")

        if changes:
            action_text = "Заявка обновлена. " + "; ".join(changes)
            ApplicationLog.objects.create(
                application=instance,
                user=self.request.user,
                action=action_text
            )


# --- ДОБАВЬТЕ ЭТОТ КЛАСС ---
class ApplicationListView(generics.ListCreateAPIView):
    queryset = Application.objects.select_related('client', 'precise_source', 'created_by').all()
    permission_classes = [IsAuthenticated]

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
        # Получаем данные объекта ДО сохранения
        old_instance = self.get_object()
        # Используем сериализатор, чтобы получить данные в удобном виде (с именами, а не ID)
        old_data = self.get_serializer(old_instance).data

        # Сохраняем новые данные
        instance = serializer.save()
        # Получаем новые данные ПОСЛЕ сохранения
        new_data = self.get_serializer(instance).data

        # Сравниваем старые и новые данные, чтобы сформировать текст для лога
        changes = []
        for key in old_data:
            # Сравниваем значения по ключу
            if old_data[key] != new_data[key]:
                # Исключаем системные поля, которые нам не интересны
                if key not in ['updated_at', 'logs', 'client']:
                    # Формируем красивую строку об изменении
                    old_value = old_data[key] or "пусто"
                    new_value = new_data[key] or "пусто"
                    changes.append(f"Поле '{key}' изменено с '{old_value}' на '{new_value}'")

        # Если были изменения, создаем запись в логе
        if changes:
            action_text = "Заявка обновлена. " + "; ".join(changes)
            ApplicationLog.objects.create(
                application=instance,
                user=self.request.user,
                action=action_text
            )


class PublicApplicationCreateView(generics.CreateAPIView):
    """
    Публичный эндпоинт для создания заявок с сайта.
    Не требует аутентификации.
    """
    serializer_class = PublicApplicationSerializer
    # Убираем проверку аутентификации для этого view
    permission_classes = []

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        phone_number = data.get('phone_number')

        # Логика "Найти или Создать"
        # defaults - это поля, которые будут установлены, если клиент создается
        client, created = Client.objects.get_or_create(
            phone_number=phone_number,
            defaults={'full_name': data.get('full_name', '')}
        )

        # Если клиент уже существовал, но имя в заявке новое - можем его обновить
        if not created and data.get('full_name') and client.full_name != data.get('full_name'):
            client.full_name = data.get('full_name')
            client.save()

        # Создаем заявку и привязываем к найденному или новому клиенту
        Application.objects.create(
            client=client,
            source=data.get('source'),
            notes=data.get('notes', '')
            # creator остается пустым (NULL), т.к. заявка от системы
        )

        return Response({'status': 'success'}, status=status.HTTP_201_CREATED)