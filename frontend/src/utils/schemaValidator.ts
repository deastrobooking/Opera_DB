import { Table, Relationship } from '../App';

export interface ValidationError {
  type: 'error' | 'warning';
  message: string;
  table?: string;
  column?: string;
  relationship?: number;
}

export class SchemaValidator {
  static validateSchema(tables: Table[], relationships: Relationship[]): ValidationError[] {
    const errors: ValidationError[] = [];
    
    // Create table and column maps for quick lookup
    const tableMap = new Map(tables.map(t => [t.name, t]));
    const columnMap = new Map();
    
    tables.forEach(table => {
      table.columns.forEach(column => {
        columnMap.set(`${table.name}.${column.name}`, column);
      });
    });

    // 1. Validate table names are unique
    const tableNames = new Set<string>();
    tables.forEach(table => {
      if (tableNames.has(table.name)) {
        errors.push({
          type: 'error',
          message: `Duplicate table name: ${table.name}`,
          table: table.name
        });
      }
      tableNames.add(table.name);
    });

    // 2. Validate primary keys
    tables.forEach(table => {
      const primaryKeys = table.columns.filter(col => col.primary_key);
      if (primaryKeys.length === 0) {
        errors.push({
          type: 'warning',
          message: `Table '${table.name}' has no primary key`,
          table: table.name
        });
      }
      
      // Check for duplicate column names within table
      const columnNames = new Set<string>();
      table.columns.forEach(column => {
        if (columnNames.has(column.name)) {
          errors.push({
            type: 'error',
            message: `Duplicate column name '${column.name}' in table '${table.name}'`,
            table: table.name,
            column: column.name
          });
        }
        columnNames.add(column.name);
      });
    });

    // 3. Validate relationships
    relationships.forEach((rel, index) => {
      const fromTable = tableMap.get(rel.from_table);
      const toTable = tableMap.get(rel.to_table);
      
      // Check if referenced tables exist
      if (!fromTable) {
        errors.push({
          type: 'error',
          message: `Relationship references non-existent table: ${rel.from_table}`,
          relationship: index
        });
      }
      
      if (!toTable) {
        errors.push({
          type: 'error',
          message: `Relationship references non-existent table: ${rel.to_table}`,
          relationship: index
        });
      }
      
      // Check if referenced columns exist
      if (fromTable) {
        const fromColumn = fromTable.columns.find(col => col.name === rel.from_column);
        if (!fromColumn) {
          errors.push({
            type: 'error',
            message: `Column '${rel.from_column}' does not exist in table '${rel.from_table}'`,
            relationship: index
          });
        }
      }
      
      if (toTable) {
        const toColumn = toTable.columns.find(col => col.name === rel.to_column);
        if (!toColumn) {
          errors.push({
            type: 'error',
            message: `Column '${rel.to_column}' does not exist in table '${rel.to_table}'`,
            relationship: index
          });
        }
      }

      // Validate cardinality matches relationship type
      const cardinalityTypeMap: Record<string, string[]> = {
        '1:1': ['one-to-one'],
        '1:N': ['one-to-many', 'many-to-one'],
        'N:M': ['many-to-many']
      };
      
      const validTypes = cardinalityTypeMap[rel.cardinality] || [];
      if (!validTypes.includes(rel.relationship_type)) {
        errors.push({
          type: 'warning',
          message: `Cardinality '${rel.cardinality}' doesn't match relationship type '${rel.relationship_type}'`,
          relationship: index
        });
      }
    });

    // 4. Validate foreign key constraints
    tables.forEach(table => {
      table.columns.forEach(column => {
        if (column.foreign_key) {
          const fkMatch = column.foreign_key.match(/^(\w+)\((\w+)\)$/);
          if (fkMatch) {
            const [, refTableName, refColumnName] = fkMatch;
            const refTable = tableMap.get(refTableName);
            
            if (!refTable) {
              errors.push({
                type: 'error',
                message: `Foreign key in '${table.name}.${column.name}' references non-existent table '${refTableName}'`,
                table: table.name,
                column: column.name
              });
            } else {
              const refColumn = refTable.columns.find(col => col.name === refColumnName);
              if (!refColumn) {
                errors.push({
                  type: 'error',
                  message: `Foreign key in '${table.name}.${column.name}' references non-existent column '${refTableName}.${refColumnName}'`,
                  table: table.name,
                  column: column.name
                });
              } else if (!refColumn.primary_key && !refColumn.unique) {
                errors.push({
                  type: 'warning',
                  message: `Foreign key in '${table.name}.${column.name}' references non-unique column '${refTableName}.${refColumnName}'`,
                  table: table.name,
                  column: column.name
                });
              }
            }
          } else {
            errors.push({
              type: 'error',
              message: `Invalid foreign key format in '${table.name}.${column.name}': ${column.foreign_key}`,
              table: table.name,
              column: column.name
            });
          }
        }
      });
    });

    return errors;
  }

  static getRelationshipErrors(relationships: Relationship[], tableMap: Map<string, Table>): number[] {
    const errorIndexes: number[] = [];
    
    relationships.forEach((rel, index) => {
      const fromTable = tableMap.get(rel.from_table);
      const toTable = tableMap.get(rel.to_table);
      
      // Mark relationship as error if tables or columns don't exist
      if (!fromTable || !toTable) {
        errorIndexes.push(index);
        return;
      }
      
      const fromColumn = fromTable.columns.find(col => col.name === rel.from_column);
      const toColumn = toTable.columns.find(col => col.name === rel.to_column);
      
      if (!fromColumn || !toColumn) {
        errorIndexes.push(index);
      }
    });
    
    return errorIndexes;
  }
}