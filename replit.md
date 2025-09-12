# ERD Diagram Tool

## Overview

This is a web-based Entity Relationship Diagram (ERD) tool that allows users to design database schemas visually. The application provides an interactive canvas for creating and editing database tables, defining relationships between them, and importing/exporting SQL schema definitions. Users can either build schemas visually using drag-and-drop components or import existing SQL CREATE TABLE statements to automatically generate diagrams.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18+ with TypeScript for type safety and modern development practices
- **UI Components**: Custom components built with React functional components and hooks
- **Diagram Rendering**: ReactFlow library for interactive node-based diagrams with drag-and-drop functionality
- **Code Editor**: Monaco Editor integration for SQL editing with syntax highlighting
- **State Management**: Local React state using useState hooks for managing tables, relationships, and UI state
- **Styling**: CSS modules and inline styles for component-specific styling

### Backend Architecture
- **Framework**: FastAPI (Python) for high-performance API development with automatic documentation
- **API Design**: RESTful endpoints for SQL parsing and schema generation
- **Data Models**: Pydantic models for request/response validation and serialization
- **SQL Processing**: SQLParse library for parsing CREATE TABLE statements into structured data
- **CORS**: Configured for cross-origin requests to support frontend-backend communication

### Core Components

#### Frontend Components
- **DiagramCanvas**: Main visual editor using ReactFlow for table positioning and relationship visualization
- **TableNode**: Custom React Flow node component for editable database table representation
- **SQLEditor**: Monaco-based editor for SQL input with parsing capabilities
- **Toolbar**: Control panel for adding tables, toggling views, and exporting schemas

#### Backend Services
- **SQL Parser**: Converts CREATE TABLE statements into structured table and column definitions
- **Schema Generator**: Transforms visual diagram data back into SQL CREATE statements
- **Relationship Detector**: Analyzes foreign key constraints to automatically generate table relationships

### Data Flow Architecture
1. **Visual to SQL**: User creates tables visually → Backend generates SQL statements
2. **SQL to Visual**: User inputs SQL → Backend parses into structured data → Frontend renders diagram
3. **Real-time Updates**: Local state changes immediately reflect in the visual diagram
4. **Export/Import**: Bidirectional conversion between visual representation and SQL code

### Design Patterns
- **Component Composition**: Modular React components with clear separation of concerns
- **Props Interface**: TypeScript interfaces for type-safe component communication
- **Event-Driven Updates**: Callback patterns for parent-child component communication
- **Stateless Backend**: API endpoints are stateless, relying on client-side state management

## External Dependencies

### Frontend Dependencies
- **ReactFlow**: Interactive node-based diagram rendering and manipulation
- **Monaco Editor**: Code editor with SQL syntax highlighting and IntelliSense
- **React**: Core framework for UI component development
- **TypeScript**: Static typing for improved development experience and error prevention

### Backend Dependencies
- **FastAPI**: Modern Python web framework with automatic API documentation
- **SQLParse**: SQL statement parsing and analysis library
- **Pydantic**: Data validation and serialization using Python type annotations
- **Uvicorn**: ASGI server for running FastAPI applications
- **SQLAlchemy**: SQL toolkit for potential database integration (prepared for future use)
- **Alembic**: Database migration tool (prepared for future use)

### Development Tools
- **Create React App**: React application bootstrapping and build tooling
- **Node.js**: JavaScript runtime for frontend development and build processes
- **Python**: Backend runtime environment with package management via pip

### Prepared Integrations
- **PostgreSQL**: Database drivers (asyncpg, psycopg2) included for future database persistence
- **Authentication**: JWT and password hashing libraries ready for user authentication features
- **WebSockets**: Real-time communication capability for collaborative editing features