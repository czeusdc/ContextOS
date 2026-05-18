import { Node, Edge } from '@xyflow/react';
import dagre from 'dagre';

const nodeWidth = 240;
const nodeHeight = 100;

export function applyWorkflowLayout(nodes: any[], edges: any[]): { nodes: Node[]; edges: Edge[] } {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  
  // Set layout direction (Top to Bottom)
  dagreGraph.setGraph({ rankdir: 'TB', nodesep: 50, ranksep: 100 });

  nodes.forEach((n) => {
    dagreGraph.setNode(n.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((e) => {
    dagreGraph.setEdge(e.source, e.target);
  });

  dagre.layout(dagreGraph);

  const mappedNodes = nodes.map((n) => {
    const nodeWithPosition = dagreGraph.node(n.id);
    
    // Calculate precise center position
    const x = nodeWithPosition.x - nodeWidth / 2;
    const y = nodeWithPosition.y - nodeHeight / 2;

    const nodeType = n.data?.nodeType || 'action';

    let className = 'bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-xl px-4 py-3 ring-1 ring-indigo-500/50 text-white text-xs min-w-[200px] shadow-xl';
    
    if (nodeType === 'department') {
      className = 'bg-[#16161e] border-2 border-indigo-500/50 rounded-xl px-6 py-4 shadow-2xl shadow-indigo-500/10 text-white font-semibold text-sm min-w-[260px] min-h-[120px]';
    } else if (nodeType === 'action') {
      if (n.data?.riskLevel === 'high') {
         className = 'bg-red-500/5 border border-red-500/30 border-dashed rounded-xl px-4 py-3 text-white text-xs ring-1 ring-red-500/50 min-w-[200px] min-h-[72px] shadow-xl';
      } else {
         className = 'bg-[#16161e] border border-white/5 rounded-lg px-3 py-2 opacity-80 text-white text-[11px] min-w-[200px] min-h-[72px] shadow-xl';
      }
    } else if (nodeType === 'system') {
      className = 'bg-indigo-900/10 border border-indigo-500/30 rounded-xl px-4 py-3 text-white text-xs ring-1 ring-indigo-500/20 min-w-[220px] min-h-[90px] shadow-xl';
    }

    return {
      id: n.id,
      type: 'default',
      position: { x, y },
      data: { 
        label: n.data?.label || n.id, 
        description: n.data?.description, 
        riskLevel: n.data?.riskLevel, 
        ...n.data,
        ...n 
      },
      className
    };
  });

  const animatedEdges = edges.map((e) => ({
    ...e,
    type: 'smoothstep',
    animated: true,
    style: { stroke: 'rgba(99, 102, 241, 0.5)', strokeWidth: 2 }
  }));

  return { nodes: mappedNodes, edges: animatedEdges };
}
