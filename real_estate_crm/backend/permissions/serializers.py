"""
Serializers для системы разрешений
"""
from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Company, Department, Permission, Role, UserProfile, PermissionLog


class CompanySerializer(serializers.ModelSerializer):
    departments_count = serializers.SerializerMethodField()
    employees_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Company
        fields = [
            'id', 'name', 'code', 'description', 'is_active',
            'departments_count', 'employees_count',
            'created_at', 'updated_at'
        ]
    
    def get_departments_count(self, obj):
        return obj.departments.filter(is_active=True).count()
    
    def get_employees_count(self, obj):
        return obj.employees.filter(is_active=True).count()


class DepartmentSerializer(serializers.ModelSerializer):
    company_name = serializers.CharField(source='company.name', read_only=True)
    parent_department_name = serializers.CharField(
        source='parent_department.name',
        read_only=True,
        allow_null=True
    )
    employees_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Department
        fields = [
            'id', 'company', 'company_name', 'name', 'code', 'description',
            'parent_department', 'parent_department_name',
            'employees_count', 'is_active',
            'created_at', 'updated_at'
        ]
    
    def get_employees_count(self, obj):
        return obj.employees.filter(is_active=True).count()


class PermissionSerializer(serializers.ModelSerializer):
    action_display = serializers.CharField(source='get_action_display', read_only=True)
    resource_display = serializers.CharField(source='get_resource_display', read_only=True)
    scope_display = serializers.CharField(source='get_scope_display', read_only=True)
    
    class Meta:
        model = Permission
        fields = [
            'id', 'code', 'name', 'description',
            'action', 'action_display',
            'resource', 'resource_display',
            'scope', 'scope_display',
            'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['code', 'name']


class RoleListSerializer(serializers.ModelSerializer):
    level_display = serializers.CharField(source='get_level_display', read_only=True)
    permissions_count = serializers.SerializerMethodField()
    users_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Role
        fields = [
            'id', 'name', 'code', 'description',
            'level', 'level_display',
            'permissions_count', 'users_count',
            'is_system', 'is_active',
            'created_at', 'updated_at'
        ]
    
    def get_permissions_count(self, obj):
        return obj.permissions.filter(is_active=True).count()
    
    def get_users_count(self, obj):
        return obj.user_profiles.filter(is_active=True).count()


class RoleDetailSerializer(serializers.ModelSerializer):
    level_display = serializers.CharField(source='get_level_display', read_only=True)
    permissions = PermissionSerializer(many=True, read_only=True)
    permission_ids = serializers.PrimaryKeyRelatedField(
        many=True,
        write_only=True,
        queryset=Permission.objects.all(),
        source='permissions'
    )
    companies = CompanySerializer(many=True, read_only=True)
    company_ids = serializers.PrimaryKeyRelatedField(
        many=True,
        write_only=True,
        queryset=Company.objects.all(),
        source='companies',
        required=False
    )
    created_by_name = serializers.CharField(
        source='created_by.get_full_name',
        read_only=True,
        allow_null=True
    )
    
    class Meta:
        model = Role
        fields = [
            'id', 'name', 'code', 'description',
            'level', 'level_display',
            'permissions', 'permission_ids',
            'companies', 'company_ids',
            'is_system', 'is_active',
            'created_at', 'updated_at',
            'created_by', 'created_by_name'
        ]
        read_only_fields = ['created_at', 'updated_at', 'created_by']
    
    def validate(self, data):
        # Системные роли не могут быть изменены через API
        if self.instance and self.instance.is_system:
            raise serializers.ValidationError(
                "Системные роли не могут быть изменены"
            )
        return data


class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'email', 'full_name']
    
    def get_full_name(self, obj):
        return obj.get_full_name() or obj.username


class UserProfileListSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    company_name = serializers.CharField(source='company.name', read_only=True, allow_null=True)
    department_name = serializers.CharField(source='department.name', read_only=True, allow_null=True)
    roles_names = serializers.SerializerMethodField()
    
    class Meta:
        model = UserProfile
        fields = [
            'id', 'user', 'company', 'company_name',
            'department', 'department_name',
            'roles_names', 'position', 'phone',
            'is_system_admin', 'is_active',
            'created_at', 'updated_at'
        ]
    
    def get_roles_names(self, obj):
        return [role.name for role in obj.roles.filter(is_active=True)]


class UserProfileDetailSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    company = CompanySerializer(read_only=True)
    department = DepartmentSerializer(read_only=True)
    roles = RoleListSerializer(many=True, read_only=True)
    
    company_id = serializers.PrimaryKeyRelatedField(
        queryset=Company.objects.all(),
        source='company',
        write_only=True,
        required=False,
        allow_null=True
    )
    department_id = serializers.PrimaryKeyRelatedField(
        queryset=Department.objects.all(),
        source='department',
        write_only=True,
        required=False,
        allow_null=True
    )
    role_ids = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=Role.objects.all(),
        source='roles',
        write_only=True,
        required=False
    )
    
    all_permissions = serializers.SerializerMethodField()
    
    class Meta:
        model = UserProfile
        fields = [
            'id', 'user', 'company', 'company_id',
            'department', 'department_id',
            'roles', 'role_ids',
            'position', 'phone', 'avatar',
            'is_system_admin', 'is_active',
            'all_permissions',
            'created_at', 'updated_at'
        ]
    
    def get_all_permissions(self, obj):
        permissions = obj.get_all_permissions()
        return PermissionSerializer(permissions, many=True).data
    
    def validate(self, data):
        # Проверяем что отдел принадлежит компании
        department = data.get('department')
        company = data.get('company')
        
        if department and company:
            if department.company != company:
                raise serializers.ValidationError(
                    "Отдел должен принадлежать выбранной компании"
                )
        
        return data


class PermissionLogSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(
        source='user.get_full_name',
        read_only=True,
        allow_null=True
    )
    
    class Meta:
        model = PermissionLog
        fields = [
            'id', 'user', 'user_name', 'action',
            'entity_type', 'entity_id', 'details',
            'ip_address', 'created_at'
        ]
        read_only_fields = fields


class UserPermissionCheckSerializer(serializers.Serializer):
    """
    Serializer для проверки разрешений пользователя
    """
    action = serializers.ChoiceField(choices=Permission.Action.choices)
    resource = serializers.ChoiceField(choices=Permission.Resource.choices)
    scope = serializers.ChoiceField(
        choices=Permission.Scope.choices,
        required=False
    )
    object_id = serializers.IntegerField(required=False, allow_null=True)


class BulkPermissionAssignSerializer(serializers.Serializer):
    """
    Serializer для массового назначения разрешений роли
    """
    role_id = serializers.IntegerField()
    permission_ids = serializers.ListField(
        child=serializers.IntegerField(),
        allow_empty=False
    )
    action = serializers.ChoiceField(choices=['add', 'remove', 'set'])
    
    def validate_role_id(self, value):
        try:
            role = Role.objects.get(id=value)
            if role.is_system:
                raise serializers.ValidationError(
                    "Нельзя изменять разрешения системных ролей"
                )
            return value
        except Role.DoesNotExist:
            raise serializers.ValidationError("Роль не найдена")
    
    def validate_permission_ids(self, value):
        existing_ids = Permission.objects.filter(
            id__in=value,
            is_active=True
        ).values_list('id', flat=True)
        
        invalid_ids = set(value) - set(existing_ids)
        if invalid_ids:
            raise serializers.ValidationError(
                f"Разрешения с ID {invalid_ids} не найдены или неактивны"
            )
        
        return value
