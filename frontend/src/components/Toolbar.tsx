import React from 'react';
import { Table, Relationship } from '../App';

interface ToolbarProps {
  onToggleSQLEditor: () => void;
  onToggleTemplatePanel: () => void;
  onToggleRelationshipPanel: () => void;
  onAddTable: (table: Omit<Table, 'id'>) => void;
  tables: Table[];
  relationships: Relationship[];
}

const Toolbar: React.FC<ToolbarProps> = ({ 
  onToggleSQLEditor, 
  onToggleTemplatePanel,
  onToggleRelationshipPanel,
  onAddTable, 
  tables, 
  relationships 
}) => {
  const handleAddTable = () => {
    onAddTable({
      name: 'new_table',
      columns: [
        {
          name: 'id',
          type: 'INTEGER',
          nullable: false,
          primary_key: true,
          unique: true
        }
      ],
      position: { x: Math.random() * 400, y: Math.random() * 300 }
    });
  };

  const exportSQL = () => {
    const schema = { tables, relationships };
    
    fetch(`${window.location.protocol}//${window.location.hostname}:8000/api/generate-sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(schema),
    })
    .then(response => response.json())
    .then(data => {
      const element = document.createElement('a');
      const file = new Blob([data.sql], { type: 'text/plain' });
      element.href = URL.createObjectURL(file);
      element.download = 'schema.sql';
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    })
    .catch(error => {
      console.error('Error exporting SQL:', error);
      alert('Error exporting SQL. Please check the console.');
    });
  };

  const exportPostgreSQL = () => {
    const schema = { tables, relationships };
    
    fetch(`${window.location.protocol}//${window.location.hostname}:8000/api/generate-postgresql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(schema),
    })
    .then(response => response.json())
    .then(data => {
      const element = document.createElement('a');
      const file = new Blob([data.sql], { type: 'text/plain' });
      element.href = URL.createObjectURL(file);
      element.download = 'postgresql_schema.sql';
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    })
    .catch(error => {
      console.error('Error exporting PostgreSQL:', error);
      alert('Error exporting PostgreSQL. Please check the console.');
    });
  };

  return (
    <div className="toolbar">
      <button className="btn" onClick={handleAddTable}>
        Add Table
      </button>
      <button className="btn btn-secondary" onClick={onToggleTemplatePanel}>
        📄 Templates
      </button>
      <button className="btn btn-secondary" onClick={onToggleRelationshipPanel}>
        🔗 Relationships
      </button>
      <button className="btn btn-secondary" onClick={onToggleSQLEditor}>
        Toggle SQL Editor
      </button>
      <button className="btn btn-secondary" onClick={exportSQL}>
        Export SQL
      </button>
      <button className="btn btn-secondary" onClick={exportPostgreSQL}>
        Export PostgreSQL
      </button>
      <span style={{ marginLeft: 'auto', color: '#6c757d' }}>
        Tables: {tables.length} | Relationships: {relationships.length}
      </span>
    </div>
  );
};

export default Toolbar;