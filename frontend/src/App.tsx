// ============================================
// FILE 1: frontend/src/App.tsx
// Main React TypeScript application component
// ============================================

import React, { useState, useRef, useEffect } from 'react';
import { Cloud, Send, User, Thermometer, Wind, Droplets, Gauge } from 'lucide-react';
import './App.css';

const API_URL = import.meta.env.VITE_API_URL;
const WS_URL = import.meta.env.VITE_WS_URL;

interface WeatherData {
  city: string;
  country: string;
  temperature: number;
  feels_like: number;
  condition: string;
  description: string;
  humidity: number;
  wind_speed: number;
  pressure: number;
  visibility: number;
  timestamp: string;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  weatherData?: WeatherData | null;
  timestamp: Date;
}

interface ChatResponse {
  response: string;
  data?: WeatherData | null;
  timestamp: string;
}

interface WeatherCardProps {
  data: WeatherData;
}

const WeatherCard: React.FC<WeatherCardProps> = ({ data }) => (
  <div className="mt-3 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
    <div className="grid grid-cols-2 gap-3 text-sm">
      <div className="flex items-center gap-2">
        <Thermometer className="w-4 h-4 text-red-500" />
        <div>
          <div className="text-xs text-gray-600">Temperature</div>
          <div className="font-semibold">{data.temperature}°C</div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Droplets className="w-4 h-4 text-blue-500" />
        <div>
          <div className="text-xs text-gray-600">Humidity</div>
          <div className="font-semibold">{data.humidity}%</div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Wind className="w-4 h-4 text-gray-500" />
        <div>
          <div className="text-xs text-gray-600">Wind</div>
          <div className="font-semibold">{data.wind_speed} km/h</div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Gauge className="w-4 h-4 text-purple-500" />
        <div>
          <div className="text-xs text-gray-600">Pressure</div>
          <div className="font-semibold">{data.pressure} hPa</div>
        </div>
      </div>
    </div>
  </div>
);

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Hello! I\'m your ROMA Weather Assistant. Ask me about weather in any city!\n\nTry:\n• "What\'s the weather in London?"\n• "Compare between Paris and Tokyo"\n• "Temperature in New York"',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'rest' | 'disconnected'>('disconnected');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // WebSocket connection (optional - falls back to REST API)
  useEffect(() => {
    try {
      const ws = new WebSocket(WS_URL);
      
      ws.onopen = () => {
        console.log('WebSocket connected');
        setConnectionStatus('connected');
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        setMessages(prev => [...prev, {
          role: data.role,
          content: data.content,
          weatherData: data.data,
          timestamp: new Date(data.timestamp)
        }]);
        setIsLoading(false);
      };

      ws.onerror = () => {
        console.log('WebSocket error, will use REST API');
        setConnectionStatus('rest');
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        setConnectionStatus('rest');
      };

      wsRef.current = ws;

      return () => {
        ws.close();
      };
    } catch (error) {
      console.log('WebSocket not available, using REST API');
      setConnectionStatus('rest');
    }
  }, []);

  const sendViaWebSocket = (message: string): boolean => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        content: message,
        timestamp: new Date().toISOString()
      }));
      return true;
    }
    return false;
  };

  const sendViaREST = async (message: string): Promise<void> => {
    try {
      const response = await fetch(`${API_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message,
          history: messages
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ChatResponse = await response.json();
      
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.response,
        weatherData: data.data,
        timestamp: new Date(data.timestamp)
      }]);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Error connecting to server: ${errorMessage}. Make sure the backend is running on port 5000.`,
        timestamp: new Date()
      }]);
    }
  };

  const handleSend = async (): Promise<void> => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const userInput = input;
    setInput('');
    setIsLoading(true);

    // Try WebSocket first, fall back to REST
    const sentViaWS = sendViaWebSocket(userInput);
    
    if (!sentViaWS) {
      await sendViaREST(userInput);
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg" style={{ backgroundColor: '#fc698e' }}>
  <Cloud className="w-6 h-6 text-white" />
</div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">ROMA Weather Assistant</h1>
              <p className="text-sm text-gray-500">Powered by Recursive Agent Framework</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${
              connectionStatus === 'connected' ? 'bg-green-500' : 
              connectionStatus === 'rest' ? 'bg-yellow-500' : 'bg-gray-300'
            }`}></div>
            <span className="text-xs text-gray-600">
              {connectionStatus === 'connected' ? 'Live' : 
               connectionStatus === 'rest' ? 'REST API' : 'Connecting...'}
            </span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
          >
            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
    message.role === 'user'
      ? 'bg-black'
      : ''
  }`}
  style={message.role !== 'user' ? { backgroundColor: '#fc698e' } : undefined}
>
  {message.role === 'user' ? (
    <User className="w-5 h-5 text-white" />
  ) : (
    <img
      src="/logo.png"
      alt="Bot"
      className="w-5 h-5"
      style={{ filter: 'invert(1) brightness(2)' }} // makes logo white on pink bg
    />
  )}
</div>



            <div className={`flex-1 ${message.role === 'user' ? 'flex justify-end' : ''}`}>

        <div className={`max-w-2xl rounded-2xl px-4 py-3 ${
    message.role === 'user'
      ? 'bg-black text-white'
      : 'bg-white border border-gray-200 text-gray-800'
  }`}
>

                <div className="whitespace-pre-wrap">{message.content}</div>
                {message.weatherData && (
                  <WeatherCard data={message.weatherData} />
                )}
                <div className={`text-xs mt-2 ${
                  message.role === 'user' ? 'text-green-100' : 'text-gray-400'
                }`}>
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {isLoading && (
  <div className="flex gap-3">
    <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: '#fc698e' }}>
      <img
        src="/logo.png"
        alt="Bot"
        className="w-5 h-5"
        style={{ filter: 'invert(1) brightness(2)' }} // keeps it white on pink bg
      />
    </div>
    <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3">
      <div className="flex gap-2">
        <div className="w-2 h-2 bg-black rounded-full animate-bounce"></div>
        <div className="w-2 h-2 bg-black rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></div>
        <div className="w-2 h-2 bg-black rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
      </div>
    </div>
  </div>
)}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 bg-white px-6 py-4">
        <div className="flex gap-3 max-w-4xl mx-auto">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about weather in any city..."
            className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />


          <button
            onClick={handleSend}
  disabled={isLoading || !input.trim()}
  className="bg-black text-white p-3 rounded-xl hover:bg-gray-800 disabled:opacity-50 transition-all"
>
  <Send className="w-5 h-5" />
</button>
        </div>
        <div className="text-center mt-2">
          <p className="text-xs text-gray-500" style={{ fontWeight: "700"}}>
            {/* Powered by ROMA • Server: {API_URL} */}
            Innovated with 🤍 by {' '}
        <a
          href="https://x.com/snicholasxiv"
          target="_blank"
          rel="noopener noreferrer"
          style={{ cursor: "pointer", textDecoration: "none",   color: "#fc698e" }}
        >
          @Bandz (✧ᴗ✧)
        </a>
          </p>
        </div>

      </div>
    </div>
  );
};

export default App;

