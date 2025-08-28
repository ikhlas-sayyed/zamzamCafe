// Toast.tsx
import React, { useEffect } from "react";

interface ToastProps {
  message: string;
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000); // auto close after 3s
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed bottom-5 right-5 bg-gray-900 text-white px-4 py-2 rounded-lg shadow-lg animate-fadeIn">
      {message}
    </div>
  );
};

export default Toast;
