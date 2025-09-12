import React, { useState, useEffect } from 'react';
import './App.css';
import DiagramCanvas from './components/DiagramCanvas';
import SQLEditor from './components/SQLEditor';
import TemplatePanel from './components/TemplatePanel';
import RelationshipPanel from './components/RelationshipPanel';
import ValidationPanel from './components/ValidationPanel';
import Toolbar from './components/Toolbar';
import { SchemaValidator, ValidationError } from './utils/schemaValidator';

export interface Table {
  id: string;
  name: string;
  columns: Column[];
  position: { x: number; y: number };
}

export interface Column {
  name: string;
  type: string;
  nullable: boolean;
  primary_key: boolean;
  foreign_key?: string;
  unique: boolean;
  default?: string;
}

export interface Relationship {
  from_table: string;
  from_column: string;
  to_table: string;
  to_column: string;
  relationship_type: string;
  cardinality: string; // 1:1, 1:N, N:M
}

function App() {
  const [tables, setTables] = useState<Table[]>([]);
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [showSQLEditor, setShowSQLEditor] = useState(false);
  const [showTemplatePanel, setShowTemplatePanel] = useState(false);
  const [showRelationshipPanel, setShowRelationshipPanel] = useState(false);
  const [showValidationPanel, setShowValidationPanel] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [errorRelationships, setErrorRelationships] = useState<number[]>([]);

  // Validate schema whenever tables or relationships change
  useEffect(() => {
    const errors = SchemaValidator.validateSchema(tables, relationships);
    setValidationErrors(errors);
    
    const tableMap = new Map(tables.map(t => [t.name, t]));
    const errorRelIndexes = SchemaValidator.getRelationshipErrors(relationships, tableMap);
    setErrorRelationships(errorRelIndexes);
  }, [tables, relationships]);

  const addTable = (table: Omit<Table, 'id'>) => {
    const newTable = {
      ...table,
      id: table.name || `table_${Date.now()}` // Use table name as ID when available
    };
    setTables(prev => [...prev, newTable]);
  };

  const handleSQLParse = (tables: Table[], relationships?: Relationship[]) => {
    setTables(tables);
    if (relationships) {
      setRelationships(relationships);
    }
  };

  const updateTable = (id: string, updates: Partial<Table>) => {
    setTables(prev => prev.map(table => 
      table.id === id ? { ...table, ...updates } : table
    ));
  };

  const removeTable = (id: string) => {
    setTables(prev => prev.filter(table => table.id !== id));
    // Remove related relationships
    setRelationships(prev => prev.filter(rel => 
      rel.from_table !== id && rel.to_table !== id
    ));
  };

  const addRelationship = (relationship: Relationship) => {
    setRelationships(prev => [...prev, relationship]);
  };

  const handleApplyTemplate = (templateTables: any[], templateRelationships: Relationship[]) => {
    // Convert backend template tables to frontend format with proper IDs
    const convertedTables: Table[] = templateTables.map(table => ({
      id: table.name,
      name: table.name,
      columns: table.columns,
      position: table.position || { x: Math.random() * 300 + 100, y: Math.random() * 300 + 100 }
    }));
    
    // Add template tables and relationships to existing ones
    setTables(prev => [...prev, ...convertedTables]);
    setRelationships(prev => [...prev, ...templateRelationships]);
  };

  const updateRelationship = (index: number, updates: Partial<Relationship>) => {
    setRelationships(prev => prev.map((rel, i) => 
      i === index ? { ...rel, ...updates } : rel
    ));
  };

  const removeRelationship = (index: number) => {
    setRelationships(prev => prev.filter((_, i) => i !== index));
  };

  const createJunctionTable = (fromTable: string, toTable: string) => {
    const junctionTableName = `${fromTable}_${toTable}`;
    
    // Create production-grade junction table with composite constraints
    const junctionTable = {
      name: junctionTableName,
      columns: [
        { name: `${fromTable}_id`, type: 'INTEGER', nullable: false, primary_key: true, foreign_key: `${fromTable}(id)`, unique: false },
        { name: `${toTable}_id`, type: 'INTEGER', nullable: false, primary_key: true, foreign_key: `${toTable}(id)`, unique: false },
        { name: 'created_at', type: 'TIMESTAMP', nullable: false, primary_key: false, unique: false, default: 'CURRENT_TIMESTAMP' }
      ],
      position: { x: Math.random() * 300 + 150, y: Math.random() * 300 + 150 }
    };

    addTable(junctionTable);

    // Remove the original N:M relationship that triggered this junction table creation
    setRelationships(prev => prev.filter(rel => 
      !(rel.from_table === fromTable && rel.to_table === toTable && rel.cardinality === 'N:M') &&
      !(rel.from_table === toTable && rel.to_table === fromTable && rel.cardinality === 'N:M')
    ));

    // Add proper 1:N relationships FROM source tables TO junction table
    const newRelationships: Relationship[] = [
      {
        from_table: fromTable,
        from_column: 'id',
        to_table: junctionTableName,
        to_column: `${fromTable}_id`,
        relationship_type: 'one-to-many',
        cardinality: '1:N'
      },
      {
        from_table: toTable,
        from_column: 'id',
        to_table: junctionTableName,
        to_column: `${toTable}_id`,
        relationship_type: 'one-to-many',
        cardinality: '1:N'
      }
    ];

    newRelationships.forEach(rel => addRelationship(rel));
  };

  return (
    <div className="App" style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#f8f9fa' }}>
      <header style={{ background: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', borderBottom: '1px solid #dee2e6' }}>
        <div style={{ padding: '15px 25px' }}>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#212529' }}>ERD Diagram Tool</h1>
          <p style={{ margin: '5px 0 0 0', fontSize: '14px', color: '#6c757d' }}>Design and visualize your database schemas</p>
        </div>
      </header>
      
      <Toolbar 
        onToggleSQLEditor={() => setShowSQLEditor(!showSQLEditor)}
        onToggleTemplatePanel={() => setShowTemplatePanel(!showTemplatePanel)}
        onToggleRelationshipPanel={() => setShowRelationshipPanel(!showRelationshipPanel)}
        onAddTable={addTable}
        tables={tables}
        relationships={relationships}
      />
      
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <div style={{ width: showSQLEditor ? '50%' : '100%', borderRight: showSQLEditor ? '1px solid #dee2e6' : 'none' }}>
          <DiagramCanvas
            tables={tables}
            relationships={relationships}
            onUpdateTable={updateTable}
            onRemoveTable={removeTable}
            onAddRelationship={addRelationship}
            errorRelationships={errorRelationships}
          />
        </div>
        
        {showSQLEditor && (
          <div style={{ width: '50%' }}>
            <SQLEditor
              onSQLParse={handleSQLParse}
              tables={tables}
              relationships={relationships}
            />
          </div>
        )}
      </div>
      
      <TemplatePanel
        isVisible={showTemplatePanel}
        onClose={() => setShowTemplatePanel(false)}
        onApplyTemplate={handleApplyTemplate}
      />
      
      <RelationshipPanel
        isVisible={showRelationshipPanel}
        onClose={() => setShowRelationshipPanel(false)}
        relationships={relationships}
        onUpdateRelationship={updateRelationship}
        onRemoveRelationship={removeRelationship}
        onCreateJunctionTable={createJunctionTable}
      />
      
      <ValidationPanel
        isVisible={showValidationPanel}
        onClose={() => setShowValidationPanel(false)}
        errors={validationErrors}
      />
      
      {/* Validation indicator */}
      {validationErrors.length > 0 && (
        <div 
          className="validation-indicator"
          onClick={() => setShowValidationPanel(true)}
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            background: validationErrors.some(e => e.type === 'error') ? '#dc3545' : '#ffc107',
            color: 'white',
            padding: '10px 15px',
            borderRadius: '25px',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            zIndex: 999,
            fontWeight: 'bold',
            fontSize: '14px'
          }}
        >
          {validationErrors.filter(e => e.type === 'error').length > 0 ? '🔴' : '🟡'} 
          {validationErrors.length} Issue{validationErrors.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
}

export default App;