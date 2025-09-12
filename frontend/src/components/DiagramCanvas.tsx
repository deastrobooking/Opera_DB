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
import ERDEdge from './ERDEdge';

// Define node and edge types outside component to prevent React Flow warnings
const nodeTypes = {
  table: TableNode,
};

const edgeTypes = {
  erd: ERDEdge,
};

interface DiagramCanvasProps {
  tables: Table[];
  relationships: Relationship[];
  onUpdateTable: (id: string, updates: Partial<Table>) => void;
  onRemoveTable: (id: string) => void;
  onAddRelationship: (relationship: Relationship) => void;
  errorRelationships?: number[];
}

const DiagramCanvas: React.FC<DiagramCanvasProps> = ({
  tables,
  relationships,
  onUpdateTable,
  onRemoveTable,
  onAddRelationship,
  errorRelationships = [],
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
    const newEdges = relationships.map((rel, index) => {
      const isError = errorRelationships.includes(index);
      
      // Determine visual style based on cardinality with error override
      const getEdgeStyle = (cardinality: string, hasError: boolean) => {
        if (hasError) {
          return {
            stroke: '#ff0000', // Bright red for errors
            strokeWidth: 3,
            strokeDasharray: '8,4', // Dashed line for errors
          };
        }
        
        switch (cardinality) {
          case '1:1':
            return {
              stroke: '#28a745', // Green for one-to-one
              strokeWidth: 2,
              strokeDasharray: '0',
            };
          case '1:N':
            return {
              stroke: '#007bff', // Blue for one-to-many
              strokeWidth: 2,
              strokeDasharray: '0',
            };
          case 'N:M':
            return {
              stroke: '#dc3545', // Red for many-to-many
              strokeWidth: 3,
              strokeDasharray: '5,5',
            };
          default:
            return {
              stroke: '#6c757d', // Gray for unknown
              strokeWidth: 2,
              strokeDasharray: '0',
            };
        }
      };


      return {
        id: `edge-${index}`,
        source: rel.from_table,
        target: rel.to_table,
        sourceHandle: rel.from_column,
        targetHandle: rel.to_column,
        type: 'erd',
        style: getEdgeStyle(rel.cardinality, isError),
        data: {
          cardinality: rel.cardinality,
          label: rel.cardinality,
        },
      };
    });
    setEdges(newEdges);
  }, [relationships, errorRelationships, setEdges]);

  const onConnect = useCallback(
    (params: Connection) => {
      if (params.source && params.target && params.sourceHandle && params.targetHandle) {
        // Default cardinality is 1:N (one-to-many)
        const cardinality = '1:N';
        const relationship: Relationship = {
          from_table: params.source,
          from_column: params.sourceHandle,
          to_table: params.target,
          to_column: params.targetHandle,
          relationship_type: 'one-to-many', // Consistent with 1:N cardinality
          cardinality: cardinality,
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
        edgeTypes={edgeTypes}
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