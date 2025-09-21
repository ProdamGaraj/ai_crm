from django.db import models
from django.conf import settings  # Используем для ссылки на модель User
from apps.realty.models import Property


class PreciseSource(models.Model):
    """ Точный источник (например, рекламная кампания) """
    name = models.CharField(max_length=200, unique=True, verbose_name="Название точного источника")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Дата создания")
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        verbose_name="Кем создан"
    )

    class Meta:
        verbose_name = "Точный источник"
        verbose_name_plural = "Точные источники"

    def __str__(self):
        return self.name

class RejectionReason(models.Model):
    class ReasonType(models.TextChoices):
        JUNK = 'JUNK', 'Нецелевая'
        REJECTED = 'REJECTED', 'Отказ'

    name = models.CharField(max_length=255, verbose_name="Причина")
    reason_type = models.CharField(max_length=10, choices=ReasonType.choices, verbose_name="Тип причины")
    reason_type = models.CharField(max_length=10, choices=ReasonType.choices, verbose_name="Тип причины")
    is_active = models.BooleanField(default=True, verbose_name="Активна")


class Application(models.Model):
    """ Заявка от клиента """

    class ApplicationStatus(models.TextChoices):
        NEW = 'NEW', 'Новая'
        IN_PROGRESS = 'IN_PROGRESS', 'В работе'
        JUNK = 'JUNK', 'Нецелевая'
        REJECTED = 'REJECTED', 'Отказ'
        CLOSED_WON = 'CLOSED_WON', 'Успешно закрыта'
        CLOSED_LOST = 'CLOSED_LOST', 'Неуспешно закрыта'

    class ApplicationSource(models.TextChoices):
        INTERNET = 'INTERNET', 'Интернет'
        SOCIAL_MEDIA = 'SOCIAL_MEDIA', 'Соц.сети'
        OFFICE = 'OFFICE', 'Офис'
        CALL = 'CALL', 'Звонок'

    # --- Основная информация ---
    client = models.ForeignKey('Client', on_delete=models.CASCADE, related_name='applications', verbose_name="Клиент")
    status = models.CharField(max_length=20, choices=ApplicationStatus.choices, default=ApplicationStatus.NEW,
                              verbose_name="Статус заявки")

    # --- Источник ---
    source = models.CharField(max_length=20, choices=ApplicationSource.choices, verbose_name="Источник")
    precise_source = models.ForeignKey('PreciseSource', on_delete=models.SET_NULL, null=True, blank=True,
                                       verbose_name="Точный источник")

    # --- Интересы клиента ---
    interested_projects = models.ManyToManyField('realty.Project', blank=True, verbose_name="Интересующие проекты")
    interested_property_type = models.CharField(
        max_length=20,
        choices=Property.PropertyType.choices,
        blank=True,
        verbose_name="Интересующий тип недвижимости"
    )
    min_area = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True,
                                   verbose_name="Площадь от (кв.м)")
    max_area = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True,
                                   verbose_name="Площадь до (кв.м)")
    min_floor = models.IntegerField(null=True, blank=True, verbose_name="Этаж от")
    max_floor = models.IntegerField(null=True, blank=True, verbose_name="Этаж до")

    # --- Причина отказа/нецелевой ---
    rejection_reason = models.ForeignKey(
        'RejectionReason',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        verbose_name="Причина (отказ/нецелевая)"
    )

    # --- Прочее ---
    notes = models.TextField(blank=True, verbose_name="Комментарии")

    # --- Системные поля ---
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Дата создания")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Дата последнего изменения")
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name="Кем создана (менеджер)"
    )

    class Meta:
        verbose_name = "Заявка"
        verbose_name_plural = "Заявки"
        ordering = ['-created_at']

    def __str__(self):
        return f"Заявка №{self.id} от {self.client.full_name}"


class ApplicationLog(models.Model):
    """ Логирование изменений по заявке """
    application = models.ForeignKey(Application, on_delete=models.CASCADE, related_name="logs", verbose_name="Заявка")
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        verbose_name="Пользователь"
    )
    action = models.TextField(verbose_name="Совершенное действие")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Время")

    class Meta:
        verbose_name = "Лог заявки"
        verbose_name_plural = "Логи заявок"
        ordering = ['-created_at']

    def __str__(self):
        return f"Лог для заявки №{self.application.id} в {self.created_at.strftime('%Y-%m-%d %H:%M')}"








class Client(models.Model):
    """ Клиент """

    class Gender(models.TextChoices):
        MALE = 'MALE', 'Мужской'
        FEMALE = 'FEMALE', 'Женский'

    class MaritalStatus(models.TextChoices):
        SINGLE = 'SINGLE', 'Холост/Не замужем'
        MARRIED = 'MARRIED', 'Женат/Замужем'
        DIVORCED = 'DIVORCED', 'В разводе'
        WIDOWED = 'WIDOWED', 'Вдовец/Вдова'

    # --- Основная информация ---
    full_name = models.CharField(max_length=255, verbose_name="Полное имя")
    phone_number = models.CharField(max_length=20, unique=True, verbose_name="Номер телефона")
    email = models.EmailField(unique=True, blank=True, null=True, verbose_name="Email")
    date_of_birth = models.DateField(blank=True, null=True, verbose_name="Дата рождения")
    gender = models.CharField(max_length=10, choices=Gender.choices, blank=True, verbose_name="Пол")
    marital_status = models.CharField(max_length=10, choices=MaritalStatus.choices, blank=True,
                                      verbose_name="Семейный статус")

    # --- Паспортные данные ---
    passport_series_number = models.CharField(max_length=20, blank=True, verbose_name="Номер и серия паспорта")
    passport_issued_by = models.CharField(max_length=255, blank=True, verbose_name="Кем выдан паспорт")
    passport_issued_date = models.DateField(blank=True, null=True, verbose_name="Когда выдан паспорт")
    pinfl = models.CharField(max_length=14, blank=True, verbose_name="ПИНФЛ")
    registration_address = models.TextField(blank=True, verbose_name="Адрес регистрации")

    # --- Связи ---
    relatives = models.ManyToManyField('self', blank=True, verbose_name="Родственники")

    # --- Системные поля ---
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Дата создания")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Дата последнего изменения")
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_clients',
        verbose_name="Создатель"
    )

    class Meta:
        verbose_name = "Клиент"
        verbose_name_plural = "Клиенты"
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.full_name} ({self.phone_number})"


class ClientLog(models.Model):
    """ Логирование изменений по клиенту """
    client = models.ForeignKey(Client, on_delete=models.CASCADE, related_name="logs", verbose_name="Клиент")
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        verbose_name="Пользователь"
    )
    action = models.TextField(verbose_name="Совершенное действие")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Время")

    class Meta:
        verbose_name = "Лог клиента"
        verbose_name_plural = "Логи клиентов"
        ordering = ['-created_at']

    def __str__(self):
        return f"Лог для {self.client} в {self.created_at.strftime('%Y-%m-%d %H:%M')}"

