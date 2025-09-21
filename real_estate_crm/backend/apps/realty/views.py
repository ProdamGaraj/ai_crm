import pandas as pd
import io
from django.http import HttpResponse

from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser

from .models import Project, Building, BuildingType, Property
from .serializers import (
    ProjectListSerializer, ProjectDetailSerializer,
    BuildingSerializer, BuildingTypeSerializer
)

# --- Views для Проектов ---
class ProjectListView(generics.ListCreateAPIView):
    queryset = Project.objects.all()
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return ProjectDetailSerializer
        return ProjectListSerializer

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

class ProjectDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Project.objects.all()
    serializer_class = ProjectDetailSerializer
    permission_classes = [IsAuthenticated]

# --- Views для Домов ---
class BuildingCreateView(generics.CreateAPIView):
    queryset = Building.objects.all()
    serializer_class = BuildingSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        project = Project.objects.get(pk=self.kwargs['project_pk'])
        serializer.save(created_by=self.request.user, project=project)

class BuildingDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = BuildingSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Building.objects.filter(project_id=self.kwargs['project_pk'])

# --- Views для Типов Домов ---
class BuildingTypeListView(generics.ListCreateAPIView):
    queryset = BuildingType.objects.all()
    serializer_class = BuildingTypeSerializer
    permission_classes = [IsAuthenticated]

class BuildingTypeDetailView(generics.DestroyAPIView):
    queryset = BuildingType.objects.all()
    serializer_class = BuildingTypeSerializer
    permission_classes = [IsAuthenticated]

# --- Views для Excel ---
class PropertyTemplateDownloadView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        header_map = {
            'unit_number': 'Номер объекта', 'floor': 'Этаж', 'entrance': 'Подъезд',
            'riser': 'Стояк', 'area': 'Площадь (кв.м)', 'price': 'Стоимость',
            'property_type': 'Тип объекта', 'status': 'Статус',
            'layout_name': 'Название планировки',
            'has_finishing': 'Наличие отделки (TRUE/FALSE)', 'description': 'Описание',
        }
        df = pd.DataFrame(columns=header_map.keys())
        df.rename(columns=header_map, inplace=True)
        property_types = [pt[0] for pt in Property.PropertyType.choices]
        statuses = [st[0] for st in Property.PropertyStatus.choices]
        max_len = max(len(property_types), len(statuses))
        property_types.extend([None] * (max_len - len(property_types)))
        statuses.extend([None] * (max_len - len(statuses)))
        hints_df = pd.DataFrame({
            'Допустимые значения для "Тип объекта"': property_types,
            'Допустимые значения для "Статус"': statuses
        })
        output = io.BytesIO()
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            df.to_excel(writer, index=False, sheet_name='Объекты для загрузки')
            hints_df.to_excel(writer, index=False, sheet_name='Подсказки')
        output.seek(0)
        response = HttpResponse(
            output, content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        response['Content-Disposition'] = 'attachment; filename="property_template.xlsx"'
        return response


class PropertyUploadView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser]

    def post(self, request, project_pk, building_pk, format=None):
        file_obj = request.FILES.get('file')
        if not file_obj:
            return Response({'error': 'Файл не найден'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            df = pd.read_excel(file_obj)
            building = Building.objects.get(pk=building_pk, project_id=project_pk)

            # --- ИСПРАВЛЕНИЕ: Создаем словари для "перевода" ---
            # Получаем пары (системное_имя, русское_имя) из модели
            type_choices = dict(Property.PropertyType.choices)
            status_choices = dict(Property.PropertyStatus.choices)

            # Инвертируем их, чтобы получить {русское_имя: системное_имя}
            type_map = {v: k for k, v in type_choices.items()}
            status_map = {v: k for k, v in status_choices.items()}
            # Добавляем ваши значения из файла
            type_map['Квартира'] = 'APARTMENT'
            status_map['Подбор'] = 'AVAILABLE'  # Пример: "Подбор" соответствует статусу "Доступен"

            properties_to_create = []
            for index, row in df.iterrows():
                if row.isnull().all():
                    continue

                # --- ИСПРАВЛЕНИЕ: "Переводим" значения перед созданием объекта ---
                property_type_russian = row.get('Тип объекта', 'Квартира')
                status_russian = row.get('Статус', 'Доступен')

                # Используем .get() с запасным вариантом, чтобы избежать ошибок
                property_type_system = type_map.get(property_type_russian, 'APARTMENT')
                status_system = status_map.get(status_russian, 'AVAILABLE')

                properties_to_create.append(
                    Property(
                        building=building,
                        unit_number=row.get('Номер объекта'),
                        floor=row.get('Этаж'),
                        entrance=row.get('Подъезд'),
                        riser=row.get('Стояк'),
                        area=row.get('Площадь (кв.м)'),
                        price=row.get('Стоимость'),
                        # Используем системные значения
                        property_type=property_type_system,
                        status=status_system,
                        layout_name=row.get('Название планировки'),
                        has_finishing=row.get('Наличие отделки (TRUE/FALSE)', False),
                        description=row.get('Описание'),
                        created_by=request.user
                    )
                )

            Property.objects.bulk_create(properties_to_create)

            return Response({'status': f'Успешно загружено {len(properties_to_create)} объектов'},
                            status=status.HTTP_201_CREATED)

        except Exception as e:
            # Возвращаем более информативную ошибку
            return Response({'error': f"Произошла ошибка при обработке файла: {str(e)}"},
                            status=status.HTTP_400_BAD_REQUEST)