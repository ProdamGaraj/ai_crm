from django_filters import rest_framework as filters
from .models import Client
from django.contrib.auth.models import User


class ClientFilter(filters.FilterSet):
    # Фильтр по имени (по частичному совпадению без учета регистра)
    full_name = filters.CharFilter(field_name='full_name', lookup_expr='icontains')

    # Фильтр по номеру телефона (ищет в связанной модели)
    phone_number = filters.CharFilter(field_name='phone_numbers__phone_number', lookup_expr='icontains')

    # Фильтр по email
    email = filters.CharFilter(field_name='email', lookup_expr='icontains')

    # Фильтр по статусу (точное совпадение)
    status = filters.ChoiceFilter(choices=Client.ClientStatus.choices)

    # Фильтр по ИНН и ПИНФЛ
    inn = filters.CharFilter(field_name='inn', lookup_expr='icontains')
    pinfl = filters.CharFilter(field_name='pinfl', lookup_expr='icontains')

    # Фильтр по дате создания "от"
    created_at_after = filters.DateFilter(field_name='created_at', lookup_expr='date__gte')

    # Фильтр по дате создания "до"
    created_at_before = filters.DateFilter(field_name='created_at', lookup_expr='date__lte')

    # Фильтр по ответственному менеджеру
    created_by = filters.ModelChoiceFilter(
        queryset=User.objects.all(),
        field_name='created_by',
        to_field_name='id'  # Фильтруем по ID пользователя
    )

    class Meta:
        model = Client
        # Указываем все поля, по которым можно будет фильтровать
        fields = [
            'full_name',
            'phone_number',
            'email',
            'status',
            'inn',
            'pinfl',
            'created_at_after',
            'created_at_before',
            'created_by'
        ]