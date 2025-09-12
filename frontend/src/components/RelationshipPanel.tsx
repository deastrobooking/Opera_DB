import React, { useState } from 'react';
import { Relationship } from '../App';

interface RelationshipPanelProps {
  relationships: Relationship[];
  onUpdateRelationship: (index: number, updates: Partial<Relationship>) => void;
  onRemoveRelationship: (index: number) => void;
  onCreateJunctionTable?: (fromTable: string, toTable: string) => void;
  isVisible: boolean;
  onClose: () => void;
}

const RelationshipPanel: React.FC<RelationshipPanelProps> = ({
  relationships,
  onUpdateRelationship,
  onRemoveRelationship,
  onCreateJunctionTable,
  isVisible,
  onClose
}) => {
  const [selectedRelationship, setSelectedRelationship] = useState<number | null>(null);

  const cardinalityOptions = [
    { value: '1:1', label: '1:1 (One-to-One)', color: '#28a745', type: 'one-to-one' },
    { value: '1:N', label: '1:N (One-to-Many)', color: '#007bff', type: 'one-to-many' },
    { value: 'N:M', label: 'N:M (Many-to-Many)', color: '#dc3545', type: 'many-to-many' }
  ];

  const relationshipTypes = [
    { value: 'one-to-one', label: 'One to One' },
    { value: 'one-to-many', label: 'One to Many' },
    { value: 'many-to-one', label: 'Many to One' },
    { value: 'many-to-many', label: 'Many to Many' }
  ];

  const createJunctionTable = (rel: Relationship) => {
    if (onCreateJunctionTable) {
      onCreateJunctionTable(rel.from_table, rel.to_table);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="relationship-panel-overlay">
      <div className="relationship-panel">
        <div className="relationship-panel-header">
          <h2>Relationship Manager</h2>
          <button 
            className="close-btn" 
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <div className="relationship-panel-content">
          {relationships.length === 0 ? (
            <div className="no-relationships">
              <p>No relationships defined yet.</p>
              <p>Connect tables in the diagram to create relationships.</p>
            </div>
          ) : (
            <div className="relationships-list">
              {relationships.map((rel, index) => (
                <div 
                  key={index} 
                  className={`relationship-item ${selectedRelationship === index ? 'selected' : ''}`}
                  onClick={() => setSelectedRelationship(selectedRelationship === index ? null : index)}
                >
                  <div className="relationship-summary">
                    <div className="relationship-title">
                      <span className="table-name">{rel.from_table}</span>
                      <span className="column-name">({rel.from_column})</span>
                      <span 
                        className="cardinality-badge"
                        style={{ 
                          backgroundColor: cardinalityOptions.find(opt => opt.value === rel.cardinality)?.color || '#6c757d',
                          color: 'white',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          margin: '0 8px'
                        }}
                      >
                        {rel.cardinality}
                      </span>
                      <span className="table-name">{rel.to_table}</span>
                      <span className="column-name">({rel.to_column})</span>
                    </div>
                    <div className="relationship-type">
                      Type: {rel.relationship_type}
                    </div>
                  </div>

                  {selectedRelationship === index && (
                    <div className="relationship-controls">
                      <div className="control-group">
                        <label>Cardinality:</label>
                        <select
                          value={rel.cardinality}
                          onChange={(e) => {
                            const selectedOption = cardinalityOptions.find(opt => opt.value === e.target.value);
                            onUpdateRelationship(index, { 
                              cardinality: e.target.value,
                              relationship_type: selectedOption?.type || 'one-to-many'
                            });
                          }}
                        >
                          {cardinalityOptions.map(option => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="control-group">
                        <label>Relationship Type:</label>
                        <select
                          value={rel.relationship_type}
                          onChange={(e) => {
                            // Derive cardinality from relationship type to maintain consistency
                            let derivedCardinality = rel.cardinality;
                            if (e.target.value === 'one-to-one') derivedCardinality = '1:1';
                            else if (e.target.value === 'one-to-many') derivedCardinality = '1:N';
                            else if (e.target.value === 'many-to-one') derivedCardinality = '1:N'; // Normalized to 1:N
                            else if (e.target.value === 'many-to-many') derivedCardinality = 'N:M';
                            
                            onUpdateRelationship(index, { 
                              relationship_type: e.target.value,
                              cardinality: derivedCardinality
                            });
                          }}
                        >
                          {relationshipTypes.map(type => (
                            <option key={type.value} value={type.value}>
                              {type.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {rel.cardinality === 'N:M' && (
                        <div className="junction-table-section">
                          <div className="junction-info">
                            <strong>💡 Many-to-Many Tip:</strong> This relationship typically requires a junction table.
                          </div>
                          <button
                            className="create-junction-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              createJunctionTable(rel);
                            }}
                          >
                            ⚡ Create Junction Table
                          </button>
                        </div>
                      )}

                      <button
                        className="remove-relationship-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoveRelationship(index);
                          setSelectedRelationship(null);
                        }}
                      >
                        🗑️ Remove Relationship
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="cardinality-legend">
            <h3>Cardinality Legend</h3>
            <div className="legend-items">
              {cardinalityOptions.map(option => (
                <div key={option.value} className="legend-item">
                  <span 
                    className="legend-color"
                    style={{ backgroundColor: option.color }}
                  ></span>
                  <span>{option.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RelationshipPanel;