import { getApiBaseUrl } from "./chatApi";

export interface ProjectFileRow {
  id: string;
  project_id: string;
  file_name: string;
  created_at: string;
}

export async function fetchProjectFiles(projectId: string, accessToken: string): Promise<ProjectFileRow[]> {
  const base = getApiBaseUrl();
  if (!base) throw new Error("API URL not configured");
  
  const res = await fetch(`${base}/api/projects/${projectId}/files`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error("Failed to fetch project files");
  return res.json();
}

export async function uploadProjectFile(projectId: string, file: File, accessToken: string): Promise<ProjectFileRow> {
  const base = getApiBaseUrl();
  if (!base) throw new Error("API URL not configured");
  
  const formData = new FormData();
  formData.append("file", file);
  
  const res = await fetch(`${base}/api/projects/${projectId}/files`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: formData,
  });
  
  if (!res.ok) {
    let errorMsg = "Failed to upload file";
    try {
      const data = await res.json();
      if (data.detail) errorMsg = data.detail;
    } catch (e) {}
    throw new Error(errorMsg);
  }
  return res.json();
}

export async function deleteProjectFile(projectId: string, fileId: string, accessToken: string): Promise<void> {
  const base = getApiBaseUrl();
  if (!base) throw new Error("API URL not configured");
  
  const res = await fetch(`${base}/api/projects/${projectId}/files/${fileId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error("Failed to delete project file");
}
