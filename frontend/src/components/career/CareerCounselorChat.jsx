import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, User, Bot, RefreshCw, MessageSquare, Lightbulb } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const CareerCounselorChat = ({ chatHistory = [], onSendMessage, isLoading, targetRole }) => {
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef(null);

  const suggestionChips = [
    `How do I prepare for ${targetRole || 'this role'} interview questions?`,
    'What portfolio project should I build first?',
    'How do I bridge my critical skill gaps faster?',
    'Can you review my study commitment plan?'
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory, isLoading]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;
    onSendMessage(inputMessage.trim());
    setInputMessage('');
  };

  const handleChipClick = (suggestion) => {
    if (isLoading) return;
    onSendMessage(suggestion);
  };

  return (
    <div className="flex flex-col h-[650px] bg-white dark:bg-[#151b2c] border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-xs overflow-hidden">
      
      {/* Top Header Bar */}
      <div className="px-6 py-4 bg-slate-50/80 dark:bg-[#192238] border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              AI Career Counselor & Mentor
              <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 rounded-full">
                Gemini AI
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Ask about career advice, interview prep, portfolio feedback, or skill gaps
            </p>
          </div>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 p-6 overflow-y-auto space-y-4 custom-scrollbar">
        {chatHistory.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
            <div className="p-4 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-2xl border border-indigo-500/20">
              <MessageSquare className="w-8 h-8" />
            </div>
            <h4 className="text-base font-bold text-slate-900 dark:text-white">Start Chatting with Your Advisor</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">
              Your AI counselor is tuned to your profile and active roadmap. Ask anything about your career transition!
            </p>
          </div>
        ) : (
          chatHistory.map((msg, idx) => {
            const isUser = msg.role === 'user';

            return (
              <div
                key={idx}
                className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
              >
                {/* Avatar */}
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 shadow-xs ${
                    isUser
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white'
                  }`}
                >
                  {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                {/* Message Bubble */}
                <div
                  className={`max-w-[85%] p-4 rounded-2xl text-xs leading-relaxed ${
                    isUser
                      ? 'bg-indigo-600 text-white rounded-tr-xs shadow-xs font-sans'
                      : 'bg-slate-50 dark:bg-[#1d263b] border border-slate-200/80 dark:border-slate-700/80 text-slate-800 dark:text-slate-200 rounded-tl-xs shadow-xs font-sans'
                  }`}
                >
                  {isUser ? (
                    <p className="whitespace-pre-wrap font-medium">{msg.content}</p>
                  ) : (
                    <div className="markdown-body prose prose-slate dark:prose-invert prose-xs max-w-none">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                  )}
                  
                  <div
                    className={`text-[10px] mt-1.5 font-mono ${
                      isUser ? 'text-indigo-200 text-right' : 'text-slate-400'
                    }`}
                  >
                    {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                  </div>
                </div>
              </div>
            );
          })
        )}

        {isLoading && (
          <div className="flex gap-3 items-center">
            <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Bot className="w-4 h-4 animate-bounce" />
            </div>
            <div className="p-3 bg-slate-50 dark:bg-[#1d263b] border border-slate-200 dark:border-slate-700 rounded-2xl rounded-tl-xs text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-purple-600 dark:text-purple-400" />
              Gemini AI Advisor is generating guidance...
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggestion Chips */}
      <div className="px-6 py-2.5 bg-slate-50/60 dark:bg-slate-950/40 border-t border-slate-200/80 dark:border-slate-800/80 overflow-x-auto flex items-center gap-2 custom-scrollbar">
        <Lightbulb className="w-3.5 h-3.5 text-amber-500 shrink-0" />
        {suggestionChips.map((chip, idx) => (
          <button
            key={idx}
            onClick={() => handleChipClick(chip)}
            disabled={isLoading}
            className="px-3 py-1 bg-white dark:bg-slate-800/90 hover:bg-indigo-50 dark:hover:bg-indigo-600/30 border border-slate-200/80 dark:border-slate-700/60 rounded-full text-[11px] font-medium text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-white whitespace-nowrap transition-all cursor-pointer disabled:opacity-50"
          >
            {chip}
          </button>
        ))}
      </div>

      {/* Message Input Form */}
      <form onSubmit={handleSubmit} className="p-4 bg-white dark:bg-[#151b2c] border-t border-slate-200/80 dark:border-slate-800 flex items-center gap-2">
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder={`Ask your AI Career Counselor about ${targetRole || 'your target role'}...`}
          disabled={isLoading}
          className="flex-1 px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-600 transition-colors disabled:opacity-50 font-sans"
        />
        <button
          type="submit"
          disabled={isLoading || !inputMessage.trim()}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shadow-xs"
        >
          <Send className="w-3.5 h-3.5" />
          Send
        </button>
      </form>

    </div>
  );
};

export default CareerCounselorChat;
