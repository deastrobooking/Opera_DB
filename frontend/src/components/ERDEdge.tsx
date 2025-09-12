import React from 'react';
import { EdgeProps, getSmoothStepPath } from 'reactflow';

const ERDEdge: React.FC<EdgeProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  data,
  markerEnd,
  markerStart,
}) => {
  const [edgePath] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  // Get cardinality and color from data
  const cardinality = data?.cardinality || '1:N';
  const color = style?.stroke || '#007bff';
  
  // Generate unique marker IDs for this edge
  const oneMarkerId = `erd-one-${id}`;
  const manyMarkerId = `erd-many-${id}`;

  return (
    <>
      <defs>
        {/* One marker - simple bars */}
        <marker
          id={oneMarkerId}
          markerWidth="8"
          markerHeight="8"
          refX="6"
          refY="4"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path
            d="M2,2 L2,6 M6,2 L6,6"
            stroke={color}
            strokeWidth="1.5"
            fill="none"
          />
        </marker>

        {/* Many marker - crow's foot */}
        <marker
          id={manyMarkerId}
          markerWidth="12"
          markerHeight="8"
          refX="10"
          refY="4"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path
            d="M2,4 L8,1 M2,4 L8,4 M2,4 L8,7"
            stroke={color}
            strokeWidth="1.5"
            fill="none"
          />
        </marker>
      </defs>
      
      <path
        id={id}
        style={style}
        className="react-flow__edge-path"
        d={edgePath}
        markerStart={cardinality === '1:1' ? `url(#${oneMarkerId})` : 
                    cardinality === '1:N' ? `url(#${oneMarkerId})` : 
                    cardinality === 'N:M' ? `url(#${manyMarkerId})` : undefined}
        markerEnd={cardinality === '1:1' ? `url(#${oneMarkerId})` : 
                  cardinality === '1:N' ? `url(#${manyMarkerId})` : 
                  cardinality === 'N:M' ? `url(#${manyMarkerId})` : `url(#${manyMarkerId})`}
      />
      
      {/* Cardinality label */}
      {data?.label && (
        <text
          x={(sourceX + targetX) / 2}
          y={(sourceY + targetY) / 2}
          textAnchor="middle"
          dominantBaseline="middle"
          style={{
            fontSize: '12px',
            fontWeight: 'bold',
            fill: '#333',
            backgroundColor: 'white',
            padding: '2px 4px',
          }}
        >
          <tspan
            style={{
              fill: 'white',
              stroke: 'white',
              strokeWidth: '3px',
              paintOrder: 'stroke',
            }}
          >
            {data.label}
          </tspan>
          <tspan
            style={{
              fill: '#333',
            }}
          >
            {data.label}
          </tspan>
        </text>
      )}
    </>
  );
};

export default ERDEdge;