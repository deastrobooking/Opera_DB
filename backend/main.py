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
    cardinality: str = "1:N"  # 1:1, 1:N, N:M

class Template(BaseModel):
    id: str
    name: str
    description: str
    category: str
    tables: List[Table]
    relationships: List[Relationship]

class ERDSchema(BaseModel):
    tables: List[Table]
    relationships: List[Relationship]

class SQLParseRequest(BaseModel):
    sql: str

# Template definitions
TEMPLATES = {
    "user_auth": Template(
        id="user_auth",
        name="User Authentication",
        description="Complete user authentication system with roles and permissions",
        category="Authentication",
        tables=[
            Table(
                name="users",
                columns=[
                    Column(name="id", type="INTEGER", nullable=False, primary_key=True),
                    Column(name="username", type="VARCHAR(255)", nullable=False, unique=True),
                    Column(name="email", type="VARCHAR(255)", nullable=False, unique=True),
                    Column(name="password_hash", type="VARCHAR(255)", nullable=False),
                    Column(name="first_name", type="VARCHAR(255)", nullable=True),
                    Column(name="last_name", type="VARCHAR(255)", nullable=True),
                    Column(name="is_active", type="BOOLEAN", nullable=False, default="true"),
                    Column(name="created_at", type="TIMESTAMP", nullable=False, default="CURRENT_TIMESTAMP"),
                    Column(name="updated_at", type="TIMESTAMP", nullable=False, default="CURRENT_TIMESTAMP")
                ],
                position={"x": 50, "y": 50}
            ),
            Table(
                name="roles",
                columns=[
                    Column(name="id", type="INTEGER", nullable=False, primary_key=True),
                    Column(name="name", type="VARCHAR(100)", nullable=False, unique=True),
                    Column(name="description", type="TEXT", nullable=True),
                    Column(name="created_at", type="TIMESTAMP", nullable=False, default="CURRENT_TIMESTAMP")
                ],
                position={"x": 350, "y": 50}
            ),
            Table(
                name="user_roles",
                columns=[
                    Column(name="id", type="INTEGER", nullable=False, primary_key=True),
                    Column(name="user_id", type="INTEGER", nullable=False, foreign_key="users(id)"),
                    Column(name="role_id", type="INTEGER", nullable=False, foreign_key="roles(id)"),
                    Column(name="assigned_at", type="TIMESTAMP", nullable=False, default="CURRENT_TIMESTAMP")
                ],
                position={"x": 200, "y": 200}
            )
        ],
        relationships=[
            Relationship(from_table="user_roles", from_column="user_id", to_table="users", to_column="id", relationship_type="many-to-one", cardinality="N:1"),
            Relationship(from_table="user_roles", from_column="role_id", to_table="roles", to_column="id", relationship_type="many-to-one", cardinality="N:1")
        ]
    ),
    "ecommerce": Template(
        id="ecommerce",
        name="E-commerce Core",
        description="Essential e-commerce tables for products, orders, and customers",
        category="E-commerce",
        tables=[
            Table(
                name="customers",
                columns=[
                    Column(name="id", type="INTEGER", nullable=False, primary_key=True),
                    Column(name="email", type="VARCHAR(255)", nullable=False, unique=True),
                    Column(name="first_name", type="VARCHAR(255)", nullable=False),
                    Column(name="last_name", type="VARCHAR(255)", nullable=False),
                    Column(name="phone", type="VARCHAR(20)", nullable=True),
                    Column(name="created_at", type="TIMESTAMP", nullable=False, default="CURRENT_TIMESTAMP")
                ],
                position={"x": 50, "y": 50}
            ),
            Table(
                name="products",
                columns=[
                    Column(name="id", type="INTEGER", nullable=False, primary_key=True),
                    Column(name="name", type="VARCHAR(255)", nullable=False),
                    Column(name="description", type="TEXT", nullable=True),
                    Column(name="price", type="DECIMAL(10,2)", nullable=False),
                    Column(name="stock_quantity", type="INTEGER", nullable=False, default="0"),
                    Column(name="is_active", type="BOOLEAN", nullable=False, default="true"),
                    Column(name="created_at", type="TIMESTAMP", nullable=False, default="CURRENT_TIMESTAMP")
                ],
                position={"x": 350, "y": 50}
            ),
            Table(
                name="orders",
                columns=[
                    Column(name="id", type="INTEGER", nullable=False, primary_key=True),
                    Column(name="customer_id", type="INTEGER", nullable=False, foreign_key="customers(id)"),
                    Column(name="status", type="VARCHAR(50)", nullable=False, default="'pending'"),
                    Column(name="total_amount", type="DECIMAL(10,2)", nullable=False),
                    Column(name="created_at", type="TIMESTAMP", nullable=False, default="CURRENT_TIMESTAMP")
                ],
                position={"x": 50, "y": 250}
            ),
            Table(
                name="order_items",
                columns=[
                    Column(name="id", type="INTEGER", nullable=False, primary_key=True),
                    Column(name="order_id", type="INTEGER", nullable=False, foreign_key="orders(id)"),
                    Column(name="product_id", type="INTEGER", nullable=False, foreign_key="products(id)"),
                    Column(name="quantity", type="INTEGER", nullable=False),
                    Column(name="unit_price", type="DECIMAL(10,2)", nullable=False)
                ],
                position={"x": 350, "y": 250}
            )
        ],
        relationships=[
            Relationship(from_table="orders", from_column="customer_id", to_table="customers", to_column="id", relationship_type="many-to-one", cardinality="N:1"),
            Relationship(from_table="order_items", from_column="order_id", to_table="orders", to_column="id", relationship_type="many-to-one", cardinality="N:1"),
            Relationship(from_table="order_items", from_column="product_id", to_table="products", to_column="id", relationship_type="many-to-one", cardinality="N:1")
        ]
    ),
    "blog_cms": Template(
        id="blog_cms",
        name="Blog/CMS System",
        description="Blog and content management structure with posts, categories, and tags",
        category="Content Management",
        tables=[
            Table(
                name="categories",
                columns=[
                    Column(name="id", type="INTEGER", nullable=False, primary_key=True),
                    Column(name="name", type="VARCHAR(255)", nullable=False, unique=True),
                    Column(name="slug", type="VARCHAR(255)", nullable=False, unique=True),
                    Column(name="description", type="TEXT", nullable=True),
                    Column(name="created_at", type="TIMESTAMP", nullable=False, default="CURRENT_TIMESTAMP")
                ],
                position={"x": 50, "y": 50}
            ),
            Table(
                name="posts",
                columns=[
                    Column(name="id", type="INTEGER", nullable=False, primary_key=True),
                    Column(name="title", type="VARCHAR(255)", nullable=False),
                    Column(name="slug", type="VARCHAR(255)", nullable=False, unique=True),
                    Column(name="content", type="TEXT", nullable=False),
                    Column(name="excerpt", type="TEXT", nullable=True),
                    Column(name="category_id", type="INTEGER", nullable=True, foreign_key="categories(id)"),
                    Column(name="status", type="VARCHAR(20)", nullable=False, default="'draft'"),
                    Column(name="published_at", type="TIMESTAMP", nullable=True),
                    Column(name="created_at", type="TIMESTAMP", nullable=False, default="CURRENT_TIMESTAMP"),
                    Column(name="updated_at", type="TIMESTAMP", nullable=False, default="CURRENT_TIMESTAMP")
                ],
                position={"x": 350, "y": 50}
            ),
            Table(
                name="tags",
                columns=[
                    Column(name="id", type="INTEGER", nullable=False, primary_key=True),
                    Column(name="name", type="VARCHAR(100)", nullable=False, unique=True),
                    Column(name="slug", type="VARCHAR(100)", nullable=False, unique=True),
                    Column(name="created_at", type="TIMESTAMP", nullable=False, default="CURRENT_TIMESTAMP")
                ],
                position={"x": 650, "y": 50}
            ),
            Table(
                name="post_tags",
                columns=[
                    Column(name="id", type="INTEGER", nullable=False, primary_key=True),
                    Column(name="post_id", type="INTEGER", nullable=False, foreign_key="posts(id)"),
                    Column(name="tag_id", type="INTEGER", nullable=False, foreign_key="tags(id)")
                ],
                position={"x": 500, "y": 250}
            )
        ],
        relationships=[
            Relationship(from_table="posts", from_column="category_id", to_table="categories", to_column="id", relationship_type="many-to-one", cardinality="N:1"),
            Relationship(from_table="post_tags", from_column="post_id", to_table="posts", to_column="id", relationship_type="many-to-one", cardinality="N:1"),
            Relationship(from_table="post_tags", from_column="tag_id", to_table="tags", to_column="id", relationship_type="many-to-one", cardinality="N:1")
        ]
    ),
    "inventory_management": Template(
        id="inventory_management",
        name="Inventory Management",
        description="Complete inventory system with products, stock moves, suppliers, and purchase/sales orders",
        category="Inventory",
        tables=[
            Table(
                name="product",
                columns=[
                    Column(name="id", type="INTEGER", nullable=False, primary_key=True),
                    Column(name="name", type="TEXT", nullable=False),
                    Column(name="category_id", type="INTEGER", nullable=True, foreign_key="category(id)"),
                    Column(name="is_stocked", type="BOOLEAN", nullable=False, default="true"),
                    Column(name="is_batch_tracked", type="BOOLEAN", nullable=False, default="false"),
                    Column(name="default_uom", type="TEXT", nullable=False)
                ],
                position={"x": 50, "y": 50}
            ),
            Table(
                name="product_variant",
                columns=[
                    Column(name="id", type="INTEGER", nullable=False, primary_key=True),
                    Column(name="product_id", type="INTEGER", nullable=False, foreign_key="product(id)"),
                    Column(name="sku", type="TEXT", nullable=False, unique=True),
                    Column(name="attrs", type="TEXT", nullable=False, default="'{}'"),
                    Column(name="barcode", type="TEXT", nullable=True)
                ],
                position={"x": 350, "y": 50}
            ),
            Table(
                name="location",
                columns=[
                    Column(name="id", type="INTEGER", nullable=False, primary_key=True),
                    Column(name="code", type="TEXT", nullable=False, unique=True),
                    Column(name="name", type="TEXT", nullable=False),
                    Column(name="is_internal", type="BOOLEAN", nullable=False, default="true")
                ],
                position={"x": 650, "y": 50}
            ),
            Table(
                name="supplier",
                columns=[
                    Column(name="id", type="INTEGER", nullable=False, primary_key=True),
                    Column(name="name", type="TEXT", nullable=False, unique=True),
                    Column(name="email", type="TEXT", nullable=True),
                    Column(name="phone", type="TEXT", nullable=True)
                ],
                position={"x": 50, "y": 200}
            ),
            Table(
                name="stock_move",
                columns=[
                    Column(name="id", type="INTEGER", nullable=False, primary_key=True),
                    Column(name="product_variant_id", type="INTEGER", nullable=False, foreign_key="product_variant(id)"),
                    Column(name="uom_code", type="TEXT", nullable=False),
                    Column(name="qty", type="DECIMAL(18,6)", nullable=False),
                    Column(name="kind", type="TEXT", nullable=False),
                    Column(name="from_location_id", type="INTEGER", nullable=True, foreign_key="location(id)"),
                    Column(name="to_location_id", type="INTEGER", nullable=True, foreign_key="location(id)"),
                    Column(name="reason", type="TEXT", nullable=True),
                    Column(name="moved_at", type="TIMESTAMP", nullable=False, default="CURRENT_TIMESTAMP")
                ],
                position={"x": 350, "y": 200}
            ),
            Table(
                name="purchase_order",
                columns=[
                    Column(name="id", type="INTEGER", nullable=False, primary_key=True),
                    Column(name="supplier_id", type="INTEGER", nullable=False, foreign_key="supplier(id)"),
                    Column(name="order_no", type="TEXT", nullable=False, unique=True),
                    Column(name="status", type="TEXT", nullable=False, default="'draft'"),
                    Column(name="ordered_at", type="TIMESTAMP", nullable=False, default="CURRENT_TIMESTAMP"),
                    Column(name="expected_at", type="DATE", nullable=True)
                ],
                position={"x": 650, "y": 200}
            )
        ],
        relationships=[
            Relationship(from_table="product_variant", from_column="product_id", to_table="product", to_column="id", relationship_type="many-to-one", cardinality="N:1"),
            Relationship(from_table="stock_move", from_column="product_variant_id", to_table="product_variant", to_column="id", relationship_type="many-to-one", cardinality="N:1"),
            Relationship(from_table="stock_move", from_column="from_location_id", to_table="location", to_column="id", relationship_type="many-to-one", cardinality="N:1"),
            Relationship(from_table="stock_move", from_column="to_location_id", to_table="location", to_column="id", relationship_type="many-to-one", cardinality="N:1"),
            Relationship(from_table="purchase_order", from_column="supplier_id", to_table="supplier", to_column="id", relationship_type="many-to-one", cardinality="N:1")
        ]
    ),
    "hierarchical_data": Template(
        id="hierarchical_data",
        name="Hierarchical Data Patterns",
        description="Common patterns for storing hierarchical data: adjacency list, closure table, and materialized path",
        category="Data Patterns",
        tables=[
            Table(
                name="category",
                columns=[
                    Column(name="id", type="INTEGER", nullable=False, primary_key=True),
                    Column(name="name", type="TEXT", nullable=False),
                    Column(name="parent_id", type="INTEGER", nullable=True, foreign_key="category(id)"),
                    Column(name="path", type="TEXT", nullable=False)
                ],
                position={"x": 50, "y": 50}
            ),
            Table(
                name="category_path",
                columns=[
                    Column(name="ancestor", type="INTEGER", nullable=False, foreign_key="category(id)"),
                    Column(name="descendant", type="INTEGER", nullable=False, foreign_key="category(id)"),
                    Column(name="depth", type="INTEGER", nullable=False)
                ],
                position={"x": 350, "y": 50}
            ),
            Table(
                name="customer_hist",
                columns=[
                    Column(name="customer_id", type="INTEGER", nullable=False),
                    Column(name="name", type="TEXT", nullable=True),
                    Column(name="valid_from", type="TIMESTAMP", nullable=False),
                    Column(name="valid_to", type="TIMESTAMP", nullable=True)
                ],
                position={"x": 650, "y": 50}
            )
        ],
        relationships=[
            Relationship(from_table="category", from_column="parent_id", to_table="category", to_column="id", relationship_type="many-to-one", cardinality="N:1"),
            Relationship(from_table="category_path", from_column="ancestor", to_table="category", to_column="id", relationship_type="many-to-one", cardinality="N:1"),
            Relationship(from_table="category_path", from_column="descendant", to_table="category", to_column="id", relationship_type="many-to-one", cardinality="N:1")
        ]
    )
}

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

@app.post("/api/generate-postgresql")
async def generate_postgresql(schema: ERDSchema):
    """Generate PostgreSQL-specific SQL statements with enhanced features"""
    sql_statements = []
    
    # Add PostgreSQL-specific header
    sql_statements.append("-- PostgreSQL Schema Export")
    sql_statements.append("-- Generated by ERD Tool")
    sql_statements.append("")
    
    # Generate CREATE TABLE statements with PostgreSQL enhancements
    for table in schema.tables:
        columns_sql = []
        for column in table.columns:
            # Convert types to PostgreSQL-specific types
            pg_type = convert_to_postgresql_type(column.type, column.primary_key)
            col_def = f"{column.name} {pg_type}"
            
            if not column.nullable:
                col_def += " NOT NULL"
            if column.primary_key:
                col_def += " PRIMARY KEY"
            if column.unique and not column.primary_key:
                col_def += " UNIQUE"
            if column.default:
                if column.default.upper() == "CURRENT_TIMESTAMP":
                    col_def += " DEFAULT CURRENT_TIMESTAMP"
                else:
                    col_def += f" DEFAULT {column.default}"
            
            columns_sql.append(col_def)
        
        columns_joined = ',\n    '.join(columns_sql)
        create_sql = f"CREATE TABLE {table.name} (\n    {columns_joined}\n);"
        sql_statements.append(create_sql)
        sql_statements.append("")
    
    # Generate foreign key constraints with PostgreSQL enhancements
    if any(column.foreign_key for table in schema.tables for column in table.columns):
        sql_statements.append("-- Foreign Key Constraints")
        for table in schema.tables:
            for column in table.columns:
                if column.foreign_key:
                    fk_match = re.match(r'(\w+)\((\w+)\)', column.foreign_key)
                    if fk_match:
                        ref_table, ref_column = fk_match.groups()
                        constraint_name = f"fk_{table.name}_{column.name}"
                        alter_sql = f"ALTER TABLE {table.name}\n    ADD CONSTRAINT {constraint_name}\n    FOREIGN KEY ({column.name})\n    REFERENCES {ref_table.lower()}({ref_column.lower()})\n    ON DELETE RESTRICT;"
                        sql_statements.append(alter_sql)
                        sql_statements.append("")
    
    # Add indexes for foreign keys (PostgreSQL best practice)
    fk_columns = [(table.name, column.name) for table in schema.tables for column in table.columns if column.foreign_key]
    if fk_columns:
        sql_statements.append("-- Indexes for Foreign Keys (Performance)")
        for table_name, column_name in fk_columns:
            index_name = f"idx_{table_name}_{column_name}"
            index_sql = f"CREATE INDEX {index_name} ON {table_name} ({column_name});"
            sql_statements.append(index_sql)
        sql_statements.append("")
    
    return {"sql": "\n".join(sql_statements)}

def convert_to_postgresql_type(sql_type: str, is_primary_key: bool = False) -> str:
    """Convert generic SQL types to PostgreSQL-specific types"""
    type_mapping = {
        "VARCHAR(255)": "VARCHAR(255)",
        "TEXT": "TEXT",
        "TIMESTAMP": "TIMESTAMP WITH TIME ZONE",
        "DATETIME": "TIMESTAMP WITH TIME ZONE",
        "BOOLEAN": "BOOLEAN",
        "BOOL": "BOOLEAN",
        "DECIMAL": "NUMERIC",
        "FLOAT": "REAL",
        "DOUBLE": "DOUBLE PRECISION"
    }
    
    upper_type = sql_type.upper()
    
    # Handle INTEGER/INT types - only use SERIAL for primary keys
    if upper_type in ["INTEGER", "INT"]:
        return "SERIAL" if is_primary_key else "INTEGER"
    elif upper_type in type_mapping:
        return type_mapping[upper_type]
    elif upper_type.startswith("VARCHAR"):
        return sql_type  # Keep VARCHAR with length
    elif upper_type.startswith("DECIMAL"):
        return sql_type.replace("DECIMAL", "NUMERIC")
    else:
        return sql_type  # Return as-is for unknown types

@app.get("/api/templates")
async def get_templates():
    """Get all available templates organized by category"""
    templates_by_category = {}
    for template in TEMPLATES.values():
        if template.category not in templates_by_category:
            templates_by_category[template.category] = []
        templates_by_category[template.category].append({
            "id": template.id,
            "name": template.name,
            "description": template.description,
            "table_count": len(template.tables),
            "relationship_count": len(template.relationships)
        })
    return templates_by_category

@app.get("/api/templates/{template_id}")
async def get_template(template_id: str):
    """Get a specific template by ID"""
    if template_id not in TEMPLATES:
        raise HTTPException(status_code=404, detail="Template not found")
    return TEMPLATES[template_id]

class ApplyTemplateRequest(BaseModel):
    template_id: str
    offset_x: float = 0
    offset_y: float = 0

@app.post("/api/apply-template")
async def apply_template(request: ApplyTemplateRequest):
    """Apply a template to create tables and relationships"""
    if request.template_id not in TEMPLATES:
        raise HTTPException(status_code=404, detail="Template not found")
    
    template = TEMPLATES[request.template_id]
    
    # Apply position offset to tables
    tables_with_offset = []
    for table in template.tables:
        table_copy = table.dict()
        if table_copy["position"]:
            table_copy["position"]["x"] += request.offset_x
            table_copy["position"]["y"] += request.offset_y
        tables_with_offset.append(Table(**table_copy))
    
    return {
        "tables": tables_with_offset,
        "relationships": template.relationships
    }

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "service": "ERD Diagram Tool API"}

if __name__ == "__main__":
    import os
    
    # In production (deployment), serve the React build files
    if os.getenv("REPLIT_DEPLOYMENT") == "1":
        from fastapi.responses import FileResponse
        
        # Mount the React build folder
        app.mount("/static", StaticFiles(directory="../frontend/build/static"), name="static")
        
        # Catch-all route to serve index.html for React Router
        @app.get("/{full_path:path}")
        async def serve_react_app(full_path: str):
            # Serve API routes normally
            if full_path.startswith("api/"):
                return {"detail": "Not Found"}
            
            # Check if file exists in build folder
            file_path = f"../frontend/build/{full_path}"
            if os.path.exists(file_path) and os.path.isfile(file_path):
                return FileResponse(file_path)
            
            # Default to index.html for React Router
            return FileResponse("../frontend/build/index.html")
    
    uvicorn.run(app, host="0.0.0.0", port=8000)