import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2 } from 'lucide-react';
import { api } from '../services/api';
import { Indicator } from '../types';

interface AIAssistantProps {
  indicators: Indicator[];
}

interface Message {
  role: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

const AIAssistant: React.FC<AIAssistantProps> = ({ indicators }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'ai',
      content: 'Hello! I am your AccrediFy Compliance Assistant. I have access to your current checklist status. How can I help you with PHC regulations or MSDS documentation today?',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: inputValue, timestamp: new Date() };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const responseText = await api.askComplianceAssistant(userMessage.content, indicators);
      const aiMessage: Message = { role: 'ai', content: responseText || "I'm sorry, I couldn't generate a response.", timestamp: new Date() };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
       const errorMessage: Message = { role: 'ai', content: "Sorry, I encountered an error connecting to the AI service. Please try again.", timestamp: new Date() };
       setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center gap-3">
        <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white"><Bot size={18} /></div>
        <div><h3 className="font-bold text-slate-800">Compliance Assistant</h3><p className="text-xs text-slate-500">Powered by Gemini AI</p></div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex gap-3 max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-slate-800' : 'bg-indigo-600'}`}>
                {msg.role === 'user' ? <User size={14} className="text-white"/> : <Bot size={14} className="text-white"/>}
              </div>
              <div className={`p-3 rounded-2xl text-sm leading-relaxed shadow-sm ${msg.role === 'user' ? 'bg-slate-800 text-white rounded-tr-none' : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none'}`}>{msg.content}</div>
            </div>
          </div>
        ))}
        {isLoading && (<div className="flex justify-start"><div className="flex gap-3 max-w-[80%]"><div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0"><Bot size={14} className="text-white"/></div><div className="bg-white p-3 rounded-2xl rounded-tl-none border border-slate-200 flex items-center gap-2"><Loader2 size={16} className="animate-spin text-indigo-600" /><span className="text-xs text-slate-500">Thinking...</span></div></div></div>)}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-4 bg-white border-t border-slate-200">
        <div className="relative">
          <input type="text" value={inputValue} onChange={(e) => setInputValue(e.target.value)} onKeyDown={handleKeyDown} placeholder="Ask about PHC standards..." className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"/>
          <button onClick={handleSend} disabled={isLoading || !inputValue.trim()} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"><Send size={16} /></button>
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;
