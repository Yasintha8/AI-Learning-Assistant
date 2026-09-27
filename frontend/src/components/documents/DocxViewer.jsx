import { useState, useEffect, useRef } from 'react';
import { renderAsync } from 'docx-preview';
import { RefreshCw, Download, AlertCircle } from 'lucide-react';

const MIN_SCALE = 0.5;
const MAX_SCALE = 1.8;
const OUTER_PADDING = 48; // breathing room so the page doesn't touch the edges

// Renders a .docx file exactly as Word would - real fonts, spacing, tables,
// and page breaks - by parsing the raw file client-side (docx-preview).
const DocxViewer = ({ fileUrl, className = 'w-full h-[70vh]' }) => {
  const outerRef = useRef(null);
  const contentRef = useRef(null);
  const [status, setStatus] = useState('loading'); // loading | ready | error
  const [errorMessage, setErrorMessage] = useState('');
  const [sizerStyle, setSizerStyle] = useState(null);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    setErrorMessage('');
    setSizerStyle(null);

    const render = async () => {
      try {
        if (!fileUrl) {
          throw new Error('No document file URL provided.');
        }

        // Clean & ensure valid URL encoding so spaces and brackets in filenames resolve properly
        let safeUrl = fileUrl;
        try {
          safeUrl = encodeURI(decodeURI(fileUrl));
        } catch {
          safeUrl = fileUrl;
        }

        const response = await fetch(safeUrl);
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Document file not found on the server.');
          }
          throw new Error(`Failed to fetch document file (${response.status})`);
        }

        const blob = await response.blob();
        if (cancelled || !contentRef.current) return;

        contentRef.current.innerHTML = '';
        await renderAsync(blob, contentRef.current, contentRef.current, {
          className: 'docx-viewer',
          inWrapper: true,
          ignoreLastRenderedPageBreak: false,
        });
        if (cancelled) return;

        const pageEl = contentRef.current.querySelector('.docx-viewer');
        const naturalWidth = pageEl ? pageEl.getBoundingClientRect().width : contentRef.current.scrollWidth;

        contentRef.current.style.width = `${naturalWidth}px`;
        const naturalHeight = contentRef.current.scrollHeight;

        const availableWidth = (outerRef.current?.clientWidth || naturalWidth) - OUTER_PADDING;
        const scale = naturalWidth > 0
          ? Math.min(MAX_SCALE, Math.max(MIN_SCALE, availableWidth / naturalWidth))
          : 1;

        setSizerStyle({
          width: naturalWidth * scale,
          height: naturalHeight * scale,
          margin: '0 auto',
        });
        contentRef.current.style.transform = `scale(${scale})`;
        contentRef.current.style.transformOrigin = 'top left';

        setStatus('ready');
      } catch (error) {
        console.error('Failed to render DOCX preview:', error);
        if (!cancelled) {
          setErrorMessage(error.message || 'Failed to render document preview.');
          setStatus('error');
        }
      }
    };

    render();

    return () => {
      cancelled = true;
    };
  }, [fileUrl, retryKey]);

  const handleRetry = () => {
    setStatus('loading');
    setRetryKey(k => k + 1);
  };

  return (
    <div ref={outerRef} className={`${className} overflow-auto bg-border-light relative py-6`}>
      {status === 'loading' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-bg-main/70 backdrop-blur-xs text-sm text-text-muted z-10">
          <div className="w-8 h-8 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
          <span>Loading document preview...</span>
        </div>
      )}

      {status === 'error' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center z-10">
          <AlertCircle className="w-8 h-8 text-rose-500" />
          <p className="text-sm font-semibold text-text-heading">
            {errorMessage || 'Failed to render document preview.'}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <button
              type="button"
              onClick={handleRetry}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-border-medium bg-bg-card text-xs font-bold text-text-heading hover:bg-border-light transition-colors cursor-pointer shadow-xs"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
            {fileUrl && (
              <a
                href={fileUrl}
                download
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-hover transition-colors shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download File</span>
              </a>
            )}
          </div>
        </div>
      )}

      <div style={sizerStyle || undefined} className={status !== 'ready' ? 'invisible' : ''}>
        <div ref={contentRef} />
      </div>
    </div>
  );
};

export default DocxViewer;