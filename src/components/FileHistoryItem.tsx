
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Download, File, Trash } from 'lucide-react';
import { formatFileSize, getFileIcon } from '@/services/fileUtils';
import { FileHistoryEntry } from '@/types/fileTypes';

interface FileHistoryItemProps {
  file: FileHistoryEntry;
  onDownload: (file: FileHistoryEntry) => void;
  onDelete: (fileId: string) => void;
}

const FileHistoryItem: React.FC<FileHistoryItemProps> = ({ file, onDownload, onDelete }) => {
  // Format timestamp to readable date and time
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString();
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const IconComponent = getFileIcon(file.type);

  return (
    <Card className="w-full border border-border shadow-sm hover:shadow transition-shadow duration-200">
      <CardContent className="p-4">
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mr-4">
            <File className="w-5 h-5 text-primary" />
          </div>
          
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium truncate mb-1" title={file.name}>
              {file.name}
            </h4>
            
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <div className="flex items-center">
                <Calendar className="w-3 h-3 mr-1" />
                {formatDate(file.timestamp)}
              </div>
              
              <div className="flex items-center">
                <Clock className="w-3 h-3 mr-1" />
                {formatTime(file.timestamp)}
              </div>
              
              <div>
                {formatFileSize(file.size)}
              </div>
            </div>
          </div>
          
          <div className="flex space-x-1 ml-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 rounded-full text-primary"
              onClick={() => onDownload(file)}
              title="Download"
            >
              <Download className="w-4 h-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 rounded-full text-muted-foreground hover:text-destructive"
              onClick={() => onDelete(file.id)}
              title="Delete"
            >
              <Trash className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FileHistoryItem;
