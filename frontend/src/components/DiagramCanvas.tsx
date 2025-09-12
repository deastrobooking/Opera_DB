import React, { useCallback } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Connection,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  MiniMap,
  MarkerType,
  BackgroundVariant,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Table, Relationship } from '../App';
import TableNode from './TableNode';

const nodeTypes = {
  table: TableNode,
};

interface DiagramCanvasProps {
  tables: Table[];
  relationships: Relationship[];
  onUpdateTable: (id: string, updates: Partial<Table>) => void;
  onRemoveTable: (id: string) => void;
  onAddRelationship: (relationship: Relationship) => void;
}

const DiagramCanvas: React.FC<DiagramCanvasProps> = ({
  tables,
  relationships,
  onUpdateTable,
  onRemoveTable,
  onAddRelationship,
}) => {
  // Convert tables to React Flow nodes
  const initialNodes: Node[] = tables.map(table => ({
    id: table.id,
    type: 'table',
    position: table.position,
    data: { 
      table,
      onUpdate: (updates: Partial<Table>) => onUpdateTable(table.id, updates),
      onRemove: () => onRemoveTable(table.id),
    },
  }));

  // Convert relationships to React Flow edges
  const initialEdges: Edge[] = relationships.map((rel, index) => ({
    id: `edge-${index}`,
    source: rel.from_table,
    target: rel.to_table,
    sourceHandle: rel.from_column,
    targetHandle: rel.to_column,
    type: 'smoothstep',
    style: { stroke: '#007bff', strokeWidth: 2 },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: '#007bff',
    },
  }));

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Update nodes when tables change
  React.useEffect(() => {
    const newNodes = tables.map(table => ({
      id: table.id,
      type: 'table',
      position: table.position,
      data: { 
        table,
        onUpdate: (updates: Partial<Table>) => onUpdateTable(table.id, updates),
        onRemove: () => onRemoveTable(table.id),
      },
    }));
    setNodes(newNodes);
  }, [tables, onUpdateTable, onRemoveTable, setNodes]);

  // Update edges when relationships change
  React.useEffect(() => {
    const newEdges = relationships.map((rel, index) => ({
      id: `edge-${index}`,
      source: rel.from_table,
      target: rel.to_table,
      sourceHandle: rel.from_column,
      targetHandle: rel.to_column,
      type: 'smoothstep',
      style: { stroke: '#007bff', strokeWidth: 2 },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: '#007bff',
      },
    }));
    setEdges(newEdges);
  }, [relationships, setEdges]);

  const onConnect = useCallback(
    (params: Connection) => {
      if (params.source && params.target && params.sourceHandle && params.targetHandle) {
        const relationship: Relationship = {
          from_table: params.source,
          from_column: params.sourceHandle,
          to_table: params.target,
          to_column: params.targetHandle,
          relationship_type: 'many-to-one',
        };
        onAddRelationship(relationship);
      }
    },
    [onAddRelationship]
  );

  const onNodeDragStop = useCallback(
    (event: React.MouseEvent, node: Node) => {
      onUpdateTable(node.id, { position: node.position });
    },
    [onUpdateTable]
  );

  return (
    <div className="diagram-container">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDragStop={onNodeDragStop}
        nodeTypes={nodeTypes}
        fitView
        snapToGrid
        snapGrid={[15, 15]}
      >
        <Controls />
        <MiniMap />
        <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
      </ReactFlow>
    </div>
  );
};

export default DiagramCanvas;