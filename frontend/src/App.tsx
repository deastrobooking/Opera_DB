import React, { useState } from 'react';
import './App.css';
import DiagramCanvas from './components/DiagramCanvas';
import SQLEditor from './components/SQLEditor';
import TemplatePanel from './components/TemplatePanel';
import Toolbar from './components/Toolbar';

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
}

function App() {
  const [tables, setTables] = useState<Table[]>([]);
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [showSQLEditor, setShowSQLEditor] = useState(false);
  const [showTemplatePanel, setShowTemplatePanel] = useState(false);

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

  const handleApplyTemplate = (templateTables: Table[], templateRelationships: Relationship[]) => {
    // Add template tables and relationships to existing ones
    setTables(prev => [...prev, ...templateTables]);
    setRelationships(prev => [...prev, ...templateRelationships]);
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
    </div>
  );
}

export default App;