import { useState, useEffect, useRef } from 'react';
import { renderAsync } from 'docx-preview';

const MIN_SCALE = 0.5;
const MAX_SCALE = 1.8;
const OUTER_PADDING = 48; // breathing room so the page doesn't touch the edges

// Renders a .docx file exactly as Word would - real fonts, spacing, tables,
// and page breaks - by parsing the raw file client-side (docx-preview),
// rather than approximating it from plain extracted text.
const DocxViewer = ({ fileUrl, className = 'w-full h-[70vh]' }) => {
  const outerRef = useRef(null);
  const contentRef = useRef(null);
  const [status, setStatus] = useState('loading'); // loading | ready | error
  const [sizerStyle, setSizerStyle] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    setSizerStyle(null);

    const render = async () => {
      try {
        const response = await fetch(fileUrl);
        if (!response.ok) throw new Error('Failed to fetch document file');
        const blob = await response.blob();
        if (cancelled || !contentRef.current) return;

        contentRef.current.innerHTML = '';
        await renderAsync(blob, contentRef.current, contentRef.current, {
          className: 'docx-viewer',
          inWrapper: true,
          ignoreLastRenderedPageBreak: false,
        });
        if (cancelled) return;

        // docx-preview renders the page at its real paper size (e.g. ~816px
        // for Letter) inside a wrapper that flex-centers it, which looks
        // tiny/cramped on a wide screen - scale it up (or down) so the page
        // fills the available width instead. The page element (class
        // "docx-viewer") has a fixed CSS width baked in regardless of its
        // ancestors, so it's a stable basis for the natural width.
        const pageEl = contentRef.current.querySelector('.docx-viewer');
        const naturalWidth = pageEl ? pageEl.getBoundingClientRect().width : contentRef.current.scrollWidth;

        // Pin the content div to that same width so the wrapper's own
        // flex-centering doesn't add extra margin around the page - without
        // this, the wrapper inherits the (larger, already-scaled) sizer
        // width below, and transform-scaling it on top double-scales
        // everything and overflows the sizer box.
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
        if (!cancelled) setStatus('error');
      }
    };

    if (fileUrl) render();

    return () => {
      cancelled = true;
    };
  }, [fileUrl]);

  return (
    <div ref={outerRef} className={`${className} overflow-auto bg-border-light relative py-6`}>
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
      <div style={sizerStyle || undefined} className={status !== 'ready' ? 'invisible' : ''}>
        <div ref={contentRef} />
      </div>
    </div>
  );
};

export default DocxViewer;