from rest_framework import serializers
from .models import (
    Project, Building, BuildingType, Property, Layout, Discount, DiscountLog,
    BuildingLog, ProjectImage, BuildingImage
)


# --- "Листовые" сериализаторы (без зависимостей от других сериализаторов в этом файле) ---

class ProjectImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProjectImage
        fields = '__all__'
        read_only_fields = ['project']


class BuildingImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = BuildingImage
        fields = '__all__'
        read_only_fields = ['building']

class BuildingTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = BuildingType
        fields = ['id', 'name']


class BuildingMiniSerializer(serializers.ModelSerializer):
    class Meta:
        model = Building
        fields = ['id', 'name']


class LayoutMiniSerializer(serializers.ModelSerializer):
    class Meta:
        model = Layout
        fields = ['id', 'name', 'main_layout_image']


class LayoutSerializer(serializers.ModelSerializer):
    class Meta:
        model = Layout
        fields = '__all__'


class DiscountLogSerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField()

    class Meta:
        model = DiscountLog
        fields = ['id', 'user', 'action', 'created_at']


class BuildingLogSerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField()

    class Meta:
        model = BuildingLog
        fields = ['id', 'user', 'action', 'created_at']


# --- Сериализаторы Объектов (Property) ---

class PropertyListSerializer(serializers.ModelSerializer):
    layout = LayoutMiniSerializer(read_only=True)
    active_deal_id = serializers.SerializerMethodField() # <--- НОВОЕ ПОЛЕ

    class Meta:
        model = Property
        # Заменяем 'deal' на 'active_deal_id'
        fields = ['id', 'unit_number', 'property_type', 'status', 'area', 'price', 'floor', 'entrance', 'layout', 'description', 'active_deal_id']

    def get_active_deal_id(self, obj):
        """
        Ищет активную сделку (не отмененную/расторгнутую/завершенную) для этого объекта
        и возвращает ее ID.
        """
        active_statuses = [
            'BOOKING',
            'IN_PROGRESS',
            'CLOSED_WON'
        ]
        # Используем related_name 'deals', который мы задали в модели
        active_deal = obj.deals.filter(status__in=active_statuses).first()
        return active_deal.id if active_deal else None


class PropertyDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = Property
        fields = ['status', 'description']


# --- Сериализаторы Скидок (Discount) ---

class DiscountListSerializer(serializers.ModelSerializer):
    buildings_info = serializers.StringRelatedField(source='buildings', many=True, read_only=True)

    class Meta:
        model = Discount
        fields = ['id', 'name', 'percentage_value', 'property_type', 'start_date', 'end_date', 'buildings_info']


class DiscountDetailSerializer(serializers.ModelSerializer):
    buildings_info = serializers.StringRelatedField(source='buildings', many=True, read_only=True)
    logs = DiscountLogSerializer(many=True, read_only=True)

    class Meta:
        model = Discount
        fields = '__all__'
        read_only_fields = ['created_by', 'updated_by', 'created_at', 'updated_at']


# --- Сериализаторы Проектов (Project) ---

class ProjectListSerializer(serializers.ModelSerializer):
    buildings = BuildingMiniSerializer(many=True, read_only=True)

    class Meta:
        model = Project
        fields = ['id', 'name', 'address', 'created_at', 'buildings']


# --- "Составные" сериализаторы (зависят от определенных выше) ---

class BuildingSerializer(serializers.ModelSerializer):
    building_type = BuildingTypeSerializer(read_only=True)
    building_type_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    properties = PropertyListSerializer(many=True, read_only=True)
    project = ProjectListSerializer(read_only=True)
    logs = BuildingLogSerializer(many=True, read_only=True)
    gallery_images = BuildingImageSerializer(many=True, read_only=True) # <--- ДОБАВЛЕНО

    class Meta:
        model = Building
        fields = '__all__'
        read_only_fields = ['created_by', 'updated_by', 'created_at', 'updated_at']


class ProjectDetailSerializer(serializers.ModelSerializer):
    buildings = BuildingSerializer(many=True, read_only=True)
    gallery_images = ProjectImageSerializer(many=True, read_only=True)

    class Meta:
        model = Project
        fields = '__all__'
        read_only_fields = ['created_by', 'updated_by', 'created_at', 'updated_at']

