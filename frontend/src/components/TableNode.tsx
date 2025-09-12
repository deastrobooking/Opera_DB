import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { Table } from '../App';

interface TableNodeProps {
  data: {
    table: Table;
    onUpdate: (updates: Partial<Table>) => void;
    onRemove: () => void;
  };
}

const TableNode: React.FC<TableNodeProps> = memo(({ data }) => {
  const { table, onRemove } = data;

  const handleAddColumn = () => {
    const columnName = prompt('Enter column name:');
    if (columnName) {
      const columnType = prompt('Enter column type (e.g., VARCHAR(255), INTEGER):') || 'VARCHAR(255)';
      const newColumn = {
        name: columnName,
        type: columnType,
        nullable: true,
        primary_key: false,
        unique: false,
      };
      
      data.onUpdate({
        columns: [...table.columns, newColumn]
      });
    }
  };

  const handleEditColumn = (index: number) => {
    const column = table.columns[index];
    const newName = prompt('Enter column name:', column.name);
    if (newName) {
      const newType = prompt('Enter column type:', column.type) || column.type;
      const updatedColumns = [...table.columns];
      updatedColumns[index] = {
        ...column,
        name: newName,
        type: newType,
      };
      data.onUpdate({ columns: updatedColumns });
    }
  };

  const handleRemoveColumn = (index: number) => {
    if (table.columns.length > 1) {
      const updatedColumns = table.columns.filter((_, i) => i !== index);
      data.onUpdate({ columns: updatedColumns });
    } else {
      alert('Cannot remove the last column');
    }
  };

  return (
    <div className="table-node">
      <div className="table-header">
        <span>{table.name}</span>
        <button 
          style={{ 
            float: 'right', 
            background: 'transparent', 
            border: 'none', 
            color: 'white',
            cursor: 'pointer',
            fontSize: '18px',
            lineHeight: 1
          }}
          onClick={onRemove}
          title="Remove table"
        >
          ×
        </button>
      </div>
      
      {table.columns.map((column, index) => (
        <div key={index} className="table-column">
          <Handle
            type="source"
            position={Position.Right}
            id={column.name}
            style={{ right: -8, top: 32 + index * 35 }}
          />
          <Handle
            type="target"
            position={Position.Left}
            id={column.name}
            style={{ left: -8, top: 32 + index * 35 }}
          />
          
          <div 
            style={{ cursor: 'pointer', flex: 1 }}
            onClick={() => handleEditColumn(index)}
            onDoubleClick={() => handleEditColumn(index)}
            title="Click to edit column"
          >
            <div className="column-name">
              {column.primary_key && <span className="primary-key">🔑 </span>}
              {column.foreign_key && <span className="foreign-key">🔗 </span>}
              {column.name}
            </div>
            <div className="column-type">{column.type}</div>
          </div>
          
          <button
            style={{
              background: 'transparent',
              border: 'none',
              color: '#dc3545',
              cursor: 'pointer',
              fontSize: '14px',
              padding: '0 5px'
            }}
            onClick={() => handleRemoveColumn(index)}
            title="Remove column"
          >
            ×
          </button>
        </div>
      ))}
      
      <div style={{ padding: '8px 12px', borderTop: '1px solid #f1f3f4' }}>
        <button 
          className="btn"
          style={{ fontSize: '12px', padding: '4px 8px' }}
          onClick={handleAddColumn}
        >
          + Add Column
        </button>
      </div>
    </div>
  );
});

TableNode.displayName = 'TableNode';

export default TableNode;