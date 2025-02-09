"use client";

import { useState, useEffect } from 'react';
import { Send, Plus } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Message {
  content: string;
  role: 'user' | 'assistant' | 'loading';
  timestamp: string;
}

interface ChatHistory {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: string;
}

// Custom loading message component with animated dots
const LoadingContent = () => (
  <div className="flex items-center">
    <h1 className="animate-bounce">Loading</h1>
    <span className="inline-flex ml-1">
      <span className="animate-pulse">.</span>
      <span className="animate-pulse" style={{ animationDelay: "200ms" }}>.</span>
      <span className="animate-pulse" style={{ animationDelay: "400ms" }}>.</span>
    </span>
  </div>
);

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatHistory[]>([]);
  const [activeChat, setActiveChat] = useState<string | null>(null);

  useEffect(() => {
    // In production, fetch chat history from Supabase
    const dummyHistory = [
      {
        id: '1',
        title: 'Fact Check: Climate Change',
        lastMessage: 'What are the main causes of climate change?',
        timestamp: new Date().toISOString()
      },
      {
        id: '2',
        title: 'Fact Check: COVID-19',
        lastMessage: 'Is the vaccine effective against new variants?',
        timestamp: new Date().toISOString()
      }
    ];
    setChatHistory(dummyHistory);
  }, []);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = {
      content: input,
      role: 'user',
      timestamp: new Date().toISOString(),
    };

    const loadingMessage: Message = {
      content: '',  // Content will be rendered by LoadingContent component
      role: 'loading',
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage, loadingMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:5001/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message: input,
          history: messages 
        }),
      });

      const data = await response.json();
      
      const assistantMessage: Message = {
        content: data.response,
        role: 'assistant',
        timestamp: data.timestamp,
      };

      setMessages(prev => [...prev.slice(0, -1), assistantMessage]);
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => prev.slice(0, -1)); // Remove loading message on error
    } finally {
      setIsLoading(false);
    }
  };

  const startNewChat = () => {
    setMessages([]);
    setActiveChat(null);
  };

  return (
    <div className="h-[calc(99vh-3.5rem)] flex overflow-hidden">
      {/* Chat History Sidebar */}
      <div className="w-64 border-r bg-muted/30 overflow-hidden">
        <div className="p-4 overflow-hidden">
          <Button 
            className="w-full mb-4" 
            onClick={startNewChat}
          >
            <Plus className="h-4 w-4 mr-2" />
            New Chat
          </Button>
          <ScrollArea className="h-[calc(100vh-8rem)]">
            {chatHistory.map((chat) => (
              <div
                key={chat.id}
                className={`p-3 cursor-pointer rounded-lg mb-2 hover:bg-muted ${
                  activeChat === chat.id ? 'bg-muted' : ''
                }`}
                onClick={() => setActiveChat(chat.id)}
              >
                <h3 className="font-medium truncate">{chat.title}</h3>
                <p className="text-sm text-muted-foreground truncate">
                  {chat.lastMessage}
                </p>
              </div>
            ))}
          </ScrollArea>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Card className="flex-1 m-4 bg-background overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-[80%] p-4 rounded-lg ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : message.role === 'assistant'
                        ? 'bg-muted'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {message.role === 'loading' ? (
                      <LoadingContent />
                    ) : (
                      <>
                        <p className="text-sm">{message.content}</p>
                        <span className="text-xs opacity-50 mt-1 block">
                          {new Date(message.timestamp).toLocaleTimeString()}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </Card>

        <form onSubmit={sendMessage} className="p-4 border-t">
          <div className="flex gap-4 ">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button type="submit" disabled={isLoading}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}