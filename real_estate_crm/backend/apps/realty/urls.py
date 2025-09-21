from django.urls import path
from .views import (
    ProjectListView,
    ProjectDetailView,
    BuildingCreateView,
    BuildingDetailView,  # <-- ДОБАВЬТЕ ЭТОТ ИМПОРТ
    BuildingTypeListView,
    BuildingTypeDetailView
)
from .views import PropertyTemplateDownloadView, PropertyUploadView
urlpatterns = [
    # Projects
    path('projects/', ProjectListView.as_view(), name='project-list'),
    path('projects/<int:pk>/', ProjectDetailView.as_view(), name='project-detail'),

    # Buildings (nested under projects)
    path('projects/<int:project_pk>/buildings/', BuildingCreateView.as_view(), name='building-create'),
    path('projects/<int:project_pk>/buildings/<int:pk>/', BuildingDetailView.as_view(), name='building-detail'),

    # Building Types
    path('building-types/', BuildingTypeListView.as_view(), name='building-type-list'),
    path('building-types/<int:pk>/', BuildingTypeDetailView.as_view(), name='building-type-detail'),
    path('properties/download-template/', PropertyTemplateDownloadView.as_view(), name='property-template-download'),
    # Маршрут для загрузки (вложен в проект и дом)
    path('projects/<int:project_pk>/buildings/<int:building_pk>/upload-properties/', PropertyUploadView.as_view(), name='property-upload'),
]