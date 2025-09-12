import React, { useState } from 'react';
import { Table, Relationship } from '../App';

interface SQLEditorProps {
  onSQLParse: (tables: Table[]) => void;
  tables: Table[];
  relationships: Relationship[];
}

const SQLEditor: React.FC<SQLEditorProps> = ({ onSQLParse, tables, relationships }) => {
  const [sql, setSql] = useState('-- Enter your SQL CREATE TABLE statements here\nCREATE TABLE users (\n    id INTEGER PRIMARY KEY,\n    username VARCHAR(255) NOT NULL,\n    email VARCHAR(255) UNIQUE,\n    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n);\n\nCREATE TABLE posts (\n    id INTEGER PRIMARY KEY,\n    title VARCHAR(255) NOT NULL,\n    content TEXT,\n    user_id INTEGER REFERENCES users(id),\n    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n);');
  const [output, setOutput] = useState('');

  const handleParse = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/parse-sql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sql }),
      });

      if (!response.ok) {
        const error = await response.json();
        setOutput(`Error: ${error.detail || 'Failed to parse SQL'}`);
        return;
      }

      const result = await response.json();
      
      // Convert the parsed result to our Table format
      const parsedTables: Table[] = result.tables.map((table: any, index: number) => ({
        id: `table_${Date.now()}_${index}`,
        name: table.name,
        columns: table.columns,
        position: { x: index * 250 + 50, y: 50 }
      }));

      onSQLParse(parsedTables);
      setOutput(`Successfully parsed ${parsedTables.length} tables and ${result.relationships.length} relationships`);
    } catch (error) {
      setOutput(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleGenerateSQL = async () => {
    try {
      const schema = { tables, relationships };
      
      const response = await fetch('http://localhost:8000/api/generate-sql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(schema),
      });

      if (!response.ok) {
        const error = await response.json();
        setOutput(`Error: ${error.detail || 'Failed to generate SQL'}`);
        return;
      }

      const result = await response.json();
      setSql(result.sql);
      setOutput('SQL generated successfully from current diagram');
    } catch (error) {
      setOutput(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="sql-editor">
      <div className="sql-editor-header">
        SQL Editor
        <div style={{ float: 'right', display: 'flex', gap: '8px' }}>
          <button className="btn" style={{ fontSize: '12px', padding: '4px 8px' }} onClick={handleParse}>
            Parse SQL → Diagram
          </button>
          <button className="btn btn-secondary" style={{ fontSize: '12px', padding: '4px 8px' }} onClick={handleGenerateSQL}>
            Diagram → SQL
          </button>
        </div>
      </div>
      
      <div className="sql-editor-content">
        <textarea
          className="sql-editor-textarea"
          value={sql}
          onChange={(e) => setSql(e.target.value)}
          placeholder="Enter your SQL CREATE TABLE statements here..."
        />
        
        {output && (
          <div className="sql-output">
            <strong>Output:</strong>
            <pre style={{ margin: '8px 0 0 0', whiteSpace: 'pre-wrap' }}>{output}</pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default SQLEditor;