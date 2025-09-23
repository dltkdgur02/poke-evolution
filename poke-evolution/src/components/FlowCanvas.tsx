import { useEffect } from 'react';
import ReactFlow, { MiniMap, Controls, Background, useReactFlow, type Node, type Edge } from 'reactflow';

interface FlowCanvasProps {
    nodes: Node[];
    edges: Edge[];
    nodeTypes: any;
    edgeTypes: any;
}

function FlowCanvas({ nodes, edges, nodeTypes, edgeTypes }: FlowCanvasProps) {
    const { fitView } = useReactFlow();

    useEffect(() => {
        if (nodes.length > 0) {
            const timer = setTimeout(() => {
                fitView({ duration: 800 });
            }, 100);

            return () => clearTimeout(timer);
        }
    }, [nodes, fitView]);

    return (
        <ReactFlow nodes={nodes} edges={edges} nodeTypes={nodeTypes} edgeTypes={edgeTypes}>
            <MiniMap />
            <Controls />
            <Background />
        </ReactFlow>
    );
}

export default FlowCanvas;