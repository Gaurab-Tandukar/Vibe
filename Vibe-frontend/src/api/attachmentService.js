import axiosInstance from "./axiosInstance";

export const uploadAttachment = async (file, { onUploadProgress } = {}) => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await axiosInstance.post("/attachments/upload", formData, {
    onUploadProgress,
  });
  return response.data; // { fileUrl, fileType, fileName, fileSize }
};
