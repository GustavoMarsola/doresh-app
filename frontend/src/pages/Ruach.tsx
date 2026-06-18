import ReactMarkdown from 'react-markdown';
import { useState, useRef, useEffect } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { jwtDecode } from 'jwt-decode';
import { Button } from '@/components/ui/button';
import { authFetch } from '@/components/auth/utils';
import { textIntroduction, quickSuggestions } from '@/components/utils';
import { DoveIcon } from "@/components/ui/dove-icon";
import { Textarea } from "@/components/ui/textarea";

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

export const Ruach = () => {
  const token = localStorage.getItem('token');
  const decoded: any = jwtDecode(token);
  const sessionId = decoded.session_id;
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
      });
      const data = await response.json();

      const aiText = data.output
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
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-background">
      {/* Header */}
      <div className="border-b bg-card px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
            <DoveIcon size="md" className="text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-foreground">Ruach (רוּחַ)</h1>
            <p className="text-sm text-muted-foreground">Assistente de estudos bíblicos</p>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-4 ${msg.isUser ? 'flex-row-reverse' : 'flex-row'}`}
            >
              {/* Avatar */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                msg.isUser ? 'bg-primary' : 'bg-primary/10'
              }`}>
                {msg.isUser ? (
                  <span className="text-primary-foreground text-sm font-medium">
                    {'U'}
                  </span>
                ) : (
                  <DoveIcon size="sm" className="text-primary" />
                )}
              </div>

              {/* Message Content */}
              <div className={`flex-1 ${msg.isUser ? 'text-right' : 'text-left'}`}>
                <div
                  className={`inline-block max-w-[85%] p-4 rounded-2xl ${
                    msg.isUser
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-card text-card-foreground border'
                  }`}
                >
                  <ReactMarkdown
                    components={{
                      a: ({ node, ...props }) => (
                        <a
                          {...props}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline hover:opacity-80"
                        />
                      )
                    }}
                  >
                    {msg.text}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-4">
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                <DoveIcon size="sm" className="text-primary" />
              </div>
              <div className="bg-card border p-4 rounded-2xl">
                <div className="flex gap-2">
                  <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Quick Suggestions (only show when no messages yet) */}
      {messages.length === 1 && (
        <div className="px-4 pb-4">
          <div className="max-w-4xl mx-auto">
            <p className="text-sm text-muted-foreground mb-3">Sugestões de perguntas:</p>
            <div className="flex flex-wrap gap-2">
              {quickSuggestions.map((suggestion, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  className="text-sm"
                  onClick={() => setMessage(suggestion)}
                >
                  {suggestion}
                </Button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="border-t bg-card px-4 py-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-2 items-end">
            <Textarea
              ref={textareaRef}
              placeholder="Digite sua pergunta sobre a Bíblia..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  if (!isLoading) handleSendMessage();
                }
              }}
              className="resize-none min-h-[60px] max-h-[200px]"
              rows={1}
            />
            <Button
              size="lg"
              onClick={handleSendMessage}
              disabled={!message.trim() || isLoading}
              className="h-[60px] px-6"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
