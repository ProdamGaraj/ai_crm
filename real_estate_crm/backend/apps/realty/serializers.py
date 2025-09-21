# backend/apps/realty/serializers.py

from rest_framework import serializers
from .models import Project, Building, BuildingType # Добавьте нужные импорты
from .models import Property
# Сериализатор для типа дома (для вложенности)
class BuildingTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = BuildingType
        fields = ['id', 'name']

# Сериализатор для дома
class BuildingSerializer(serializers.ModelSerializer):
    building_type = BuildingTypeSerializer(read_only=True)
    building_type_id = serializers.IntegerField(write_only=True)

    class Meta:
        model = Building
        fields = '__all__'
        read_only_fields = ['created_by', 'updated_by', 'created_at', 'updated_at', 'project']

# Сериализатор для списка проектов (краткий)
class ProjectListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = ['id', 'name', 'address', 'created_at']

# Сериализатор для детальной карточки проекта (полный, с вложенными домами)
class ProjectDetailSerializer(serializers.ModelSerializer):
    buildings = BuildingSerializer(many=True, read_only=True)

    class Meta:
        model = Project
        fields = '__all__'
        read_only_fields = ['created_by', 'updated_by', 'created_at', 'updated_at']
# Новый сериализатор для списка объектов внутри дома
class PropertyListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Property
        fields = ['id', 'unit_number', 'property_type', 'status', 'area', 'price']
# Обновляем BuildingSerializer, чтобы он стал детальным
class BuildingSerializer(serializers.ModelSerializer):
    building_type = BuildingTypeSerializer(read_only=True)
    building_type_id = serializers.IntegerField(write_only=True)
    # Добавляем вложенный список объектов
    properties = PropertyListSerializer(many=True, read_only=True)
    project = ProjectListSerializer(read_only=True)

    class Meta:
        model = Building
        fields = '__all__'
        read_only_fields = ['created_by', 'updated_by', 'created_at', 'updated_at', 'project']