import { useState, useEffect, useRef } from 'react';
import { init } from 'pptx-preview';
import JSZip from 'jszip';
import { RefreshCw, Download, AlertCircle } from 'lucide-react';

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

// Renders a .pptx file's slides in-page by parsing the raw file client-side (pptx-preview).
// Slides are sized to fill the available container width instead of a fixed 960x540 box.
const PptxViewer = ({ fileUrl, className = 'w-full h-[70vh]' }) => {
  const outerRef = useRef(null);
  const wrapperRef = useRef(null);
  const previewerRef = useRef(null);
  const [status, setStatus] = useState('loading'); // loading | ready | error
  const [errorMessage, setErrorMessage] = useState('');
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    setErrorMessage('');

    const render = async () => {
      try {
        if (!fileUrl) {
          throw new Error('No presentation file URL provided.');
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
            throw new Error('Presentation file not found on the server.');
          }
          throw new Error(`Failed to fetch presentation file (${response.status})`);
        }

        const buffer = await response.arrayBuffer();
        if (cancelled || !wrapperRef.current || !outerRef.current) return;

        const aspectRatio = await getSlideAspectRatio(buffer);
        if (cancelled) return;

        const clientWidth = outerRef.current?.clientWidth || 800;
        const availableWidth = clientWidth - OUTER_PADDING;
        const width = Math.round(Math.max(MIN_WIDTH, Math.min(availableWidth, MAX_WIDTH)));
        const height = Math.round(width * aspectRatio);

        wrapperRef.current.innerHTML = '';
        const previewer = init(wrapperRef.current, { width, height, mode: 'list' });
        previewerRef.current = previewer;
        await previewer.preview(buffer);
        if (!cancelled) setStatus('ready');
      } catch (error) {
        console.error('Failed to render PPTX preview:', error);
        if (!cancelled) {
          setErrorMessage(error.message || 'Failed to render presentation preview.');
          setStatus('error');
        }
      }
    };

    render();

    return () => {
      cancelled = true;
      try {
        previewerRef.current?.destroy?.();
      } catch {
        // ignore destroy errors
      }
      previewerRef.current = null;
    };
  }, [fileUrl, retryKey]);

  const handleRetry = () => {
    setStatus('loading');
    setRetryKey(k => k + 1);
  };

  return (
    <div ref={outerRef} className={`${className} overflow-auto bg-border-light relative`}>
      {status === 'loading' && (
        <div className="absolute inset-0 p-6 sm:p-8 flex flex-col items-center justify-center bg-bg-main/90 backdrop-blur-xs z-10 animate-pulse">
          <div className="w-full max-w-2xl aspect-16/10 bg-bg-card border border-border-light rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm flex flex-col justify-between">
            <div className="space-y-3">
              <div className="h-6 w-1/2 bg-border-medium/60 rounded-md" />
              <div className="h-4 w-1/3 bg-border-light rounded" />
            </div>
            <div className="h-28 w-full bg-border-light/60 rounded-xl" />
            <div className="flex justify-between items-center pt-2 border-t border-border-light">
              <div className="h-4 w-20 bg-border-light rounded" />
              <div className="h-4 w-12 bg-border-light rounded" />
            </div>
          </div>
        </div>
      )}

      {status === 'error' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center z-10">
          <AlertCircle className="w-8 h-8 text-rose-500" />
          <p className="text-sm font-semibold text-text-heading">
            {errorMessage || 'Failed to render presentation preview.'}
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

      <div
        ref={wrapperRef}
        className={`flex flex-col items-center gap-4 py-6 ${status !== 'ready' ? 'invisible' : ''}`}
      />
    </div>
  );
};

export default PptxViewer;