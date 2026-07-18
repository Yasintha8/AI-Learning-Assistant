import { useState, useEffect, useRef } from 'react';
import { init } from 'pptx-preview';

// Renders a .pptx file's slides in-page by parsing the raw file client-side
// (pptx-preview), mirroring how DocxViewer renders .docx files.
const PptxViewer = ({ fileUrl, className = 'w-full h-[70vh]' }) => {
  const wrapperRef = useRef(null);
  const previewerRef = useRef(null);
  const [status, setStatus] = useState('loading'); // loading | ready | error

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');

    const render = async () => {
      try {
        const response = await fetch(fileUrl);
        if (!response.ok) throw new Error('Failed to fetch document file');
        const buffer = await response.arrayBuffer();
        if (cancelled || !wrapperRef.current) return;

        wrapperRef.current.innerHTML = '';
        const previewer = init(wrapperRef.current, {
          width: 960,
          height: 540,
          mode: 'list',
        });
        previewerRef.current = previewer;
        await previewer.preview(buffer);
        if (!cancelled) setStatus('ready');
      } catch (error) {
        console.error('Failed to render PPTX preview:', error);
        if (!cancelled) setStatus('error');
      }
    };

    if (fileUrl) render();

    return () => {
      cancelled = true;
      previewerRef.current?.destroy?.();
      previewerRef.current = null;
    };
  }, [fileUrl]);

  return (
    <div className={`${className} overflow-auto bg-border-light relative`}>
      {status === 'loading' && (
        <div className="absolute inset-0 flex items-center justify-center text-sm text-text-muted">
          Loading presentation preview...
        </div>
      )}
      {status === 'error' && (
        <div className="absolute inset-0 flex items-center justify-center text-sm text-error">
          Failed to render presentation preview.
        </div>
      )}
      <div ref={wrapperRef} className={`flex flex-col items-center gap-4 py-4 ${status !== 'ready' ? 'invisible' : ''}`} />
    </div>
  );
};

export default PptxViewer;