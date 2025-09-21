import apiClient from './axios';

/**
 * Минимальный интерфейс для планировки,
 * используемый внутри объекта недвижимости.
 */
export interface LayoutMini {
  id: number;
  name: string;
  main_layout_image: string | null;
}

/**
 * Интерфейс для объекта недвижимости (квартира, паркинг и т.д.).
 */
export interface Property {
  id: number;
  unit_number: string;
  property_type: string;
  status: string;
  area: number;
  price: number;
  floor: number;
  entrance: number;
  layout: LayoutMini | null;
  description: string | null;
  deal: number | null; // ID связанной сделки, если она есть
}

/**
 * Минимальный интерфейс для проекта,
 * используемый внутри карточки дома.
 */
export interface ProjectMini {
  id: number;
  name: string;
}

/**
 * Полный интерфейс для детальной карточки дома.
 */
export interface BuildingDetail {
  id: number;
  name: string;
  project: ProjectMini; // Вложенный объект проекта
  properties: Property[]; // Массив объектов в этом доме
  // Добавьте сюда другие поля из BuildingSerializer по мере необходимости
}

/**
* Получает детальную информацию об одном доме по его ID.
* @param projectId - ID проекта
* @param buildingId - ID дома
* @returns - Объект с детальной информацией о доме.
*/
export const getBuildingById = async ({ projectId, buildingId }: { projectId: number; buildingId: number }): Promise<BuildingDetail> => {
  const response = await apiClient.get(`/projects/${projectId}/buildings/${buildingId}/`);
  return response.data;
};

/**
* Загружает Excel-файл с объектами недвижимости на сервер.
* @param projectId - ID проекта
* @param buildingId - ID дома
* @param file - Загружаемый файл
* @returns - Ответ сервера со статусом загрузки.
*/
export const uploadProperties = async ({ projectId, buildingId, file }: { projectId: number; buildingId: number; file: File }): Promise<{ status: string }> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await apiClient.post(
    `/projects/${projectId}/buildings/${buildingId}/upload-properties/`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  return response.data;
};

/**
 * Формирует URL для скачивания шаблона Excel для объектов.
 * @param projectId - ID проекта
 * @param buildingId - ID дома
 * @returns - Полный URL для скачивания.
 */
export const getPropertyTemplateUrl = (projectId: number, buildingId: number): string => {
  return `${apiClient.defaults.baseURL}/projects/${projectId}/buildings/${buildingId}/download-template/`;
};

