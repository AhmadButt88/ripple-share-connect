
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { File, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatFileSize, getFileIcon } from '@/services/fileUtils';

interface TransferProgressProps {
  fileName: string;
  fileType: string;
  fileSize: number;
  progress: number;
  status: 'sending' | 'receiving' | 'completed' | 'error';
  onCancel?: () => void;
}

const TransferProgress: React.FC<TransferProgressProps> = ({
  fileName,
  fileType,
  fileSize,
  progress,
  status,
  onCancel
}) => {
  // Determine which Lucide icon to use based on the file type
  const IconComponent = getFileIcon(fileType);

  const getStatusColor = () => {
    switch (status) {
      case 'sending':
      case 'receiving':
        return 'text-primary animate-pulse-opacity';
      case 'completed':
        return 'text-green-500';
      case 'error':
        return 'text-destructive';
      default:
        return 'text-muted-foreground';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'sending':
        return 'Sending...';
      case 'receiving':
        return 'Receiving...';
      case 'completed':
        return 'Completed';
      case 'error':
        return 'Failed';
      default:
        return '';
    }
  };

  return (
    <Card className="w-full border border-border shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mr-4">
            <File className="w-5 h-5 text-primary" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start mb-1">
              <div className="truncate text-sm font-medium max-w-[70%]" title={fileName}>
                {fileName}
              </div>
              <div className={`text-xs font-medium ${getStatusColor()}`}>
                {getStatusText()}
              </div>
            </div>
            
            <div className="text-xs text-muted-foreground mb-2">
              {formatFileSize(fileSize)}
            </div>
            
            <Progress value={progress} className="h-2" />
            
            <div className="flex justify-between mt-1">
              <span className="text-xs text-muted-foreground">
                {progress}%
              </span>
              {onCancel && status !== 'completed' && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs text-muted-foreground hover:text-destructive"
                  onClick={onCancel}
                >
                  <X className="w-3 h-3 mr-1" />
                  Cancel
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TransferProgress;
