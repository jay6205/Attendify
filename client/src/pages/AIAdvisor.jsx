import React, { useState, useEffect, useRef, useContext } from 'react';
import { Send, Bot, User, Sparkles } from 'lucide-react';
import api from '../api/axios';
import AuthContext from '../context/AuthContext';

const AIAdvisor = () => {
    const { user } = useContext(AuthContext);
    const [messages, setMessages] = useState([
        { 
            id: 1, 
            sender: 'bot', 
            text: `Hello ${user?.email?.split('@')[0] || 'Student'}! I'm your Attendify AI Advisor. I have access to your attendance records. Ask me anything—like "Can I bunk Maths tomorrow?" or "What acts as a safe buffer?"`
        }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Fetch History on Mount
    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const res = await api.get('/ai/history');
                if (res.data.length > 0) {
                    setMessages(res.data);
                }
            } catch (error) {
                console.error("Failed to fetch chat history", error);
            }
        };
        fetchHistory();
    }, []);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMessage = { id: Date.now(), sender: 'user', text: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setLoading(true);

        try {
            // Backend expects 'message', stick to that to ensure compatibility
            const res = await api.post('/ai/chat', { message: userMessage.text });
            const botMessage = { 
                id: Date.now() + 1, 
                sender: 'bot', 
                text: res.data.response 
            };
            setMessages(prev => [...prev, botMessage]);
        } catch (error) {
            console.error("AI Error:", error);
            const errorMessage = { 
                id: Date.now() + 1, 
                sender: 'bot', 
                text: "System Overload. I'm having trouble connecting right now."
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-2rem)] md:h-[calc(100vh-3rem)] max-w-4xl mx-auto">
            {/* Header */}
            <header className="mb-4">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-3 bg-indigo-500/20 rounded-xl border border-indigo-500/30">
                        <Sparkles className="text-indigo-400" size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white">Attendify AI Advisor</h1>
                        <p className="text-slate-400 text-sm flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            Online
                        </p>
                    </div>
                </div>
                <div className="text-xs text-amber-500/80 bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-lg inline-block">
                    Disclaimer: I can help you plan bunks, but I am an AI. Verify calculations manually.
                </div>
            </header>

            {/* Chat Container */}
            <div className="flex-1 bg-slate-800/50 rounded-2xl border border-slate-700 backdrop-blur-sm overflow-hidden flex flex-col shadow-xl">
                
                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-transparent">
                    {messages.map((msg) => (
                        <div 
                            key={msg.id} 
                            className={`flex gap-4 ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                        >
                            {/* Avatar */}
                            <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center ${
                                msg.sender === 'user' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-emerald-500/20 text-emerald-400'
                            }`}>
                                {msg.sender === 'user' ? <User size={20} /> : <Bot size={20} />}
                            </div>

                            {/* Bubble */}
                            <div className={`max-w-[80%] rounded-2xl p-4 text-sm leading-relaxed ${
                                msg.sender === 'user' 
                                    ? 'bg-indigo-600 text-white rounded-tr-none shadow-lg shadow-indigo-500/10' 
                                    : 'bg-slate-700/50 text-slate-200 border border-slate-600 rounded-tl-none shadow-sm'
                            }`}>
                                {/* Render newlines as line breaks */}
                                {msg.text.split('\n').map((line, i) => (
                                    <React.Fragment key={i}>
                                        {line}
                                        {i !== msg.text.split('\n').length - 1 && <br />}
                                    </React.Fragment>
                                ))}
                            </div>
                        </div>
                    ))}

                    {loading && (
                        <div className="flex gap-4">
                             <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex-shrink-0 flex items-center justify-center">
                                <Bot size={20} />
                            </div>
                            <div className="bg-slate-700/50 border border-slate-600 rounded-2xl rounded-tl-none p-4 w-16 flex items-center justify-center gap-1">
                                <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 bg-slate-800/80 border-t border-slate-700">
                    <form onSubmit={handleSend} className="relative flex items-center gap-2">
                        <div className="absolute left-4 opacity-50">
                            <Sparkles size={18} className="text-indigo-400" />
                        </div>
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ask about your attendance..."
                            className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-3.5 pl-12 pr-12 text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all placeholder:text-slate-500"
                            disabled={loading}
                        />
                        <button 
                            type="submit" 
                            disabled={!input.trim() || loading}
                            className="absolute right-2 p-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-600/50 disabled:cursor-not-allowed text-white rounded-lg transition-colors shadow-lg shadow-indigo-600/20"
                        >
                            <Send size={18} />
                        </button>
                    </form>
                    <div className="text-center mt-2 text-xs text-slate-500">
                        AI can make mistakes. Please verify attendance policies with your university handbook.
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AIAdvisor;
