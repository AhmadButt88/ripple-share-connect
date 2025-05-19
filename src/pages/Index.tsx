
import React, { useCallback, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { 
  QrCode, 
  FileText, 
  Upload, 
  History, 
  Wifi, 
  X 
} from 'lucide-react';
import QRCodeDisplay from '@/components/QRCodeDisplay';
import FileUpload from '@/components/FileUpload';
import TransferProgress from '@/components/TransferProgress';
import FileHistoryItem from '@/components/FileHistoryItem';
import ConnectionStatus from '@/components/ConnectionStatus';
import { peerService } from '@/services/peerService';
import { downloadFile, generateFileId } from '@/services/fileUtils';
import { FileHistoryEntry, ActiveTransfer } from '@/types/fileTypes';
import { toast } from 'sonner';

const HISTORY_STORAGE_KEY = 'file-sharing-history';

const Index: React.FC = () => {
  const [sessionId, setSessionId] = useState<string>('');
  const [connectingToSession, setConnectingToSession] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<string>('Disconnected');
  const [isConnected, setIsConnected] = useState(false);
  const [activeTab, setActiveTab] = useState('connect');
  const [fileHistory, setFileHistory] = useState<FileHistoryEntry[]>([]);
  const [activeTransfers, setActiveTransfers] = useState<ActiveTransfer[]>([]);
  
  const location = useLocation();

  // Load file history from localStorage on component mount
  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem(HISTORY_STORAGE_KEY);
      if (savedHistory) {
        // We need to recreate the Blobs since they can't be serialized
        const parsedHistory = JSON.parse(savedHistory);
        // We can't reconstruct the actual Blob data from localStorage
        // In a real app, we would store the files in IndexedDB instead
        setFileHistory(parsedHistory);
      }
    } catch (error) {
      console.error('Failed to load file history:', error);
    }
  }, []);

  // Check for session ID in URL on component mount
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const sessionParam = params.get('session');
    
    if (sessionParam) {
      setConnectingToSession(sessionParam);
      connectToSession(sessionParam);
      // Clear the URL parameter
      window.history.replaceState({}, document.title, window.location.pathname);
    } else {
      // Generate a new session ID for hosting
      const newSessionId = peerService.generateSessionId();
      setSessionId(newSessionId);
    }
  }, [location.search]);

  // Setup peer connection listeners
  useEffect(() => {
    peerService.setConnectionStatusListener((status) => {
      setConnectionStatus(status);
      
      // Update connection state based on status
      if (
        status === 'Data channel open' || 
        status === 'Connection established' || 
        status.includes('File')
      ) {
        setIsConnected(true);
        setActiveTab('share');
      } else if (status === 'Disconnected') {
        setIsConnected(false);
      }
    });
    
    peerService.setFileReceiveListener((file, fileName, fileType) => {
      // Create a file history entry
      const newFile: FileHistoryEntry = {
        id: generateFileId(),
        name: fileName,
        type: fileType,
        size: file.size,
        data: file,
        timestamp: Date.now(),
        direction: 'received'
      };
      
      // Add to history
      addToHistory(newFile);
      
      // Show completion for current transfer
      setActiveTransfers(prev => 
        prev.map(transfer => 
          transfer.status === 'receiving' 
            ? { ...transfer, progress: 100, status: 'completed' } 
            : transfer
        )
      );
      
      toast.success(`Received: ${fileName}`);
      
      // Offer to download the file
      downloadFile(file, fileName);
    });
    
    peerService.setTransferProgressListener((progress) => {
      // Update progress for receiving transfer
      setActiveTransfers(prev => 
        prev.map(transfer => 
          transfer.status === 'receiving' 
            ? { ...transfer, progress } 
            : transfer
        )
      );
    });
  }, []);

  const addToHistory = useCallback((file: FileHistoryEntry) => {
    setFileHistory(prev => {
      const newHistory = [file, ...prev];
      // Try to persist to localStorage, but only the metadata
      try {
        const historyForStorage = newHistory.map(item => ({
          ...item,
          // We can't serialize the Blob, so we remove it for storage
          data: {} as Blob 
        }));
        localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(historyForStorage));
      } catch (error) {
        console.error('Failed to save history to localStorage:', error);
      }
      return newHistory;
    });
  }, []);

  const connectToSession = async (targetSessionId: string) => {
    try {
      const offer = await peerService.createOffer();
      
      // In a real app, we would use a signaling server 
      // or Firebase to exchange the offer with the peer
      console.log('Created offer for session:', targetSessionId, offer);
      
      // For demo purposes, we're simulating a connection
      setConnectionStatus('Connecting...');
      
      // In a real app, after signaling setup is complete:
      // - Sender would receive the answer and add it to the peer connection
      // peerService.receiveAnswer(answer);
      
      // For demonstration only - we'd typically wait for answer from peer
      setTimeout(() => {
        setConnectionStatus('Connection established (demo)');
        setIsConnected(true);
        setActiveTab('share');
      }, 2000);
      
    } catch (error) {
      console.error('Failed to connect:', error);
      setConnectionStatus('Connection failed');
      toast.error('Failed to establish connection');
    }
  };

  const handleHostSession = () => {
    setConnectionStatus('Waiting for peer to connect...');
    
    // In a real app, we would setup signaling to receive the offer
    // For now, we just show the QR code/link for the other device to scan
  };

  const handleFileSelect = (files: File[]) => {
    if (!isConnected) {
      toast.error('Not connected to a peer');
      return;
    }
    
    // Process and send each file
    files.forEach(file => {
      // Create a transfer entry
      const transferId = generateFileId();
      const newTransfer: ActiveTransfer = {
        id: transferId,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        progress: 0,
        status: 'sending'
      };
      
      setActiveTransfers(prev => [...prev, newTransfer]);
      
      // Send the file
      peerService.sendFile(file, (progress) => {
        // Update progress
        setActiveTransfers(prev => 
          prev.map(transfer => 
            transfer.id === transferId 
              ? { ...transfer, progress } 
              : transfer
          )
        );
        
        // If complete, add to history
        if (progress === 100) {
          const historyEntry: FileHistoryEntry = {
            id: transferId,
            name: file.name,
            type: file.type,
            size: file.size,
            data: new Blob([file]),
            timestamp: Date.now(),
            direction: 'sent'
          };
          
          addToHistory(historyEntry);
          
          // Update transfer status
          setTimeout(() => {
            setActiveTransfers(prev => 
              prev.map(transfer => 
                transfer.id === transferId 
                  ? { ...transfer, status: 'completed' } 
                  : transfer
              )
            );
          }, 500);
        }
      });
    });
  };

  const handleCancelTransfer = (transferId: string) => {
    setActiveTransfers(prev => 
      prev.map(transfer => 
        transfer.id === transferId 
          ? { ...transfer, status: 'error' } 
          : transfer
      )
    );
    
    // In a real app, we would handle canceling the actual transfer
    toast.info('Transfer canceled');
  };

  const handleDownloadFile = (file: FileHistoryEntry) => {
    // In a real implementation, we would load the file from IndexedDB
    // For now, we'll just simulate a download if the blob is available
    if (file.data && file.data.size > 0) {
      downloadFile(file.data, file.name);
    } else {
      toast.error("File data not available. This is a demo limitation.");
    }
  };

  const handleDeleteHistoryItem = (fileId: string) => {
    setFileHistory(prev => {
      const newHistory = prev.filter(file => file.id !== fileId);
      // Update localStorage
      try {
        const historyForStorage = newHistory.map(item => ({
          ...item,
          data: {} as Blob
        }));
        localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(historyForStorage));
      } catch (error) {
        console.error('Failed to update history in localStorage:', error);
      }
      return newHistory;
    });
    
    toast.success("Removed from history");
  };

  const handleDisconnect = () => {
    peerService.disconnect();
    setIsConnected(false);
    setConnectionStatus('Disconnected');
    setActiveTransfers([]);
    
    // Generate a new session ID for future connections
    const newSessionId = peerService.generateSessionId();
    setSessionId(newSessionId);
  };

  // Generate base URL for QR codes and links
  const baseUrl = window.location.origin + window.location.pathname;
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/80 px-4 py-6">
      <div className="max-w-3xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-app-purple to-app-accent bg-clip-text text-transparent">
            P2P File Share
          </h1>
          <p className="text-muted-foreground mt-2">
            Securely share files directly between devices
          </p>
          
          <div className="mt-6 flex justify-center">
            <ConnectionStatus status={connectionStatus} />
            
            {isConnected && (
              <Button 
                variant="outline" 
                size="sm"
                className="ml-4"
                onClick={handleDisconnect}
              >
                <X className="w-4 h-4 mr-2" />
                Disconnect
              </Button>
            )}
          </div>
        </header>
      
        <Tabs 
          value={activeTab} 
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="grid grid-cols-3 w-full max-w-md mx-auto mb-6">
            <TabsTrigger value="connect" disabled={connectingToSession !== null}>
              <QrCode className="w-4 h-4 mr-2" />
              Connect
            </TabsTrigger>
            <TabsTrigger value="share" disabled={!isConnected}>
              <Upload className="w-4 h-4 mr-2" />
              Share
            </TabsTrigger>
            <TabsTrigger value="history">
              <History className="w-4 h-4 mr-2" />
              History
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="connect" className="space-y-8 animate-fade-in">
            {connectingToSession ? (
              <div className="text-center">
                <Wifi className="w-16 h-16 mx-auto text-primary animate-pulse mb-4" />
                <h2 className="text-xl font-medium mb-2">Connecting to session...</h2>
                <p className="text-muted-foreground">
                  Establishing secure connection with peer
                </p>
              </div>
            ) : (
              <>
                <div className="text-center mb-6">
                  <h2 className="text-xl font-medium mb-2">Start a new sharing session</h2>
                  <p className="text-muted-foreground">
                    Share this link or QR code with another device to connect
                  </p>
                </div>
                
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <QRCodeDisplay sessionId={sessionId} baseUrl={baseUrl} />
                  </div>
                  
                  <div className="flex flex-col justify-center">
                    <Button 
                      size="lg" 
                      className="mb-4"
                      onClick={handleHostSession}
                    >
                      <Wifi className="w-5 h-5 mr-2" />
                      Start Session
                    </Button>
                    
                    <p className="text-sm text-muted-foreground text-center">
                      Waiting for another device to connect using your QR code or link
                    </p>
                  </div>
                </div>
              </>
            )}
          </TabsContent>
          
          <TabsContent value="share" className="space-y-8 animate-fade-in">
            <div className="mb-6">
              <FileUpload 
                disabled={!isConnected} 
                onFileSelect={handleFileSelect} 
              />
            </div>
            
            {activeTransfers.length > 0 && (
              <div>
                <h3 className="text-lg font-medium mb-4">Active Transfers</h3>
                <div className="space-y-3">
                  {activeTransfers.map(transfer => (
                    <TransferProgress
                      key={transfer.id}
                      fileName={transfer.fileName}
                      fileType={transfer.fileType}
                      fileSize={transfer.fileSize}
                      progress={transfer.progress}
                      status={transfer.status}
                      onCancel={() => handleCancelTransfer(transfer.id)}
                    />
                  ))}
                </div>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="history" className="space-y-4 animate-fade-in">
            <h3 className="text-lg font-medium mb-2">File History</h3>
            
            {fileHistory.length > 0 ? (
              <div className="space-y-3">
                {fileHistory.map(file => (
                  <FileHistoryItem
                    key={file.id}
                    file={file}
                    onDownload={handleDownloadFile}
                    onDelete={handleDeleteHistoryItem}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-10 border border-dashed border-border rounded-lg">
                <FileText className="w-12 h-12 mx-auto text-muted-foreground/50 mb-2" />
                <p className="text-muted-foreground">No file history yet</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
      
      <footer className="mt-20 text-center text-sm text-muted-foreground">
        <p>P2P File Sharing App • Files are transferred directly between devices</p>
      </footer>
    </div>
  );
};

export default Index;
