import { useEffect, useState } from 'react';
import moment from 'moment';
import toast from 'react-hot-toast';
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

const ResourceExplorer = ({ documentId, documentTitle }) => {
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [graph, setGraph] = useState(null);
    const [selectedNode, setSelectedNode] = useState(null);

    useEffect(() => {
        const fetchGraph = async () => {
            try {
                const response = await resourceService.getResourceGraph(documentId);
                setGraph(response?.data || null);
            } catch (error) {
                toast.error(error.message || 'Failed to load related resources.');
            } finally {
                setLoading(false);
            }
        };

        fetchGraph();
    }, [documentId]);

    const handleGenerate = async (force) => {
        setGenerating(true);
        setSelectedNode(null);
        try {
            const response = await resourceService.generateResourceGraph(documentId, force);
            setGraph(response.data);
        } catch (error) {
            toast.error(error.message || 'Failed to generate related resources.');
        } finally {
            setGenerating(false);
        }
    };

    if (loading) {
        return <Spinner />;
    }

    if (!graph) {
        return (
            <div className="flex items-center justify-center py-16 px-6 border-2 border-dashed border-neutral-300 rounded-2xl">
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
                    <Button onClick={() => handleGenerate(false)} disabled={generating}>
                        {generating ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Searching the web...
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-4 h-4" strokeWidth={2.5} />
                                Discover Related Resources
                            </>
                        )}
                    </Button>
                </div>
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