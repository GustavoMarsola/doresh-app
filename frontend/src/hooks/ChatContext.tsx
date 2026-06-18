import { createContext, useState, useContext, ReactNode } from 'react';

// Define a forma do contexto
interface ChatContextType {
  isChatOpen: boolean;
  setIsChatOpen: (isOpen: boolean) => void;
}

// Cria o contexto
const ChatContext = createContext<ChatContextType | undefined>(undefined);

// Cria o provedor do contexto
export const ChatProvider = ({ children }: { children: ReactNode }) => {
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <ChatContext.Provider value={{ isChatOpen, setIsChatOpen }}>
      {children}
    </ChatContext.Provider>
  );
};

// Hook personalizado para usar o contexto
export const useChat = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};