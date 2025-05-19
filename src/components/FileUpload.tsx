
import React, { useCallback, useState } from 'react';
import { Upload, File } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { formatFileSize } from '@/services/fileUtils';
import { toast } from 'sonner';

interface FileUploadProps {
  disabled?: boolean;
  onFileSelect: (files: File[]) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ disabled = false, onFileSelect }) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragging(true);
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (disabled) return;
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const filesArray = Array.from(e.dataTransfer.files);
      onFileSelect(filesArray);
      toast.success(`${filesArray.length} file(s) added`);
    }
  }, [disabled, onFileSelect]);

  const handleClick = useCallback(() => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, [disabled]);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      onFileSelect(filesArray);
      toast.success(`${filesArray.length} file(s) added`);
    }
  }, [onFileSelect]);

  return (
    <Card 
      className={`w-full transition-all duration-200 ${
        isDragging 
          ? 'border-primary border-dashed scale-[1.02] shadow-lg' 
          : 'border border-border shadow'
      } ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:border-primary/50'}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      <CardContent className="flex flex-col items-center justify-center p-8">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileInputChange}
          style={{ display: 'none' }}
          multiple
          disabled={disabled}
        />
        
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <Upload 
            className={`w-8 h-8 ${isDragging ? 'text-primary' : 'text-primary/70'}`} 
          />
        </div>
        
        <h3 className="text-lg font-medium mb-2">
          {isDragging ? 'Drop files here' : 'Upload Files'}
        </h3>
        
        <p className="text-sm text-center text-muted-foreground mb-2">
          {disabled 
            ? "Waiting for connection..." 
            : "Drag and drop files here or click to browse"}
        </p>
        
        <div className="text-xs text-muted-foreground">
          All file types supported
        </div>
      </CardContent>
    </Card>
  );
};

export default FileUpload;
