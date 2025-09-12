import React, { useState, useEffect } from 'react';
import { Table, Relationship } from '../App';

interface TemplateInfo {
  id: string;
  name: string;
  description: string;
  table_count: number;
  relationship_count: number;
}

interface TemplatesByCategory {
  [category: string]: TemplateInfo[];
}

interface TemplatePanelProps {
  onApplyTemplate: (tables: Table[], relationships: Relationship[]) => void;
  isVisible: boolean;
  onClose: () => void;
}

const TemplatePanel: React.FC<TemplatePanelProps> = ({
  onApplyTemplate,
  isVisible,
  onClose
}) => {
  const [templates, setTemplates] = useState<TemplatesByCategory>({});
  const [loading, setLoading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  useEffect(() => {
    if (isVisible) {
      loadTemplates();
    }
  }, [isVisible]);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${window.location.protocol}//${window.location.hostname}:8000/api/templates`);
      if (!response.ok) throw new Error('Failed to load templates');
      const data = await response.json();
      setTemplates(data);
    } catch (error) {
      console.error('Error loading templates:', error);
      alert('Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const applyTemplate = async (templateId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`${window.location.protocol}//${window.location.hostname}:8000/api/apply-template`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          template_id: templateId,
          offset_x: Math.random() * 200,
          offset_y: Math.random() * 200
        }),
      });

      if (!response.ok) throw new Error('Failed to apply template');
      const data = await response.json();
      
      onApplyTemplate(data.tables, data.relationships);
      onClose();
    } catch (error) {
      console.error('Error applying template:', error);
      alert('Failed to apply template');
    } finally {
      setLoading(false);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="template-panel-overlay">
      <div className="template-panel">
        <div className="template-panel-header">
          <h2>Database Templates</h2>
          <button 
            className="close-btn" 
            onClick={onClose}
            disabled={loading}
          >
            ×
          </button>
        </div>

        <div className="template-panel-content">
          {loading ? (
            <div className="loading">Loading templates...</div>
          ) : (
            Object.entries(templates).map(([category, categoryTemplates]) => (
              <div key={category} className="template-category">
                <h3 className="category-title">{category}</h3>
                <div className="template-grid">
                  {categoryTemplates.map((template) => (
                    <div 
                      key={template.id} 
                      className={`template-card ${selectedTemplate === template.id ? 'selected' : ''}`}
                      onClick={() => setSelectedTemplate(template.id)}
                    >
                      <div className="template-header">
                        <h4>{template.name}</h4>
                        <div className="template-stats">
                          <span className="stat">
                            📄 {template.table_count} tables
                          </span>
                          <span className="stat">
                            🔗 {template.relationship_count} relationships
                          </span>
                        </div>
                      </div>
                      <p className="template-description">{template.description}</p>
                      <button
                        className="apply-template-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          applyTemplate(template.id);
                        }}
                        disabled={loading}
                      >
                        Apply Template
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default TemplatePanel;