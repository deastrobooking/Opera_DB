import React, { memo, useState } from 'react';
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
  const [editingColumn, setEditingColumn] = useState<number | null>(null);
  const [editingTableName, setEditingTableName] = useState(false);
  const [tempColumnName, setTempColumnName] = useState('');
  const [tempColumnType, setTempColumnType] = useState('');
  const [tempTableName, setTempTableName] = useState(table.name);
  const [tempNullable, setTempNullable] = useState(true);
  const [tempPrimaryKey, setTempPrimaryKey] = useState(false);
  const [tempUnique, setTempUnique] = useState(false);
  const [tempDefault, setTempDefault] = useState('');

  const handleAddColumn = () => {
    const newColumn = {
      name: 'new_column',
      type: 'VARCHAR(255)',
      nullable: true,
      primary_key: false,
      unique: false,
    };
    
    data.onUpdate({
      columns: [...table.columns, newColumn]
    });
    
    // Start editing the new column immediately
    setEditingColumn(table.columns.length);
    setTempColumnName('new_column');
    setTempColumnType('VARCHAR(255)');
  };

  const handleEditColumn = (index: number) => {
    const column = table.columns[index];
    setEditingColumn(index);
    setTempColumnName(column.name);
    setTempColumnType(column.type);
    setTempNullable(column.nullable);
    setTempPrimaryKey(column.primary_key);
    setTempUnique(column.unique);
    setTempDefault(column.default || '');
  };

  const handleSaveColumn = (index: number) => {
    const updatedColumns = [...table.columns];
    updatedColumns[index] = {
      ...updatedColumns[index],
      name: tempColumnName,
      type: tempColumnType,
      nullable: tempNullable,
      primary_key: tempPrimaryKey,
      unique: tempUnique,
      default: tempDefault || undefined
    };
    data.onUpdate({ columns: updatedColumns });
    setEditingColumn(null);
  };

  const handleCancelColumnEdit = () => {
    setEditingColumn(null);
    setTempColumnName('');
    setTempColumnType('');
    setTempNullable(true);
    setTempPrimaryKey(false);
    setTempUnique(false);
    setTempDefault('');
  };

  const handleEditTableName = () => {
    setEditingTableName(true);
    setTempTableName(table.name);
  };

  const handleSaveTableName = () => {
    data.onUpdate({ name: tempTableName });
    setEditingTableName(false);
  };

  const handleCancelTableNameEdit = () => {
    setEditingTableName(false);
    setTempTableName(table.name);
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
        {editingTableName ? (
          <div className="table-name-edit">
            <input
              type="text"
              value={tempTableName}
              onChange={(e) => setTempTableName(e.target.value)}
              onBlur={handleSaveTableName}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveTableName();
                if (e.key === 'Escape') handleCancelTableNameEdit();
              }}
              autoFocus
              className="table-name-input"
            />
          </div>
        ) : (
          <span 
            onClick={handleEditTableName}
            className="table-name-display"
            title="Click to edit table name"
          >
            {table.name}
          </span>
        )}
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
            style={{ right: -8, top: 32 + index * 40 }}
          />
          <Handle
            type="target"
            position={Position.Left}
            id={column.name}
            style={{ left: -8, top: 32 + index * 40 }}
          />
          
          {editingColumn === index ? (
            <div className="column-edit" style={{ flex: 1 }}>
              <div className="column-edit-row">
                <input
                  type="text"
                  value={tempColumnName}
                  onChange={(e) => setTempColumnName(e.target.value)}
                  className="column-name-input"
                  placeholder="Column name"
                  style={{ flex: 2 }}
                />
                <input
                  type="text"
                  value={tempColumnType}
                  onChange={(e) => setTempColumnType(e.target.value)}
                  className="column-type-input"
                  placeholder="Type"
                  style={{ flex: 1 }}
                />
                <button
                  className="save-btn"
                  onClick={() => handleSaveColumn(index)}
                  title="Save changes"
                >
                  ✓
                </button>
                <button
                  className="cancel-btn"
                  onClick={handleCancelColumnEdit}
                  title="Cancel changes"
                >
                  ×
                </button>
              </div>
              <div className="column-edit-row column-properties">
                <label className="property-checkbox">
                  <input
                    type="checkbox"
                    checked={tempPrimaryKey}
                    onChange={(e) => setTempPrimaryKey(e.target.checked)}
                  />
                  <span>PK</span>
                </label>
                <label className="property-checkbox">
                  <input
                    type="checkbox"
                    checked={tempUnique}
                    onChange={(e) => setTempUnique(e.target.checked)}
                  />
                  <span>Unique</span>
                </label>
                <label className="property-checkbox">
                  <input
                    type="checkbox"
                    checked={!tempNullable}
                    onChange={(e) => setTempNullable(!e.target.checked)}
                  />
                  <span>NOT NULL</span>
                </label>
                <input
                  type="text"
                  value={tempDefault}
                  onChange={(e) => setTempDefault(e.target.value)}
                  className="default-input"
                  placeholder="Default"
                />
              </div>
            </div>
          ) : (
            <div 
              style={{ cursor: 'pointer', flex: 1 }}
              onClick={() => handleEditColumn(index)}
              title="Click to edit column"
            >
              <div className="column-name">
                {column.primary_key && <span className="primary-key">🔑 </span>}
                {column.foreign_key && <span className="foreign-key">🔗 </span>}
                {column.name}
              </div>
              <div className="column-type">{column.type}</div>
            </div>
          )}
          
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
          style={{ fontSize: '12px', padding: '4px 8px', width: '100%' }}
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