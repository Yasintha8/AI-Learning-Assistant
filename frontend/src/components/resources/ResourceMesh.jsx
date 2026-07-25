import { useEffect, useMemo, useRef, useState } from 'react';
import { forceSimulation, forceLink, forceManyBody, forceCenter, forceCollide } from 'd3-force';

const WIDTH = 800;
const HEIGHT = 560;
const SIMULATION_TICKS = 300; // synchronous warm-up so the mesh appears already settled, no visible animation on load
const DRAG_ALPHA_TARGET = 0.3; // reheats the simulation while dragging so connected nodes react
const DRAG_THRESHOLD_PX = 4; // pointer movement past this counts as a drag rather than a click

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
    const svgRef = useRef(null);
    const simulationRef = useRef(null);
    const dragRef = useRef(null); // { id, moved, startClientX, startClientY } while a pointer is down on a node

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

        // Keep the simulation alive (but idle) so dragging can reheat it later and have
        // connected nodes react live, instead of only ever showing a static layout.
        simulation.on('tick', () => setLayout({ nodes: simulation.nodes(), links }));
        simulationRef.current = simulation;
        setLayout({ nodes: simulation.nodes(), links });

        return () => {
            simulation.stop();
            simulationRef.current = null;
        };
    }, [graphData]);

    if (!layout) return null;

    const nodesById = new Map(layout.nodes.map((n) => [n.id, n]));

    // Pointer coordinates arrive in screen/CSS pixels; convert into the SVG's own viewBox
    // coordinate space so dragging tracks the cursor correctly regardless of how the
    // responsive SVG is currently scaled.
    const toSvgPoint = (clientX, clientY) => {
        const svg = svgRef.current;
        const point = svg.createSVGPoint();
        point.x = clientX;
        point.y = clientY;
        return point.matrixTransform(svg.getScreenCTM().inverse());
    };

    const handlePointerDown = (event, node) => {
        event.stopPropagation();
        event.currentTarget.setPointerCapture(event.pointerId);
        dragRef.current = {
            id: node.id,
            moved: false,
            startClientX: event.clientX,
            startClientY: event.clientY,
        };
    };

    const handlePointerMove = (event, node) => {
        const drag = dragRef.current;
        if (!drag || drag.id !== node.id) return;

        if (!drag.moved) {
            const dx = event.clientX - drag.startClientX;
            const dy = event.clientY - drag.startClientY;
            if (Math.hypot(dx, dy) < DRAG_THRESHOLD_PX) return;

            drag.moved = true;
            simulationRef.current?.alphaTarget(DRAG_ALPHA_TARGET).restart();
        }

        const { x, y } = toSvgPoint(event.clientX, event.clientY);
        node.fx = x;
        node.fy = y;
    };

    const handlePointerUp = (event, node) => {
        const drag = dragRef.current;
        event.currentTarget.releasePointerCapture(event.pointerId);
        dragRef.current = null;

        if (drag?.moved) {
            // Cool the simulation back down; the node stays pinned wherever it was dropped
            // (the document node is always pinned this way too) so the user's arrangement sticks.
            simulationRef.current?.alphaTarget(0);
        } else {
            onSelectNode(node);
        }
    };

    return (
        <div className="w-full overflow-auto rounded-xl border border-border-light bg-bg-main">
            <svg ref={svgRef} viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full h-140 min-w-150">
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
                                onPointerDown={(event) => handlePointerDown(event, node)}
                                onPointerMove={(event) => handlePointerMove(event, node)}
                                onPointerUp={(event) => handlePointerUp(event, node)}
                                className="cursor-grab active:cursor-grabbing"
                                style={{ touchAction: 'none' }}
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