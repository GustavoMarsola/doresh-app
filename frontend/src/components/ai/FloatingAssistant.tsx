import ReactMarkdown from 'react-markdown';
import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';
import { jwtDecode } from 'jwt-decode';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { authFetch } from '@/components/auth/utils';
import { textIntroduction, quickSuggestions } from '@/components/utils';
import { useChat } from '@/hooks/ChatContext'; 
import { DoveIcon } from "@/components/ui/dove-icon";

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

const FloatingAssistant = () => {
  const token = localStorage.getItem('token');
  const decoded: any = jwtDecode(token);
  const sessionId = decoded.session_id;
  const { isChatOpen, setIsChatOpen } = useChat();
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: textIntroduction,
      isUser: false,
      timestamp: new Date()
    }
  ]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"; 
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: message,
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setMessage('');
    setIsLoading(true);

      try {
        const response = await authFetch(`${import.meta.env.VITE_N8N_WEBHOOK_URL}/agent/ruach`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'doresh_api_key': import.meta.env.VITE_API_KEY
            },
            body: JSON.stringify(
              { 
                message: userMessage.text,
                session_id: sessionId 
              }
            )
          }
        );
        const data = await response.json();
        console.log(data)

        const aiText =
          data.output
          ? data.output
          : 'Desculpe, não consegui encontrar uma resposta adequada no momento.';

        const aiResponse: Message = { 
          id: (Date.now() + 1).toString(),
          text: aiText,
          isUser: false,
          timestamp: new Date()
        };

        setMessages(prev => [...prev, aiResponse]);
      } catch (error) {
          console.error('Erro ao enviar mensagem:', error);

        const errorResponse: Message = {
            id: (Date.now() + 2).toString(),
            text: 'Houve um erro ao tentar responder. Tente novamente mais tarde.',
            isUser: false,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, errorResponse]);
      } finally {
        setIsLoading(false);
      }
  };

  return (
    <>
      {/* Botão flutuante */}
      <Button
  className={`fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg text-white z-50 transition-all duration-300 ${
    isChatOpen ? 'scale-0' : 'scale-100'
  }`}
  onClick={() => setIsChatOpen(true)}
>
  <DoveIcon size="md" className="text-white" />
</Button>

      {/* Chat expandido */}
      {isChatOpen && (
        <Card
  className="fixed bottom-6 right-6 z-50 shadow-2xl glass-effect rounded-2xl
  w-[90vw] h-[80vh]               /* padrão: mobile ocupa quase toda tela */
  sm:w-[500px] sm:h-[550px]       /* tablets pequenos */
  md:w-[650px] md:h-[650px]       /* notebooks */
  lg:w-[800px] lg:h-[700px]       /* desktops maiores */
  xl:w-[900px] xl:h-[750px]
  flex flex-col"      
>
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b bg-primary/90 text-white rounded-t-lg">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <DoveIcon className="h-4 w-4" />
              </div>
              <span className="font-medium">Ruach (רוּחַ)</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsChatOpen(false)}
              className="text-white hover:bg-white/10"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Mensagens */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3">
            <div className="space-y-3">
              {messages.map((msg) => (
  <div
    key={msg.id}
    className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'}`}
  >
    <div
      className={`max-w-[85%] p-3 rounded-lg text-base whitespace-pre-wrap ${
        msg.isUser
          ? 'bg-primary/90 text-white'
          : 'bg-gray-100 text-gray-800'
      }`}
    >
      <ReactMarkdown
  components={{
    a: ({ node, ...props }) => (
      <a
        {...props}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 underline hover:text-blue-800"
      />
    )
  }}
>
  {msg.text}
</ReactMarkdown>
    </div>
  </div>
))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 p-3 rounded-lg text-sm">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sugestões rápidas */}
          {messages.length === 1 && (
            <div className="px-4 pb-2">
              <p className="text-xs text-gray-500 mb-2">Sugestões:</p>
              <div className="flex flex-wrap gap-1">
                {quickSuggestions.slice(0, 4).map((suggestion, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    className="text-xs h-6"
                    onClick={() => setMessage(suggestion)}
                  >
                    {suggestion}
                  </Button>
                ))}
              </div>
            </div>
          )}

      {/* Input */}
<div className="p-4 border-t">
  <div className="flex space-x-2">
    <textarea
      ref={textareaRef}
      placeholder="Digite sua pergunta..."
      value={message}
      onChange={(e) => setMessage(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          if (!isLoading) handleSendMessage();
        }
      }}
      className="flex-1 rounded-xl px-4 py-2 border resize-none focus:outline-none focus:ring-2 focus:ring-[primary/90] overflow-hidden"
      rows={1}
    />
    <Button
      size="sm"
      onClick={handleSendMessage}
      disabled={!message.trim() || isLoading}
      className="mecontabill-gradient text-white"
    >
      <Send className="h-4 w-4" />
    </Button>
  </div>
</div>

        </Card>
      )}
    </>
  );
};

export default FloatingAssistant;
