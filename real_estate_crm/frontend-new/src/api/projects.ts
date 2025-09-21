// src/api/projects.ts
import apiClient from './axios';

export interface Building { /* ... опишите поля модели Building ... */ }
export interface Project { id: number; name: string; address: string; /* ... */ }
export interface ProjectDetail extends Project { buildings: Building[]; /* ... */ }
export type ProjectPayload = Omit<Project, 'id' | 'created_at' /* ... */>;
export interface BuildingType { id: number; name: string; }

export const getProjects = async (): Promise<Project[]> => {
  return (await apiClient.get('/projects/')).data;
};
export const getProjectById = async (id: number): Promise<ProjectDetail> => {
  return (await apiClient.get(`/projects/${id}/`)).data;
};
export const createProject = async (payload: ProjectPayload): Promise<Project> => {
  return (await apiClient.post('/projects/', payload)).data;
};
// Функция для создания дома
export const createBuilding = async ({ projectId, payload }: { projectId: number; payload: any }): Promise<Building> => {
  return (await apiClient.post(`/projects/${projectId}/buildings/`, payload)).data;
};
export const getBuildingTypes = async (): Promise<BuildingType[]> => {
  return (await apiClient.get('/building-types/')).data;
};