
/**
 * Utility functions for file operations
 */

// Format file size to human readable format
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

// Get file icon based on MIME type
export function getFileIcon(mimeType: string): string {
  if (mimeType.startsWith("image/")) {
    return "file-image";
  } else if (mimeType.startsWith("video/")) {
    return "file-video";
  } else if (mimeType.startsWith("audio/")) {
    return "file-audio";
  } else if (
    mimeType === "application/pdf" ||
    mimeType === "text/plain" ||
    mimeType.includes("document") ||
    mimeType.includes("text")
  ) {
    return "file-text";
  } else if (
    mimeType.includes("zip") || 
    mimeType.includes("compressed") ||
    mimeType.includes("archive")
  ) {
    return "file-archive";
  } else {
    return "file";
  }
}

// Download a file
export function downloadFile(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Generate a thumbnail for an image file
export async function generateThumbnail(file: File): Promise<string | null> {
  if (!file.type.startsWith("image/")) return null;
  
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      resolve(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  });
}

// Generate a unique file ID
export function generateFileId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

// Get extension from file name
export function getFileExtension(fileName: string): string {
  return fileName.split(".").pop()?.toLowerCase() || "";
}
