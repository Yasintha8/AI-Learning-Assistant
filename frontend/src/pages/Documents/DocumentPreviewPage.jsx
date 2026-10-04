import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import toast from '../../utils/toast';
import { Download } from 'lucide-react';
import documentService from '../../services/documentService';
import Spinner from '../../components/common/Spinner';
import DocxViewer from '../../components/documents/DocxViewer';
import PptxViewer from '../../components/documents/PptxViewer';
import { BASE_URL } from '../../utils/apiPaths';

// Standalone, full-page document view used as the target of "Open in new tab"
const DocumentPreviewPage = () => {
  const { id } = useParams();
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDocument = async () => {
      try {
        const data = await documentService.getDocumentById(id);
        setDocument(data);
      } catch (error) {
        toast.error('Failed to fetch document details.');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchDocument();
  }, [id]);

  const getFileUrl = () => {
    if (!document?.data?.filePath) return null;

    const filePath = document.data.filePath;

    // Check if filePath is an upload path (either relative /uploads/... or absolute with any host)
    const uploadsMatch = filePath.match(/\/uploads\/documents\/.+$/);
    if (uploadsMatch) {
      const cleanUploadPath = uploadsMatch[0];
      return encodeURI(decodeURI(`${BASE_URL}${cleanUploadPath}`));
    }

    if (filePath.startsWith('http://localhost') || filePath.startsWith('http://127.0.0.1')) {
      const cleanPath = filePath.replace(/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/, '');
      if (BASE_URL && !BASE_URL.includes('localhost') && !BASE_URL.includes('127.0.0.1')) {
        return encodeURI(decodeURI(`${BASE_URL}${cleanPath.startsWith('/') ? '' : '/'}${cleanPath}`));
      }
      return encodeURI(decodeURI(filePath));
    }

    if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
      if (filePath.startsWith('http://') && typeof window !== 'undefined' && window.location.protocol === 'https:') {
        return encodeURI(decodeURI(filePath.replace(/^http:\/\//, 'https://')));
      }
      return encodeURI(decodeURI(filePath));
    }

    return encodeURI(decodeURI(`${BASE_URL}${filePath.startsWith('/') ? '' : '/'}${filePath}`));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-main p-6 space-y-4 animate-pulse" aria-busy="true" aria-label="Loading document preview">
        <div className="flex items-center justify-between pb-4 border-b border-border-light">
          <div className="h-6 w-48 bg-border-medium/60 rounded-md" />
          <div className="h-9 w-28 bg-border-light rounded-xl" />
        </div>
        <div className="bg-bg-card border border-border-light rounded-2xl h-[calc(100vh-10rem)] p-8 space-y-4 shadow-xs">
          <div className="h-8 w-2/3 bg-border-medium/60 rounded-lg" />
          <div className="space-y-3 pt-6">
            <div className="h-4 w-full bg-border-light rounded" />
            <div className="h-4 w-11/12 bg-border-light rounded" />
            <div className="h-4 w-4/5 bg-border-light rounded" />
            <div className="h-4 w-5/6 bg-border-light rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!document || !document.data || !document.data.filePath) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-bg-main text-sm text-text-muted">
        Document not available.
      </div>
    );
  }

  const fileUrl = getFileUrl();
  const rawType = (document.data.fileType || '').toLowerCase().trim();
  const fileName = (document.data.fileName || document.data.filePath || '').toLowerCase();
  const isPdf = rawType === 'pdf' || (!rawType && fileName.endsWith('.pdf'));
  const isPptx = rawType === 'pptx' || (!rawType && fileName.endsWith('.pptx'));

  return (
    <div className="min-h-screen bg-bg-main flex flex-col">
      <div className="flex items-center justify-between gap-4 px-6 h-14 border-b border-border-light bg-bg-card shrink-0">
        <span className="text-sm font-semibold text-text-heading truncate">
          {document.data.title}
        </span>
        <a
          href={fileUrl}
          download={document.data.fileName || `${document.data.title}.${rawType || 'pdf'}`}
          className="inline-flex items-center gap-1.5 text-sm text-primary hover:text-primary-hover font-medium transition-colors shrink-0"
        >
          <Download size={16} />
          <span>Download original</span>
        </a>
      </div>

      <div className="flex-1 bg-border-light">
        {isPdf ? (
          <iframe
            src={fileUrl}
            className="w-full h-full min-h-[calc(100vh-56px)]"
            title="PDF Viewer"
            frameBorder="0"
          />
        ) : isPptx ? (
          <PptxViewer
            fileUrl={fileUrl}
            className="w-full min-h-[calc(100vh-56px)]"
          />
        ) : (
          <DocxViewer
            fileUrl={fileUrl}
            className="w-full min-h-[calc(100vh-56px)]"
          />
        )}
      </div>
    </div>
  );
};

export default DocumentPreviewPage;