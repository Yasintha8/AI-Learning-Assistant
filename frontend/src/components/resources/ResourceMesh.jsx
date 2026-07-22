import { useEffect, useMemo, useState } from 'react';
import { forceSimulation, forceLink, forceManyBody, forceCenter, forceCollide } from 'd3-force';

const WIDTH = 800;
const HEIGHT = 560;
const SIMULATION_TICKS = 300;

const NODE_RADIUS = { document: 34, concept: 20, resource: 12 };

// Every resource `type` from the backend (article, paper, website, video, course) maps down
// to one of a small set of visual categories, so the mesh reads at a glance from color alone
// rather than needing five near-identical hues for closely related resource types.
const RESOURCE_TYPE_CATEGORY = {
    video: 'video',
    course: 'course',
    article: 'resource',
    paper: 'resource',
    website: 'resource',
};

export const getResourceCategory = (resourceType) => RESOURCE_TYPE_CATEGORY[resourceType] || 'resource';

// Single source of truth for node/legend colors: textClass drives the SVG node fill
// (via currentColor), swatchClass drives the HTML legend dot, badgeClass drives the
// detail-panel type badge.
export const CATEGORY_VISUALS = {
    document: { label: 'Document', textClass: 'text-primary', swatchClass: 'bg-primary' },
    concept: { label: 'Key Concept', textClass: 'text-blue-500', swatchClass: 'bg-blue-500' },
    video: { label: 'Video', textClass: 'text-red-500', swatchClass: 'bg-red-500', badgeClass: 'bg-red-100 text-red-700' },
    course: { label: 'Course', textClass: 'text-emerald-500', swatchClass: 'bg-emerald-500', badgeClass: 'bg-emerald-100 text-emerald-700' },
    resource: { label: 'Resource', textClass: 'text-violet-500', swatchClass: 'bg-violet-500', badgeClass: 'bg-violet-100 text-violet-700' },
};

export const LEGEND_ITEMS = ['document', 'concept', 'video', 'course', 'resource'].map((key) => ({
    key,
    label: CATEGORY_VISUALS[key].label,
    swatchClass: CATEGORY_VISUALS[key].swatchClass,
}));

const truncate = (text, max) => (text && text.length > max ? `${text.slice(0, max - 1)}…` : text);

// Turn the { concepts, resources } graph payload into d3-force nodes/links, including
// derived resource<->resource links for resources that share a concept - this is what
// gives the visualization its "mesh" feel rather than a strict document->concept->resource tree.
const buildGraphData = (graph, documentTitle) => {
    const nodes = [
        { id: 'document', type: 'document', label: documentTitle },
        ...graph.concepts.map((c) => ({ id: c.conceptId, type: 'concept', label: c.title })),
        ...graph.resources.map((r) => ({
            id: r.resourceId,
            type: 'resource',
            label: r.title,
            url: r.url,
            description: r.description,
            resourceType: r.type,
            conceptIds: r.conceptIds || [],
        })),
    ];

    const links = graph.concepts.map((c) => ({
        source: 'document',
        target: c.conceptId,
        kind: 'document-concept',
    }));

    const conceptToResources = new Map();
    graph.resources.forEach((r) => {
        (r.conceptIds || []).forEach((conceptId) => {
            links.push({ source: conceptId, target: r.resourceId, kind: 'concept-resource' });
            if (!conceptToResources.has(conceptId)) conceptToResources.set(conceptId, []);
            conceptToResources.get(conceptId).push(r.resourceId);
        });
    });

    const seenPairs = new Set();
    conceptToResources.forEach((resourceIds) => {
        for (let i = 0; i < resourceIds.length; i++) {
            for (let j = i + 1; j < resourceIds.length; j++) {
                const pairKey = [resourceIds[i], resourceIds[j]].sort().join('::');
                if (seenPairs.has(pairKey)) continue;
                seenPairs.add(pairKey);
                links.push({ source: resourceIds[i], target: resourceIds[j], kind: 'resource-resource' });
            }
        }
    });

    return { nodes, links };
};

const ResourceMesh = ({ graph, documentTitle, selectedId, onSelectNode }) => {
    const graphData = useMemo(() => buildGraphData(graph, documentTitle), [graph, documentTitle]);
    const [layout, setLayout] = useState(null);

    useEffect(() => {
        const nodes = graphData.nodes.map((n) => ({ ...n }));
        const links = graphData.links.map((l) => ({ ...l }));

        const documentNode = nodes.find((n) => n.id === 'document');
        if (documentNode) {
            documentNode.fx = WIDTH / 2;
            documentNode.fy = HEIGHT / 2;
        }

        const simulation = forceSimulation(nodes)
            .force(
                'link',
                forceLink(links)
                    .id((d) => d.id)
                    .distance((l) => {
                        if (l.kind === 'document-concept') return 170;
                        if (l.kind === 'concept-resource') return 90;
                        return 70;
                    })
                    .strength((l) => (l.kind === 'resource-resource' ? 0.1 : 0.6))
            )
            .force('charge', forceManyBody().strength(-220))
            .force('center', forceCenter(WIDTH / 2, HEIGHT / 2))
            .force('collide', forceCollide().radius((d) => NODE_RADIUS[d.type] + 14))
            .stop();

        for (let i = 0; i < SIMULATION_TICKS; i++) simulation.tick();

        setLayout({ nodes, links });
    }, [graphData]);

    if (!layout) return null;

    const nodesById = new Map(layout.nodes.map((n) => [n.id, n]));

    return (
        <div className="w-full overflow-auto rounded-xl border border-border-light bg-bg-main">
            <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full h-[560px] min-w-[600px]">
                <g>
                    {layout.links.map((link, i) => {
                        const source = nodesById.get(link.source.id ?? link.source);
                        const target = nodesById.get(link.target.id ?? link.target);
                        if (!source || !target) return null;
                        const isMesh = link.kind === 'resource-resource';

                        return (
                            <line
                                key={i}
                                x1={source.x}
                                y1={source.y}
                                x2={target.x}
                                y2={target.y}
                                stroke="currentColor"
                                className="text-border-medium"
                                strokeWidth={link.kind === 'document-concept' ? 2 : 1}
                                strokeDasharray={isMesh ? '3 4' : undefined}
                                opacity={isMesh ? 0.45 : 0.85}
                            />
                        );
                    })}
                </g>
                <g>
                    {layout.nodes.map((node) => {
                        const radius = NODE_RADIUS[node.type];
                        const isSelected = node.id === selectedId;
                        const colorClass =
                            node.type === 'document'
                                ? CATEGORY_VISUALS.document.textClass
                                : node.type === 'concept'
                                    ? CATEGORY_VISUALS.concept.textClass
                                    : CATEGORY_VISUALS[getResourceCategory(node.resourceType)].textClass;

                        return (
                            <g
                                key={node.id}
                                transform={`translate(${node.x}, ${node.y})`}
                                onClick={() => onSelectNode(node)}
                                className="cursor-pointer"
                            >
                                <circle
                                    r={radius}
                                    className={colorClass}
                                    fill="currentColor"
                                    fillOpacity={node.type === 'document' ? 1 : 0.85}
                                    stroke={isSelected ? 'var(--color-text-heading)' : 'var(--color-bg-card)'}
                                    strokeWidth={isSelected ? 3 : 2}
                                />
                                <text
                                    y={radius + 14}
                                    textAnchor="middle"
                                    className="fill-text-body text-[10px] font-medium select-none"
                                >
                                    {truncate(node.label, node.type === 'document' ? 26 : 18)}
                                </text>
                            </g>
                        );
                    })}
                </g>
            </svg>
        </div>
    );
};

export default ResourceMesh;