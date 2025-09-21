import apiClient from './axios';

export const uploadProperties = async ({ projectId, buildingId, file }: { projectId: number; buildingId: number; file: File }): Promise<any> => {
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

// URL для скачивания шаблона
export const getPropertyTemplateUrl = (): string => {
    return `${apiClient.defaults.baseURL}/properties/download-template/`;
}
export const getBuildingById = async ({ projectId, buildingId }: { projectId: number; buildingId: number }): Promise<BuildingDetail> => {
  const response = await apiClient.get(`/projects/${projectId}/buildings/${buildingId}/`);
  return response.data;
};
