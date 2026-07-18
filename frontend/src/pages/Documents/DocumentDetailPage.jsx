import { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import documentService from '../../services/documentService';
import Spinner from '../../components/common/Spinner';
import toast from 'react-hot-toast';
import { ArrowLeft, ExternalLink, Map } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import Tabs from '../../components/common/Tabs';
import ChatInterface from '../../components/chat/ChatInterface';
import AIActions from '../../components/ai/AIActions';
import ResourceExplorer from '../../components/resources/ResourceExplorer';
import FlashcardManager from '../../components/flashcards/FlashcardManager';
import QuizManager from '../../components/quizzes/QuizManager';
import DocxViewer from '../../components/documents/DocxViewer';
import { BASE_URL } from '../../utils/apiPaths';

const YOUTUBE_URL_REGEX = /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/;

const getYoutubeEmbedUrl = (url) => {
  const match = url.match(YOUTUBE_URL_REGEX);
  return match ? `https://www.youtube.com/embed/${match[1]}` : null;
};

const DocumentDetailPage = () => {

  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const VALID_TABS = ['Content', 'Chat', 'AI Actions', 'Related Resources', 'Flashcards', 'Quizzes'];
  const requestedTab = searchParams.get('tab');

  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(
    VALID_TABS.includes(requestedTab) ? requestedTab : 'Content'
  );

  useEffect(() => {
    const fetchDocumentDetails = async () => {
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

    fetchDocumentDetails();
  }, [id]);

  // Helper function to get the full file URL
  const getFileUrl = () => {
    if (!document?.data?.filePath) return null;

    const filePath = document.data.filePath;

    if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
      return filePath;
    }

    return `${BASE_URL}${filePath.startsWith('/') ? '' : '/'}${filePath}`;
  };

  const renderContent = () => {
    if (loading) {
      return <Spinner />;
    }
    if (!document || !document.data || !document.data.filePath) {
      return <div className="text-center p-8">Document not available.</div>;
    }

    const fileUrl = getFileUrl();
    const fileType = document.data.fileType;
    const isPdf = fileType === 'pdf';
    const isYoutube = fileType === 'youtube';
    const isWebsite = fileType === 'website';
    // Only DOCX needs the internal preview route (raw file downloads instead of viewing);
    // PDF, YouTube, and website links can all be opened directly at their real source.
    const openInNewTabHref = fileType === 'docx' ? `/documents/${id}/preview` : fileUrl;

    return (
      <div className="bg-bg-card border border-border-medium rounded-lg overflow-hidden shadow-sm">
        <div className="flex items-center justify-between p-4 bg-bg-main border-b border-border-medium">
          <span className="text-sm font-medium text-text-heading">Document Viewer</span>
          <a
            href={openInNewTabHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-primary hover:text-primary-hover font-medium transition-colors"
          >
            <ExternalLink size={16} />
            Open in new tab
          </a>
        </div>
        {isPdf ? (
          <div className="bg-border-light p-1">
            <iframe
              src={fileUrl}
              className="w-full h-[70vh] bg-bg-card rounded border border-border-medium"
              title="PDF Viewer"
              frameBorder="0"
              style={{
                colorScheme: 'light',
              }}
            />
          </div>
        ) : isYoutube ? (
          <div className="bg-black">
            <iframe
              src={getYoutubeEmbedUrl(fileUrl)}
              className="w-full h-[70vh]"
              title="YouTube Video"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        ) : isWebsite ? (
          document.data.status === 'ready' && document.data.extractedText ? (
            <div className="w-full h-[70vh] overflow-y-auto bg-border-light p-6">
              <div className="max-w-3xl mx-auto bg-bg-card border border-border-light rounded-xl shadow-sm p-10">
                <p className="whitespace-pre-wrap text-sm text-text-body leading-relaxed">
                  {document.data.extractedText}
                </p>
              </div>
            </div>
          ) : (
            <div className="w-full h-[70vh] flex items-center justify-center bg-border-light text-sm text-text-muted">
              {document.data.status === 'error'
                ? 'Failed to process website content.'
                : 'Processing website...'}
            </div>
          )
        ) : document.data.status === 'ready' ? (
          <DocxViewer fileUrl={fileUrl} />
        ) : (
          <div className="w-full h-[70vh] flex items-center justify-center bg-border-light text-sm text-text-muted">
            {document.data.status === 'error'
              ? 'Failed to process document content.'
              : 'Processing document...'}
          </div>
        )}
      </div >
    );
  };

  const renderChat = () => {
    return <ChatInterface />
  };

  const renderAIActions = () => {
    return <AIActions />
  };

  const renderRelatedResources = () => {
    return <ResourceExplorer documentId={id} documentTitle={document?.data?.title || ''} />
  };

  const renderFlashcardsTab = () => {
    return <FlashcardManager documentId={id} />
  };

  const renderQuizzesTab = () => {
    return <QuizManager documentId={id} />
  };

  const tabs = [
    { name: 'Content', label: 'Content', content: renderContent() },
    { name: 'Chat', label: 'Chat', content: renderChat() },
    { name: 'AI Actions', label: 'AI Actions', content: renderAIActions() },
    { name: 'Related Resources', label: 'Related Resources', content: renderRelatedResources() },
    { name: 'Flashcards', label: 'Flashcards', content: renderFlashcardsTab() },
    { name: 'Quizzes', label: 'Quizzes', content: renderQuizzesTab() },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner />
      </div>
    )
  }

  if (!document) {
    return <div className="text-center p-8">Document not found.</div>;
  }

  return (
    <div>
      <div className='mb-4'>
        <Link to="/documents" className='inline-flex items-center gap-2 text-sm text-muted hover:text-primary transition-colors'>
          <ArrowLeft size={16} />
          Back to Documents
        </Link>
      </div>
      <PageHeader title={document.data.title}>
        <Link
          to={`/documents/${id}/learning-path`}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-border-medium bg-bg-card text-sm font-semibold text-text-body hover:bg-border-light transition-colors duration-150"
        >
          <Map className="w-4 h-4 text-primary" strokeWidth={2} />
          Learning Path
        </Link>
      </PageHeader>
      <Tabs tabs={tabs} activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  )
}

export default DocumentDetailPage;