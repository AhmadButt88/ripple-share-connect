
export interface FileHistoryEntry {
  id: string;
  name: string;
  type: string;
  size: number;
  data: Blob;
  timestamp: number;
  direction: 'sent' | 'received';
}

export interface ActiveTransfer {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  progress: number;
  status: 'sending' | 'receiving' | 'completed' | 'error';
}
