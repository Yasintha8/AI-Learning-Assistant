import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { dracula } from 'react-syntax-highlighter/dist/esm/styles/prism';

const MarkdownRenderer = ({ content }) => {
    return (
        <div className="text-text-muted">
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    h1: ({ node, ...props }) => <h1 className="text-xl font-bold text-text-heading tracking-tight mt-5 mb-2" {...props} />,
                    h2: ({ node, ...props }) => <h2 className="text-lg font-bold text-text-heading tracking-tight mt-4 mb-2" {...props} />,
                    h3: ({ node, ...props }) => <h3 className="text-base font-semibold text-text-heading mt-3 mb-1" {...props} />,
                    h4: ({ node, ...props }) => <h4 className="text-sm font-semibold text-text-body mt-3 mb-1" {...props} />,
                    p: ({ node, ...props }) => <p className="text-sm text-text-body leading-relaxed mb-3" {...props} />,
                    a: ({ node, ...props }) => <a className="text-primary hover:text-primary-hover underline underline-offset-2 transition-colors duration-150" {...props} />,
                    ul: ({ node, ...props }) => <ul className="list-disc list-outside pl-5 mb-3 space-y-1" {...props} />,
                    ol: ({ node, ...props }) => <ol className="list-decimal list-outside pl-5 mb-3 space-y-1" {...props} />,
                    li: ({ node, ...props }) => <li className="text-sm text-text-body leading-relaxed" {...props} />,
                    strong: ({ node, ...props }) => <strong className="font-semibold text-text-heading" {...props} />,
                    em: ({ node, ...props }) => <em className="italic text-text-body" {...props} />,
                    blockquote: ({ node, ...props }) => <blockquote className="border-l-2 border-primary/40 pl-4 my-3 text-sm text-text-muted italic" {...props} />,
                    code: ({ node, inline, className, children, ...props }) => {
                        const match = /language-(\w+)/.exec(className || '');
                        return !inline && match ? (
                            <SyntaxHighlighter
                                style={dracula}
                                language={match[1]}
                                PreTag="div"
                                {...props}
                            >
                                {String(children).replace(/\n$/, '')}
                            </SyntaxHighlighter>
                        ) : (
                            <code className="px-1.5 py-0.5 rounded-md bg-border-light text-primary text-xs font-mono" {...props}>
                                {children}
                            </code>
                        );
                    },
                    pre: ({ node, ...props }) => <pre className="rounded-md overflow-hidden my-3 text-xs" {...props} />,
                }}
            >
                {content}
            </ReactMarkdown>
        </div>
    )
}

export default MarkdownRenderer