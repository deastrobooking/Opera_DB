import React from 'react';

// Custom ERD markers for professional notation
export const ERDMarkers: React.FC = () => (
  <defs>
    {/* One marker - simple line */}
    <marker
      id="erd-one"
      markerWidth="8"
      markerHeight="8"
      refX="6"
      refY="4"
      orient="auto"
      markerUnits="strokeWidth"
    >
      <path
        d="M2,2 L2,6 M6,2 L6,6"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
      />
    </marker>

    {/* Many marker - crow's foot */}
    <marker
      id="erd-many"
      markerWidth="12"
      markerHeight="8"
      refX="10"
      refY="4"
      orient="auto"
      markerUnits="strokeWidth"
    >
      <path
        d="M2,4 L8,1 M2,4 L8,4 M2,4 L8,7"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
      />
    </marker>

    {/* Arrow for directional relationships */}
    <marker
      id="erd-arrow"
      markerWidth="10"
      markerHeight="8"
      refX="8"
      refY="4"
      orient="auto"
      markerUnits="strokeWidth"
    >
      <path
        d="M2,2 L8,4 L2,6 Z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="0.5"
      />
    </marker>
  </defs>
);

export default ERDMarkers;