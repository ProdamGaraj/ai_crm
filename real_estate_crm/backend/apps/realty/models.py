from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator


class Project(models.Model):
    """ Проект (Жилой комплекс) """
    # --- Основная информация ---
    name = models.CharField(max_length=200, verbose_name="Название проекта")
    address = models.CharField(max_length=255, verbose_name="Адрес")
    description = models.TextField(blank=True, verbose_name="Описание")
    logo = models.ImageField(upload_to='projects/logos/', blank=True, null=True, verbose_name="Логотип")

    # --- УТП ---
    usp_1 = models.TextField(blank=True, verbose_name="УТП 1")
    usp_2 = models.TextField(blank=True, verbose_name="УТП 2")
    usp_3 = models.TextField(blank=True, verbose_name="УТП 3")

    # --- Характеристики ---
    min_floors = models.PositiveIntegerField(blank=True, null=True, verbose_name="Этажность (мин)")
    max_floors = models.PositiveIntegerField(blank=True, null=True, verbose_name="Этажность (макс)")

    # --- Юридическая информация ---
    developer_details = models.TextField(blank=True, verbose_name="Реквизиты застройщика")

    # --- Системные поля (Логи) ---
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Дата создания")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Дата последнего изменения")
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_projects',
        verbose_name="Кем создан"
    )
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='updated_projects',
        verbose_name="Кем изменен"
    )

    class Meta:
        verbose_name = "Проект"
        verbose_name_plural = "Проекты"
        ordering = ['-created_at']

    def __str__(self):
        return self.name

class ProjectImage(models.Model):
    """ Фотография для галереи проекта """
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='gallery_images', verbose_name="Проект")
    image = models.ImageField(upload_to='projects/gallery/', verbose_name="Изображение")
    caption = models.CharField(max_length=255, blank=True, verbose_name="Подпись к фото")

    class Meta:
        verbose_name = "Фотография проекта"
        verbose_name_plural = "Галерея проекта"

    def __str__(self):
        return f"Фото для {self.project.name}"

class BuildingType(models.Model):
    """ Тип дома (например, Монолитный, Кирпичный) """
    name = models.CharField(max_length=100, unique=True, verbose_name="Название типа")

    class Meta:
        verbose_name = "Тип дома"
        verbose_name_plural = "Типы домов"

    def __str__(self):
        return self.name

class Building(models.Model):
    """ Дом/Корпус в рамках проекта """

    class BuildingStatus(models.TextChoices):
        UNDER_REVIEW = 'UNDER_REVIEW', 'На проверке'
        FOR_SALE = 'FOR_SALE', 'В продаже'
        COMPLETED = 'COMPLETED', 'Сдан'
        ARCHIVED = 'ARCHIVED', 'В архиве'

    project = models.ForeignKey(Project, related_name='buildings', on_delete=models.CASCADE, verbose_name="Проект")
    name = models.CharField(max_length=100, verbose_name="Название или номер дома/корпуса")
    address_detail = models.CharField(max_length=255, blank=True, verbose_name="Точный адрес дома")

    # --- Характеристики ---
    building_type = models.ForeignKey(BuildingType, on_delete=models.SET_NULL, null=True, blank=True,
                                      verbose_name="Тип дома")
    status = models.CharField(max_length=20, choices=BuildingStatus.choices, default=BuildingStatus.UNDER_REVIEW,
                              verbose_name="Статус дома")
    floors_count = models.PositiveIntegerField(verbose_name="Количество этажей")
    ceiling_height = models.DecimalField(max_digits=4, decimal_places=2, blank=True, null=True,
                                         verbose_name="Высота потолков (м)")
    material = models.CharField(max_length=100, blank=True, verbose_name="Материал")

    # --- УТП ---
    usp_1 = models.TextField(blank=True, verbose_name="УТП 1")
    usp_2 = models.TextField(blank=True, verbose_name="УТП 2")

    # --- Даты ---
    sales_start_date = models.DateField(blank=True, null=True, verbose_name="Дата старта продаж")
    cadastre_date_plan = models.DateField(blank=True, null=True, verbose_name="Дата кадастра (План)")
    cadastre_date_fact = models.DateField(blank=True, null=True, verbose_name="Дата кадастра (Факт)")

    # --- Связи ---
    discounts = models.ManyToManyField('Discount', blank=True, related_name="buildings", verbose_name="Скидки на дом")

    # --- Системные поля (Логи) ---
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Дата создания")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Дата последнего изменения")
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_buildings',
        verbose_name="Кем создан"
    )
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='updated_buildings',
        verbose_name="Кем изменен"
    )

    class Meta:
        verbose_name = "Дом"
        verbose_name_plural = "Дома"

    def __str__(self):
        return f"{self.project.name} - {self.name}"

class BuildingImage(models.Model):
    """ Фотография для галереи дома """
    building = models.ForeignKey(Building, on_delete=models.CASCADE, related_name='gallery_images', verbose_name="Дом")
    image = models.ImageField(upload_to='buildings/gallery/', verbose_name="Изображение")
    caption = models.CharField(max_length=255, blank=True, verbose_name="Подпись к фото")

    class Meta:
        verbose_name = "Фотография дома"
        verbose_name_plural = "Галерея дома"

    def __str__(self):
        return f"Фото для {self.building.name}"

class Property(models.Model):
    """ Объект недвижимости (конкретная единица) """

    class PropertyType(models.TextChoices):
        APARTMENT = 'APARTMENT', 'Квартира'
        COMMERCIAL = 'COMMERCIAL', 'Коммерция'
        PARKING = 'PARKING', 'Парковка'
        STORAGE = 'STORAGE', 'Кладовка'
        COTTAGE = 'COTTAGE', 'Коттедж'

    class PropertyStatus(models.TextChoices):
        AVAILABLE = 'AVAILABLE', 'В продаже'
        BOOKED = 'BOOKED', 'Забронировано'
        SOLD = 'SOLD', 'Продано'

    # --- Основная информация ---
    building = models.ForeignKey(Building, related_name='properties', on_delete=models.CASCADE, verbose_name="Дом")
    property_type = models.CharField(max_length=20, choices=PropertyType.choices, verbose_name="Тип объекта")
    status = models.CharField(max_length=20, choices=PropertyStatus.choices, default=PropertyStatus.AVAILABLE,
                              verbose_name="Статус")

    # --- Характеристики ---
    unit_number = models.CharField(max_length=20, verbose_name="Номер объекта")
    floor = models.IntegerField(verbose_name="Этаж")
    entrance = models.PositiveIntegerField(blank=True, null=True, verbose_name="Подъезд")
    riser = models.CharField(max_length=20, blank=True, verbose_name="Стояк")
    layout_name = models.CharField(max_length=100, blank=True, verbose_name="Наименование планировки")
    area = models.DecimalField(max_digits=8, decimal_places=2, verbose_name="Площадь (кв.м)")
    has_finishing = models.BooleanField(default=False, verbose_name="Наличие отделки")

    # --- Стоимость ---
    price = models.DecimalField(max_digits=12, decimal_places=2, verbose_name="Стоимость")

    # --- Описание ---
    description = models.TextField(blank=True, verbose_name="Описание")

    # --- Системные поля (Логи) ---
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Дата создания")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Дата последнего изменения")
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_properties',
        verbose_name="Кем создан"
    )
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='updated_properties',
        verbose_name="Кем изменен"
    )

    class Meta:
        verbose_name = "Объект недвижимости"
        verbose_name_plural = "Объекты недвижимости"
        unique_together = ('building', 'unit_number')
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.get_property_type_display()} {self.unit_number} в {self.building}"

    @property
    def price_per_sqm(self):
        """ Вычисляет и возвращает цену за квадратный метр. """
        if self.area and self.price and self.area > 0:
            return round(self.price / self.area, 2)
        return None  # Возвращаем None, если площадь или цена не указаны


class Discount(models.Model):
    """ Скидка """
    name = models.CharField(max_length=150, verbose_name="Название скидки")
    percentage_value = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        verbose_name="Значение в процентах (%)"
    )

    # --- Срок действия ---
    start_date = models.DateField(verbose_name="Дата начала действия")
    end_date = models.DateField(blank=True, null=True, verbose_name="Дата окончания действия (бессрочная, если пусто)")

    # --- Область применения ---
    properties = models.ManyToManyField('Property', blank=True, related_name='discounts',
                                        verbose_name="Конкретные объекты со скидкой")
    property_type = models.CharField(
        max_length=20,
        choices=Property.PropertyType.choices,
        blank=True,
        null=True,
        verbose_name="Тип недвижимости для скидки"
    )

    comment = models.TextField(blank=True, verbose_name="Комментарий")
    is_active = models.BooleanField(default=True, verbose_name="Активна")

    # --- Системные поля (Логи) ---
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Дата создания")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Дата последнего изменения")
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_discounts',
        verbose_name="Кем создана"
    )
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='updated_discounts',
        verbose_name="Кем изменена"
    )

    class Meta:
        verbose_name = "Скидка"
        verbose_name_plural = "Скидки"
        ordering = ['-start_date']

    def __str__(self):
        return f"{self.name} ({self.percentage_value}%)"
class BuildingLog(models.Model):
    """ Логирование изменений по дому """
    building = models.ForeignKey(Building, on_delete=models.CASCADE, related_name="logs")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    action = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)