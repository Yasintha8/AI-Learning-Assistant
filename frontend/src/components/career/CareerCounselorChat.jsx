import { useState, useRef, useEffect } from 'react';
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
    <div className="flex flex-col h-[600px] bg-bg-card border border-border-light rounded-3xl shadow-xs overflow-hidden">

      {/* Top Header Bar */}
      <div className="px-6 py-4 bg-bg-main/70 border-b border-border-light flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-primary text-white rounded-2xl shadow-2xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-text-heading flex items-center gap-2 font-display">
              <span>AI Career Counselor & Mentor</span>
              <span className="px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-full">
                AI Advisor
              </span>
            </h3>
            <p className="text-xs text-text-muted font-body">
              Ask about career advice, interview prep, portfolio feedback, or skill gaps
            </p>
          </div>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 p-6 overflow-y-auto space-y-4 custom-scrollbar">
        {chatHistory.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
            <div className="p-4 bg-primary-light text-primary rounded-3xl border border-primary/20 shadow-2xs">
              <MessageSquare className="w-8 h-8" />
            </div>
            <h4 className="text-base font-bold text-text-heading font-display">Start Chatting with Your Advisor</h4>
            <p className="text-xs text-text-muted max-w-sm leading-relaxed font-body">
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
                  className={`w-8 h-8 rounded-2xl flex items-center justify-center text-xs font-bold shrink-0 shadow-2xs ${isUser
                    ? 'bg-primary text-white'
                    : 'bg-gradient-to-br from-primary via-indigo-600 to-purple-600 text-white'
                    }`}
                >
                  {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                {/* Message Bubble */}
                <div
                  className={`max-w-[85%] p-4 rounded-2xl text-xs leading-relaxed ${isUser
                    ? 'bg-primary text-white rounded-tr-xs shadow-2xs font-body'
                    : 'bg-bg-main border border-border-light text-text-heading rounded-tl-xs shadow-2xs font-body'
                    }`}
                >
                  {isUser ? (
                    <p className="whitespace-pre-wrap font-medium">{msg.content}</p>
                  ) : (
                    <div className="markdown-body prose prose-xs max-w-none dark:prose-invert">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                  )}

                  <div
                    className={`text-[10px] mt-1.5 font-mono ${isUser ? 'text-white/80 text-right' : 'text-text-muted'
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
            <div className="w-8 h-8 rounded-2xl bg-primary text-white flex items-center justify-center shrink-0 shadow-2xs">
              <Bot className="w-4 h-4 animate-bounce" />
            </div>
            <div className="p-3 bg-bg-main border border-border-light rounded-2xl rounded-tl-xs text-xs text-text-muted flex items-center gap-2 font-medium">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-primary" />
              <span>AI Advisor is generating guidance...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggestion Chips */}
      <div className="px-6 py-3 bg-bg-main/50 border-t border-border-light overflow-x-auto flex items-center gap-2 custom-scrollbar">
        <Lightbulb className="w-3.5 h-3.5 text-amber-500 shrink-0" />
        {suggestionChips.map((chip, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleChipClick(chip)}
            disabled={isLoading}
            className="px-3 py-1.5 bg-bg-card hover:bg-primary-light/80 border border-border-light hover:border-primary/40 rounded-full text-[11px] font-semibold text-text-body hover:text-primary whitespace-nowrap transition-all cursor-pointer disabled:opacity-50 shadow-2xs"
          >
            {chip}
          </button>
        ))}
      </div>

      {/* Message Input Form */}
      <form onSubmit={handleSubmit} className="p-4 bg-bg-card border-t border-border-light flex items-center gap-2">
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
          placeholder={`Ask your AI Career Counselor about ${targetRole || 'your target role'}...`}
          disabled={isLoading}
          className="flex-1 px-4 py-2.5 bg-bg-main border border-border-light rounded-xl text-xs text-text-heading placeholder-text-placeholder focus:outline-none focus:border-primary transition-colors disabled:opacity-50 font-body"
        />
        <button
          type="submit"
          disabled={isLoading || !inputMessage.trim()}
          className="px-4 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shadow-2xs"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Send</span>
        </button>
      </form>

    </div>
  );
};

export default CareerCounselorChat;
