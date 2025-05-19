
import React from 'react';
import { Wifi } from 'lucide-react';

interface ConnectionStatusProps {
  status: string;
}

const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ status }) => {
  let statusClass = "bg-gray-200 text-gray-700";
  let isConnected = false;

  if (status === "Disconnected" || status.includes("failed") || status.includes("error")) {
    statusClass = "bg-destructive/10 text-destructive";
  } else if (status.includes("established") || status === "connected" || status === "Data channel open") {
    statusClass = "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
    isConnected = true;
  } else if (status.includes("Sending") || status.includes("Receiving")) {
    statusClass = "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
    isConnected = true;
  } else {
    statusClass = "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
  }

  return (
    <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${statusClass}`}>
      <Wifi className={`w-4 h-4 mr-1.5 ${isConnected ? 'animate-pulse' : ''}`} />
      {status}
    </div>
  );
};

export default ConnectionStatus;
