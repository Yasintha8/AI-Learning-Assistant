import { useEffect, useState } from 'react';
import moment from 'moment';
import toast from '../../utils/toast';
import { Sparkles, RefreshCw, ExternalLink, Loader2, Network } from 'lucide-react';
import resourceService from '../../services/resourceService';
import Spinner from '../common/Spinner';
import Button from '../common/Button';
import ResourceMesh, { CATEGORY_VISUALS, LEGEND_ITEMS, getResourceCategory } from './ResourceMesh';

const NODE_TYPE_LABELS = {
    document: 'Your document',
    concept: 'Key concept',
};

const Legend = () => (
    <div className="bg-bg-card border border-border-light rounded-xl p-4">
        <h4 className="text-xs font-bold text-text-heading uppercase tracking-wide mb-3">Legend</h4>
        <div className="flex flex-col gap-2">
            {LEGEND_ITEMS.map((item) => (
                <div key={item.key} className="flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full shrink-0 ${item.swatchClass}`} />
                    <span className="text-xs text-text-body">{item.label}</span>
                </div>
            ))}
        </div>
    </div>
);

const STAGES = [
    'Scanning key topics & concepts...',
    'Searching live web resources via Claude AI...',
    'Synthesizing concept connections & assembling interactive mesh...'
];

const ResourceExplorer = ({ documentId, documentTitle }) => {
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [generationStage, setGenerationStage] = useState(0);
    const [graph, setGraph] = useState(null);
    const [selectedNode, setSelectedNode] = useState(null);

    useEffect(() => {
        let isMounted = true;
        const fetchGraph = async () => {
            try {
                const response = await resourceService.getResourceGraph(documentId);
                if (isMounted) setGraph(response?.data || null);
            } catch (error) {
                // If it's a 404 (no resources generated yet), do not show an error toast
                if (error?.statusCode !== 404 && error?.status !== 404 && isMounted) {
                    toast.error(error.message || 'Failed to load related resources.');
                }
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchGraph();
        return () => { isMounted = false; };
    }, [documentId]);

    const handleGenerate = async (force) => {
        setGenerating(true);
        setGenerationStage(0);
        setSelectedNode(null);

        // Progress stage ticker every 9 seconds
        const stageInterval = setInterval(() => {
            setGenerationStage((prev) => (prev < STAGES.length - 1 ? prev + 1 : prev));
        }, 9000);

        try {
            const response = await resourceService.generateResourceGraph(documentId, force);
            setGraph(response.data);
            toast.success('Related resources generated successfully!');
        } catch (error) {
            // Self-healing: check if backend actually completed and saved into MongoDB
            try {
                const check = await resourceService.getResourceGraph(documentId);
                if (check?.data) {
                    setGraph(check.data);
                    toast.success('Related resources generated successfully!');
                    return;
                }
            } catch (_) {}

            toast.error(error.message || 'Failed to generate related resources.');
        } finally {
            clearInterval(stageInterval);
            setGenerating(false);
        }
    };

    if (loading) {
        return (
            <div className="bg-bg-card border border-border-light rounded-3xl p-8 shadow-xs space-y-6 animate-pulse" aria-busy="true" aria-label="Loading resources">
                <div className="flex justify-between items-center pb-4 border-b border-border-light">
                    <div className="h-6 w-48 bg-border-medium/60 rounded-md" />
                    <div className="h-9 w-32 bg-border-light rounded-xl" />
                </div>
                <div className="h-96 rounded-2xl bg-bg-main border border-border-light/60 flex items-center justify-center p-8">
                    <div className="space-y-4 text-center w-full max-w-md">
                        <div className="w-16 h-16 rounded-full bg-border-medium/60 mx-auto" />
                        <div className="h-4 w-3/4 bg-border-medium/60 rounded mx-auto" />
                        <div className="h-3 w-1/2 bg-border-light rounded mx-auto" />
                    </div>
                </div>
            </div>
        );
    }

    if (!graph) {
        return (
            <div className="flex items-center justify-center py-12 px-6 border-2 border-dashed border-border-medium rounded-2xl bg-bg-card/50">
                {generating ? (
                    <div className="flex flex-col items-center text-center gap-5 max-w-md animate-fade-in py-6">
                        <div className="relative flex items-center justify-center">
                            <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-sm shadow-primary-shadow/30">
                                <Network className="w-8 h-8 animate-pulse text-primary" strokeWidth={2} />
                            </div>
                            <span className="absolute -top-1 -right-1 flex h-4 w-4">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-4 w-4 bg-primary"></span>
                            </span>
                        </div>

                        <div className="space-y-2">
                            <h3 className="text-base font-bold text-text-heading tracking-tight">
                                Generating Related Resources Mesh
                            </h3>
                            <p className="text-xs font-semibold text-primary transition-all duration-300">
                                {STAGES[generationStage]}
                            </p>
                            <p className="text-xs text-text-muted leading-relaxed max-w-xs mx-auto">
                                Claude is performing live web searches to find verified citations and interactive connections. This takes ~25–35 seconds.
                            </p>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-bg-main rounded-full h-1.5 overflow-hidden border border-border-light">
                            <div
                                className="bg-primary h-full transition-all duration-1000 ease-out rounded-full"
                                style={{ width: `${((generationStage + 1) / STAGES.length) * 90}%` }}
                            />
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center text-center gap-4 max-w-sm">
                        <div className="w-14 h-14 rounded-2xl bg-linear-to-br from-primary to-blue-400 flex items-center justify-center shadow-sm shadow-primary-shadow">
                            <Network className="w-6 h-6 text-white" strokeWidth={2} />
                        </div>
                        <div className="space-y-1.5">
                            <h3 className="text-base font-bold text-text-heading tracking-tight">Discover Related Resources</h3>
                            <p className="text-sm text-text-muted leading-relaxed">
                                Let AI search the web for articles, videos, and courses related to this document, and explore how they connect as a mesh.
                            </p>
                        </div>
                        <Button onClick={() => handleGenerate(false)}>
                            <Sparkles className="w-4 h-4" strokeWidth={2.5} />
                            Discover Related Resources
                        </Button>
                    </div>
                )}
            </div>
        );
    }

    const selectedCategory = selectedNode?.type === 'resource' ? getResourceCategory(selectedNode.resourceType) : null;
    const selectedVisual = selectedCategory ? CATEGORY_VISUALS[selectedCategory] : null;

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                    <h3 className="text-sm font-bold text-text-heading tracking-tight">Related Resources Mesh</h3>
                    <p className="text-xs text-text-muted">
                        Generated {moment(graph.generatedAt).fromNow()}
                    </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => handleGenerate(true)} disabled={generating}>
                    <RefreshCw className={`w-4 h-4 ${generating ? 'animate-spin' : ''}`} />
                    Regenerate
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
                <div className="lg:col-span-2">
                    <ResourceMesh
                        graph={graph}
                        documentTitle={documentTitle}
                        selectedId={selectedNode?.id}
                        onSelectNode={setSelectedNode}
                    />
                </div>

                <div className="flex flex-col gap-4">
                    <Legend />

                    <div className="bg-bg-card border border-border-light rounded-xl p-4 min-h-40">
                        {!selectedNode ? (
                            <p className="text-sm text-text-muted leading-relaxed">
                                Click any node in the mesh to see details here — your document at the center, key concepts branching out, and suggested resources attached to each concept.
                            </p>
                        ) : selectedNode.type === 'resource' ? (
                            <div className="flex flex-col gap-3">
                                {selectedVisual && (
                                    <span className={`self-start text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full ${selectedVisual.badgeClass}`}>
                                        {selectedNode.resourceType}
                                    </span>
                                )}
                                <h4 className="text-sm font-bold text-text-heading leading-snug">{selectedNode.label}</h4>
                                {selectedNode.description && (
                                    <p className="text-sm text-text-body leading-relaxed">{selectedNode.description}</p>
                                )}
                                <a
                                    href={selectedNode.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 text-sm text-primary hover:text-primary-hover font-medium transition-colors"
                                >
                                    Open resource
                                    <ExternalLink size={14} />
                                </a>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-2">
                                <span className="self-start text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-border-light text-text-muted">
                                    {NODE_TYPE_LABELS[selectedNode.type]}
                                </span>
                                <h4 className="text-sm font-bold text-text-heading leading-snug">{selectedNode.label}</h4>
                                {selectedNode.type === 'concept' && (
                                    <p className="text-sm text-text-muted leading-relaxed">
                                        {graph.resources.filter((r) => r.conceptIds?.includes(selectedNode.id)).length} related resource(s) attached to this concept.
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ResourceExplorer;