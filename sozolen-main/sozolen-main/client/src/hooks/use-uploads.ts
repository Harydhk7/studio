import { useMutation } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { getApiUrl } from "@/lib/api-base";
import { getAuthHeaders } from "@/lib/auth";

export function useUploadFile() {
  return useMutation({
    mutationFn: async (input: File | { file: File; folder?: string }) => {
      const file = input instanceof File ? input : input.file;
      const folder = input instanceof File ? undefined : input.folder;
      const formData = new FormData();
      formData.append("image", file);
      if (folder?.trim()) {
        formData.append("folder", folder.trim());
      }
      
      const res = await fetch(getApiUrl(api.uploads.create.path), {
        method: "POST",
        body: formData,
      });
      
      if (!res.ok) throw new Error("Failed to upload file");
      return api.uploads.create.responses[201].parse(await res.json());
    },
  });
}

export function useDeleteUpload() {
  return useMutation({
    mutationFn: async (url: string) => {
      const validated = api.uploads.delete.input.parse({ url });
      const res = await fetch(getApiUrl(api.uploads.delete.path), {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(validated),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete upload");
      return api.uploads.delete.responses[200].parse(await res.json());
    },
  });
}
