import React from 'react';
import { ValidationError } from '../utils/schemaValidator';

interface ValidationPanelProps {
  errors: ValidationError[];
  isVisible: boolean;
  onClose: () => void;
}

const ValidationPanel: React.FC<ValidationPanelProps> = ({
  errors,
  isVisible,
  onClose
}) => {
  if (!isVisible || errors.length === 0) return null;

  const errorCount = errors.filter(e => e.type === 'error').length;
  const warningCount = errors.filter(e => e.type === 'warning').length;

  return (
    <div className="validation-panel-overlay">
      <div className="validation-panel">
        <div className="validation-panel-header">
          <h3>Schema Validation</h3>
          <div className="validation-stats">
            {errorCount > 0 && (
              <span className="stat error">🔴 {errorCount} Errors</span>
            )}
            {warningCount > 0 && (
              <span className="stat warning">🟡 {warningCount} Warnings</span>
            )}
          </div>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="validation-content">
          {errors.map((error, index) => (
            <div 
              key={index} 
              className={`validation-item ${error.type}`}
            >
              <div className="validation-icon">
                {error.type === 'error' ? '🔴' : '🟡'}
              </div>
              <div className="validation-details">
                <div className="validation-message">{error.message}</div>
                {error.table && (
                  <div className="validation-location">
                    Table: <strong>{error.table}</strong>
                    {error.column && (
                      <span>, Column: <strong>{error.column}</strong></span>
                    )}
                  </div>
                )}
                {error.relationship !== undefined && (
                  <div className="validation-location">
                    Relationship #{error.relationship + 1}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ValidationPanel;