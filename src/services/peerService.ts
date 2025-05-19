
import { toast } from "sonner";

const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
  ],
};

class PeerService {
  private peerConnection: RTCPeerConnection | null = null;
  private dataChannel: RTCDataChannel | null = null;
  private isInitiator = false;
  private onConnectionStatusChange: ((status: string) => void) | null = null;
  private onReceiveFile: ((file: Blob, fileName: string, fileType: string) => void) | null = null;
  private onTransferProgress: ((progress: number) => void) | null = null;
  private receivingFile: {
    name: string;
    type: string;
    size: number;
    data: Uint8Array[];
    receivedSize: number;
  } | null = null;

  constructor() {
    this.createPeerConnection();
  }

  private createPeerConnection() {
    try {
      this.peerConnection = new RTCPeerConnection(ICE_SERVERS);
      
      this.peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          this.updateConnectionStatus("Establishing connection...");
        }
      };

      this.peerConnection.oniceconnectionstatechange = () => {
        if (this.peerConnection) {
          this.updateConnectionStatus(this.peerConnection.iceConnectionState);
        }
      };

      this.peerConnection.ondatachannel = (event) => {
        this.dataChannel = event.channel;
        this.setupDataChannel();
        this.updateConnectionStatus("Connection established");
      };

      console.log("Peer connection created");
    } catch (error) {
      console.error("Error creating peer connection:", error);
      toast.error("Failed to create peer connection");
    }
  }

  private setupDataChannel() {
    if (!this.dataChannel) return;

    this.dataChannel.onopen = () => {
      this.updateConnectionStatus("Data channel open");
    };

    this.dataChannel.onclose = () => {
      this.updateConnectionStatus("Data channel closed");
    };

    this.dataChannel.onerror = (error) => {
      console.error("Data channel error:", error);
      toast.error("Connection error");
      this.updateConnectionStatus("Connection error");
    };

    this.dataChannel.onmessage = (event) => {
      this.handleDataChannelMessage(event);
    };
  }

  private handleDataChannelMessage(event: MessageEvent) {
    const data = event.data;

    // Handle file metadata message (JSON format)
    if (typeof data === 'string' && data.startsWith('{"file"')) {
      const metadata = JSON.parse(data);
      this.receivingFile = {
        name: metadata.file.name,
        type: metadata.file.type,
        size: metadata.file.size,
        data: [],
        receivedSize: 0,
      };
      this.updateConnectionStatus(`Receiving ${metadata.file.name}...`);
      return;
    }

    // Handle file chunks (binary data)
    if (this.receivingFile && data instanceof ArrayBuffer) {
      const chunk = new Uint8Array(data);
      this.receivingFile.data.push(chunk);
      this.receivingFile.receivedSize += chunk.byteLength;

      // Update progress
      const progress = Math.round((this.receivingFile.receivedSize / this.receivingFile.size) * 100);
      if (this.onTransferProgress) {
        this.onTransferProgress(progress);
      }

      // Check if the file is complete
      if (this.receivingFile.receivedSize === this.receivingFile.size) {
        // Combine all chunks and create the file
        const fileData = new Blob(this.receivingFile.data, { type: this.receivingFile.type });
        
        if (this.onReceiveFile) {
          this.onReceiveFile(fileData, this.receivingFile.name, this.receivingFile.type);
        }

        this.receivingFile = null;
        this.updateConnectionStatus("File received");
      }
    }
  }

  public async createOffer(): Promise<RTCSessionDescriptionInit> {
    if (!this.peerConnection) {
      this.createPeerConnection();
    }

    this.isInitiator = true;

    // Create data channel as offerer
    this.dataChannel = this.peerConnection!.createDataChannel("fileShare");
    this.setupDataChannel();

    try {
      const offer = await this.peerConnection!.createOffer();
      await this.peerConnection!.setLocalDescription(offer);
      this.updateConnectionStatus("Created offer");
      return offer;
    } catch (error) {
      console.error("Error creating offer:", error);
      toast.error("Failed to create offer");
      throw error;
    }
  }

  public async receiveOffer(offer: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit> {
    if (!this.peerConnection) {
      this.createPeerConnection();
    }

    try {
      await this.peerConnection!.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await this.peerConnection!.createAnswer();
      await this.peerConnection!.setLocalDescription(answer);
      this.updateConnectionStatus("Created answer");
      return answer;
    } catch (error) {
      console.error("Error receiving offer:", error);
      toast.error("Failed to accept connection");
      throw error;
    }
  }

  public async receiveAnswer(answer: RTCSessionDescriptionInit): Promise<void> {
    if (!this.peerConnection) {
      console.error("No peer connection");
      return;
    }

    try {
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
      this.updateConnectionStatus("Connection established");
    } catch (error) {
      console.error("Error receiving answer:", error);
      toast.error("Failed to complete connection");
    }
  }

  public receiveIceCandidate(candidate: RTCIceCandidate): void {
    if (!this.peerConnection) {
      console.error("No peer connection");
      return;
    }

    try {
      this.peerConnection.addIceCandidate(candidate);
    } catch (error) {
      console.error("Error adding ice candidate:", error);
    }
  }

  public sendFile(file: File, progressCallback: (progress: number) => void): void {
    if (!this.dataChannel || this.dataChannel.readyState !== "open") {
      toast.error("No active connection");
      return;
    }

    // Send file metadata first
    const metadata = {
      file: {
        name: file.name,
        type: file.type,
        size: file.size,
      },
    };
    
    this.dataChannel.send(JSON.stringify(metadata));
    this.updateConnectionStatus(`Sending ${file.name}...`);

    // Read and send the file in chunks
    const chunkSize = 16384; // 16 KB per chunk
    let offset = 0;
    
    const reader = new FileReader();
    
    reader.onload = (event) => {
      if (!this.dataChannel) return;
      
      if (event.target?.result instanceof ArrayBuffer) {
        this.dataChannel.send(event.target.result);
        offset += event.target.result.byteLength;
        
        const progress = Math.round((offset / file.size) * 100);
        progressCallback(progress);
        
        // Continue if not complete
        if (offset < file.size) {
          readNextChunk();
        } else {
          this.updateConnectionStatus("File sent");
        }
      }
    };
    
    reader.onerror = (error) => {
      console.error("Error reading file:", error);
      toast.error("Failed to send file");
    };
    
    const readNextChunk = () => {
      const slice = file.slice(offset, offset + chunkSize);
      reader.readAsArrayBuffer(slice);
    };
    
    readNextChunk();
  }

  public setConnectionStatusListener(callback: (status: string) => void): void {
    this.onConnectionStatusChange = callback;
  }

  public setFileReceiveListener(callback: (file: Blob, fileName: string, fileType: string) => void): void {
    this.onReceiveFile = callback;
  }

  public setTransferProgressListener(callback: (progress: number) => void): void {
    this.onTransferProgress = callback;
  }

  private updateConnectionStatus(status: string): void {
    if (this.onConnectionStatusChange) {
      this.onConnectionStatusChange(status);
    }
  }

  public disconnect(): void {
    if (this.dataChannel) {
      this.dataChannel.close();
      this.dataChannel = null;
    }

    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    this.updateConnectionStatus("Disconnected");
    this.createPeerConnection(); // Create a new connection for future use
  }

  // Generate a unique session ID
  public generateSessionId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }
}

export const peerService = new PeerService();
