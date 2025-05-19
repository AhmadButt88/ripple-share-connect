
import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Share2, Copy, QrCode } from 'lucide-react';
import { toast } from 'sonner';

interface QRCodeDisplayProps {
  sessionId: string;
  baseUrl: string;
}

const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({ sessionId, baseUrl }) => {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const fullUrl = `${baseUrl}?session=${sessionId}`;

  useEffect(() => {
    // Generate QR code using Google Charts API
    const encodedUrl = encodeURIComponent(fullUrl);
    setQrCodeUrl(`https://chart.googleapis.com/chart?cht=qr&chs=300x300&chl=${encodedUrl}&choe=UTF-8`);
  }, [sessionId, fullUrl]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(fullUrl);
      toast.success("Link copied to clipboard");
    } catch (error) {
      console.error("Failed to copy:", error);
      toast.error("Failed to copy link");
    }
  };

  const shareLink = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'P2P File Share',
          text: 'Join my file sharing session',
          url: fullUrl,
        });
      } else {
        await copyToClipboard();
      }
    } catch (error) {
      console.error("Share failed:", error);
    }
  };

  return (
    <Card className="w-full max-w-sm mx-auto bg-card shadow-lg rounded-2xl overflow-hidden border border-primary/20">
      <CardContent className="p-6 flex flex-col items-center">
        <div className="mb-4 text-center">
          <h3 className="text-lg font-medium">Connect with QR Code</h3>
          <p className="text-sm text-muted-foreground">
            Scan this code with another device to connect
          </p>
        </div>
        
        {qrCodeUrl && (
          <div className="relative p-2 bg-white rounded-lg mb-4 w-full max-w-[250px] aspect-square flex items-center justify-center">
            <img 
              src={qrCodeUrl} 
              alt="QR Code for session" 
              className="rounded-md max-w-full h-auto"
            />
            <QrCode className="absolute opacity-10 text-primary w-20 h-20" />
          </div>
        )}
        
        <div className="text-sm font-mono w-full truncate mb-4 text-center bg-secondary p-2 rounded-md">
          {fullUrl}
        </div>
        
        <div className="flex space-x-2 w-full">
          <Button
            variant="outline"
            className="flex-1"
            onClick={copyToClipboard}
          >
            <Copy className="w-4 h-4 mr-2" />
            Copy Link
          </Button>
          
          <Button 
            className="flex-1"
            onClick={shareLink}
          >
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default QRCodeDisplay;
