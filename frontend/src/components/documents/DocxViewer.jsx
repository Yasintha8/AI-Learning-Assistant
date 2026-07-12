import { useState, useEffect, useRef } from 'react';
import { renderAsync } from 'docx-preview';

// Renders a .docx file exactly as Word would - real fonts, spacing, tables,
// and page breaks - by parsing the raw file client-side (docx-preview),
// rather than approximating it from plain extracted text.
const DocxViewer = ({ fileUrl, className = 'w-full h-[70vh]' }) => {
  const containerRef = useRef(null);
  const [status, setStatus] = useState('loading'); // loading | ready | error

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');

    const render = async () => {
      try {
        const response = await fetch(fileUrl);
        if (!response.ok) throw new Error('Failed to fetch document file');
        const blob = await response.blob();
        if (cancelled || !containerRef.current) return;

        containerRef.current.innerHTML = '';
        await renderAsync(blob, containerRef.current, containerRef.current, {
          className: 'docx-viewer',
          inWrapper: true,
          ignoreLastRenderedPageBreak: false,
        });
        if (!cancelled) setStatus('ready');
      } catch (error) {
        console.error('Failed to render DOCX preview:', error);
        if (!cancelled) setStatus('error');
      }
    };

    if (fileUrl) render();

    return () => {
      cancelled = true;
    };
  }, [fileUrl]);

  return (
    <div className={`${className} overflow-auto bg-border-light relative`}>
      {status === 'loading' && (
        <div className="absolute inset-0 flex items-center justify-center text-sm text-text-muted">
          Loading document preview...
        </div>
      )}
      {status === 'error' && (
        <div className="absolute inset-0 flex items-center justify-center text-sm text-error">
          Failed to render document preview.
        </div>
      )}
      <div ref={containerRef} className={status !== 'ready' ? 'invisible' : ''} />
    </div>
  );
};

export default DocxViewer;