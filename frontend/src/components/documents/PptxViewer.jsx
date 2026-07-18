import { useState, useEffect, useRef } from 'react';
import { init } from 'pptx-preview';
import JSZip from 'jszip';

const DEFAULT_ASPECT_RATIO = 9 / 16; // fallback: widescreen 16:9
const MIN_WIDTH = 480;
const MAX_WIDTH = 1400;
const OUTER_PADDING = 48; // breathing room so the slide doesn't touch the edges

// Reads the deck's real slide size from presentation.xml so slides render at
// their true aspect ratio instead of an arbitrary fixed box.
const getSlideAspectRatio = async (buffer) => {
  try {
    const zip = await JSZip.loadAsync(buffer);
    const xml = await zip.file('ppt/presentation.xml')?.async('text');
    const match = xml?.match(/<p:sldSz[^>]*\bcx="(\d+)"[^>]*\bcy="(\d+)"/);
    if (match) {
      const cx = parseInt(match[1], 10);
      const cy = parseInt(match[2], 10);
      if (cx > 0 && cy > 0) return cy / cx;
    }
  } catch {
    // fall through to the default aspect ratio
  }
  return DEFAULT_ASPECT_RATIO;
};

// Renders a .pptx file's slides in-page by parsing the raw file client-side
// (pptx-preview), mirroring how DocxViewer renders .docx files. Slides are
// sized to fill the available container width instead of a fixed 960x540 box.
const PptxViewer = ({ fileUrl, className = 'w-full h-[70vh]' }) => {
  const outerRef = useRef(null);
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
        if (cancelled || !wrapperRef.current || !outerRef.current) return;

        const aspectRatio = await getSlideAspectRatio(buffer);
        if (cancelled) return;

        const availableWidth = outerRef.current.clientWidth - OUTER_PADDING;
        const width = Math.round(Math.max(MIN_WIDTH, Math.min(availableWidth, MAX_WIDTH)));
        const height = Math.round(width * aspectRatio);

        wrapperRef.current.innerHTML = '';
        const previewer = init(wrapperRef.current, { width, height, mode: 'list' });
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
    <div ref={outerRef} className={`${className} overflow-auto bg-border-light relative`}>
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
      <div ref={wrapperRef} className={`flex flex-col items-center gap-4 py-6 ${status !== 'ready' ? 'invisible' : ''}`} />
    </div>
  );
};

export default PptxViewer;