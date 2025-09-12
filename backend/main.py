from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import sqlparse
import re
import uvicorn

app = FastAPI(title="ERD Diagram Tool API", version="1.0.0")

# CORS middleware for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models
class Column(BaseModel):
    name: str
    type: str
    nullable: bool = True
    primary_key: bool = False
    foreign_key: Optional[str] = None
    unique: bool = False
    default: Optional[str] = None

class Table(BaseModel):
    name: str
    columns: List[Column]
    position: Optional[Dict[str, float]] = None

class Relationship(BaseModel):
    from_table: str
    from_column: str
    to_table: str
    to_column: str
    relationship_type: str = "one-to-many"

class ERDSchema(BaseModel):
    tables: List[Table]
    relationships: List[Relationship]

class SQLParseRequest(BaseModel):
    sql: str

# Simple SQL parser for CREATE TABLE statements
def parse_sql_to_erd(sql: str) -> ERDSchema:
    """Parse SQL CREATE TABLE statements into ERD schema"""
    try:
        parsed = sqlparse.parse(sql)
        tables = []
        relationships = []
        
        for statement in parsed:
            statement_str = str(statement).upper()
            # Check if statement contains CREATE TABLE
            if 'CREATE TABLE' in statement_str:
                table_data = parse_create_table(statement)
                if table_data:
                    tables.append(table_data)
        
        # Extract relationships from foreign keys
        for table in tables:
            for column in table.columns:
                if column.foreign_key:
                    # Parse foreign key reference (format: "table(column)")
                    fk_match = re.match(r'(\w+)\((\w+)\)', column.foreign_key)
                    if fk_match:
                        ref_table, ref_column = fk_match.groups()
                        relationships.append(Relationship(
                            from_table=table.name,
                            from_column=column.name,
                            to_table=ref_table.lower(),
                            to_column=ref_column.lower(),
                            relationship_type="many-to-one"
                        ))
        
        return ERDSchema(tables=tables, relationships=relationships)
    
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error parsing SQL: {str(e)}")

def parse_create_table(statement) -> Optional[Table]:
    """Parse a single CREATE TABLE statement"""
    try:
        # Extract table name using a simpler approach
        statement_str = str(statement)
        
        # Find CREATE TABLE pattern
        create_table_match = re.search(r'CREATE\s+TABLE\s+(\w+)', statement_str, re.IGNORECASE)
        if not create_table_match:
            return None
        
        table_name = create_table_match.group(1).lower()  # Normalize to lowercase
        
        if not table_name:
            return None
        
        # Extract columns from the CREATE TABLE statement
        columns = []
        statement_str = str(statement)
        
        # Find the column definitions between parentheses
        paren_start = statement_str.find('(')
        paren_end = statement_str.rfind(')')
        
        if paren_start != -1 and paren_end != -1:
            columns_str = statement_str[paren_start + 1:paren_end]
            column_lines = [line.strip() for line in columns_str.split(',')]
            
            for line in column_lines:
                if line and not line.upper().startswith('CONSTRAINT') and not line.upper().startswith('PRIMARY KEY') and not line.upper().startswith('FOREIGN KEY'):
                    column = parse_column_definition(line)
                    if column:
                        columns.append(column)
        
        return Table(name=table_name, columns=columns)
    
    except Exception:
        return None

def parse_column_definition(column_def: str) -> Optional[Column]:
    """Parse a single column definition"""
    try:
        parts = column_def.strip().split()
        if len(parts) < 2:
            return None
        
        name = parts[0].strip('`"\'')
        col_type = parts[1].upper()
        
        # Check for constraints
        nullable = True
        primary_key = False
        unique = False
        foreign_key = None
        default = None
        
        definition_upper = column_def.upper()
        
        if 'NOT NULL' in definition_upper:
            nullable = False
        if 'PRIMARY KEY' in definition_upper:
            primary_key = True
            nullable = False
        if 'UNIQUE' in definition_upper:
            unique = True
        
        # Look for REFERENCES (foreign key)
        fk_match = re.search(r'REFERENCES\s+(\w+)\s*\((\w+)\)', definition_upper)
        if fk_match:
            ref_table, ref_column = fk_match.groups()
            foreign_key = f"{ref_table}({ref_column})"
        
        # Look for DEFAULT values
        default_match = re.search(r'DEFAULT\s+([^,\s]+)', definition_upper)
        if default_match:
            default = default_match.group(1)
        
        return Column(
            name=name,
            type=col_type,
            nullable=nullable,
            primary_key=primary_key,
            foreign_key=foreign_key,
            unique=unique,
            default=default
        )
    
    except Exception:
        return None

# API Routes
@app.get("/")
async def root():
    return {"message": "ERD Diagram Tool API", "version": "1.0.0"}

@app.post("/api/parse-sql", response_model=ERDSchema)
async def parse_sql(request: SQLParseRequest):
    """Parse SQL CREATE TABLE statements and return ERD schema"""
    return parse_sql_to_erd(request.sql)

@app.post("/api/generate-sql")
async def generate_sql(schema: ERDSchema):
    """Generate SQL CREATE TABLE statements from ERD schema"""
    sql_statements = []
    
    # First, create tables without foreign keys
    for table in schema.tables:
        columns_sql = []
        for column in table.columns:
            col_def = f"{column.name} {column.type}"
            
            if not column.nullable:
                col_def += " NOT NULL"
            if column.primary_key:
                col_def += " PRIMARY KEY"
            if column.unique and not column.primary_key:
                col_def += " UNIQUE"
            if column.default:
                col_def += f" DEFAULT {column.default}"
            
            columns_sql.append(col_def)
        
        columns_joined = ',\n    '.join(columns_sql)
        create_sql = f"CREATE TABLE {table.name} (\n    {columns_joined}\n);"
        sql_statements.append(create_sql)
    
    # Then, add foreign key constraints
    for table in schema.tables:
        for column in table.columns:
            if column.foreign_key:
                fk_match = re.match(r'(\w+)\((\w+)\)', column.foreign_key)
                if fk_match:
                    ref_table, ref_column = fk_match.groups()
                    alter_sql = f"ALTER TABLE {table.name} ADD CONSTRAINT fk_{table.name}_{column.name} FOREIGN KEY ({column.name}) REFERENCES {ref_table}({ref_column});"
                    sql_statements.append(alter_sql)
    
    return {"sql": "\n\n".join(sql_statements)}

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "service": "ERD Diagram Tool API"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)