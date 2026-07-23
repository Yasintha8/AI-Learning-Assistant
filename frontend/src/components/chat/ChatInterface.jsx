import React, { useState, useEffect, useRef } from 'react';
import { Send, MessageSquare, Sparkles, Quote } from 'lucide-react';
import { useParams } from 'react-router-dom';
import aiService from '../../services/aiService';
import { useAuth } from '../../context/AuthContext';
import Spinner from '../common/Spinner';
import MarkdownRenderer from '../common/MarkdownRenderer';

const ChatInterface = () => {
    const { id: documentId } = useParams();
    const { user } = useAuth();
    const [history, setHistory] = useState([]);
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [openCitation, setOpenCitation] = useState(null);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        const fetchChatHistory = async () => {
            try {
                setInitialLoading(true);
                const response = await aiService.getChatHistory(documentId);
                setHistory(response.data);
            } catch (error) {
                console.error('Failed to fetch chat history:', error);
            } finally {
                setInitialLoading(false);
            }
        };

        fetchChatHistory();
    }, [documentId]);

    useEffect(() => {
        scrollToBottom();
    }, [history]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!message.trim()) return;

        const userMessage = { role: 'user', content: message, timestamp: new Date() };
        setHistory(prev => [...prev, userMessage]);
        setMessage('');
        setLoading(true);

        try {
            const response = await aiService.chat(documentId, userMessage.content);
            const assistantMessage = {
                role: 'assistant',
                content: response.data.answer,
                timestamp: new Date(),
                relevantChunks: response.data.relevantChunks
            };
            setHistory(prev => [...prev, assistantMessage]);
        } catch (error) {
            console.error('Chat error:', error);
            const errorMessage = {
                role: 'assistant',
                content: 'Sorry, I encountered an error. Please try again.',
                timestamp: new Date()
            };
            setHistory(prev => [...prev, errorMessage]);
        } finally {
            setLoading(false);
        }
    };

    const renderMessage = (msg, index) => {
        const isUser = msg.role === 'user';
        const citations = msg.relevantChunks || [];

        return (
            <div key={index} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                <div className={`flex items-end gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}>
                    {!isUser && (
                        <div className="w-8 h-8 rounded-xl bg-linear-to-br from-primary to-blue-400 flex items-center justify-center shrink-0 shadow-sm shadow-primary-shadow">
                            <Sparkles className="w-4 h-4 text-white" strokeWidth={2} />
                        </div>
                    )}
                    <div className={`max-w-lg px-4 py-3 shadow-sm ${isUser
                        ? 'bg-linear-to-br from-primary to-blue-400 text-white rounded-2xl rounded-br-sm'
                        : 'bg-bg-card border border-border-light text-text-body rounded-2xl rounded-bl-sm'
                        }`}>
                        {isUser ? (
                            <p className="text-sm leading-relaxed">{msg.content}</p>
                        ) : (
                            <div className="prose prose-sm max-w-none">
                                <MarkdownRenderer content={msg.content} />
                            </div>
                        )}
                    </div>
                    {isUser && (
                        <div className="w-8 h-8 rounded-xl bg-linear-to-br from-border-medium to-border-light flex items-center justify-center shrink-0 text-xs font-bold text-text-body">
                            {user?.username?.charAt(0).toUpperCase() || 'U'}
                        </div>
                    )}
                </div>

                {!isUser && citations.length > 0 && (
                    <div className="ml-10 mt-1.5 max-w-lg">
                        <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wide">Sources</span>
                            {citations.map((citation, citationIndex) => {
                                const key = `${index}-${citationIndex}`;
                                const isOpen = openCitation === key;
                                return (
                                    <button
                                        key={key}
                                        type="button"
                                        onClick={() => setOpenCitation(isOpen ? null : key)}
                                        className={`inline-flex items-center gap-1 h-6 px-2.5 rounded-full text-[11px] font-semibold border transition-colors duration-150 cursor-pointer ${isOpen
                                            ? 'bg-primary-light border-primary text-primary'
                                            : 'bg-bg-main border-border-light text-text-muted hover:border-primary hover:text-primary'
                                            }`}
                                    >
                                        <Quote className="w-3 h-3" strokeWidth={2.5} />
                                        {citation.pageNumber > 0 ? `Page ${citation.pageNumber}` : `Source ${citationIndex + 1}`}
                                    </button>
                                );
                            })}
                        </div>

                        {citations.map((citation, citationIndex) => {
                            const key = `${index}-${citationIndex}`;
                            if (openCitation !== key) return null;
                            return (
                                <blockquote
                                    key={key}
                                    className="mt-2 px-3 py-2.5 rounded-xl bg-bg-main border border-border-light text-xs text-text-body leading-relaxed italic"
                                >
                                    "{citation.snippet}"
                                </blockquote>
                            );
                        })}
                    </div>
                )}
            </div>
        );
    };

    if (initialLoading) {
        return (
            <div className="flex flex-col h-[70vh] border border-border-light rounded-2xl items-center justify-center shadow-xs">
                {/* <div className="w-14 h-14 bg-linear-to-br from-violet-400 to-purple-500 rounded-xl flex items-center justify-center mb-4">
                    <MessageSquare className="w-7 h-7 text-bg-card" strokeWidth={2} />
                </div> */}
                <Spinner />
                <p className="text-sm text-text-body mt-3 font-medium animate-pulse">Loading chat history...</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-[70vh] bg-bg-card border border-border-light rounded-2xl shadow-xs overflow-hidden w-full">
            {/* Messages Area */}
            <div className="flex-1 p-6 flex flex-col gap-4 bg-bg-main overflow-y-auto">
                {history.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center gap-3">
                        <div className="w-14 h-14 rounded-2xl bg-linear-to-br from-primary to-blue-400 flex items-center justify-center shadow-sm shadow-primary-shadow">
                            <MessageSquare className="w-6 h-6 text-white" strokeWidth={2} />
                        </div>
                        <h3 className="text-base font-bold text-text-heading tracking-tight">Start a conversation</h3>
                        <p className="text-sm text-text-muted">Ask me anything about the document!</p>
                    </div>
                ) : (
                    history.map(renderMessage)
                )}
                <div ref={messagesEndRef} />
                {loading && (
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-linear-to-br from-primary to-blue-400 flex items-center justify-center shrink-0 shadow-sm shadow-primary-shadow">
                            <Sparkles className="w-4 h-4 text-white" strokeWidth={2} />
                        </div>
                        <div className="flex items-center px-4 py-3 rounded-2xl rounded-tl-sm bg-bg-card border border-border-light shadow-sm">
                            <div className="flex gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                <span className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }}></span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-border-medium bg-bg-card w-full">
                <form onSubmit={handleSendMessage} className="flex items-center gap-2 w-full">
                    <input
                        type="text"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Ask a follow-up question..."
                        className="flex-1 h-11 px-4 border border-border-medium rounded-xl bg-bg-main text-sm text-text-body placeholder:text-text-muted hover:border-primary focus:outline-none  focus:border-primary focus:bg-bg-card transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={loading}
                    />
                    <button
                        type="submit"
                        disabled={loading || !message.trim()}
                        className="shrink-0 h-11 px-5 bg-linear-to-r from-primary to-blue-400 hover:from-primary-hover hover:to-cyan-400 text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 shadow-sm shadow-primary-shadow transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                        <Send className="w-5 h-5" strokeWidth={2} />
                    </button>
                </form>
            </div>
        </div>
    )
};

export default ChatInterface;