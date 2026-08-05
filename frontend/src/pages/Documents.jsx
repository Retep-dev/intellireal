import { useState, useEffect } from 'react';
import { Upload, RefreshCw } from 'lucide-react';
import DocumentList from '../components/documents/DocumentList';
import UploadModal from '../components/documents/UploadModal';
import { apiRequest } from '../lib/supabase';

export default function Documents() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const result = await apiRequest('/documents/');
      setDocuments(result.documents || []);
    } catch (error) {
      console.warn('Failed to load documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (documentId) => {
    if (!confirm('Delete this document and all its embeddings?')) return;

    try {
      await apiRequest(`/documents/${documentId}`, { method: 'DELETE' });
      setDocuments(prev => prev.filter(d => d.id !== documentId));
    } catch (error) {
      console.error('Failed to delete:', error);
    }
  };

  const handleUploadComplete = () => {
    loadDocuments();
  };

  return (
    <div className="page-enter">
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
      }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700 }}>Documents</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 }}>
            Upload and manage your financial documents
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary btn-sm" onClick={loadDocuments}>
            <RefreshCw size={14} /> Refresh
          </button>
          <button className="btn btn-primary" onClick={() => setShowUpload(true)}>
            <Upload size={16} /> Upload Document
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      <div style={{
        display: 'flex',
        gap: 24,
        padding: '12px 16px',
        background: 'var(--bg-card)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-primary)',
        marginBottom: 16,
        fontSize: 13,
        color: 'var(--text-secondary)',
      }}>
        <span>
          <strong style={{ color: 'var(--text-primary)' }}>{documents.length}</strong> documents
        </span>
        <span>
          <strong style={{ color: 'var(--text-primary)' }}>
            {documents.reduce((sum, d) => sum + (d.num_chunks || 0), 0)}
          </strong> total chunks
        </span>
        <span>
          Supported: PDF, DOCX, XLSX, CSV, TXT, HTML
        </span>
      </div>

      {/* Document List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <div className="spinner" style={{ width: 32, height: 32, margin: '0 auto' }} />
        </div>
      ) : (
        <DocumentList documents={documents} onDelete={handleDelete} />
      )}

      {/* Upload Modal */}
      <UploadModal
        isOpen={showUpload}
        onClose={() => setShowUpload(false)}
        onUploadComplete={handleUploadComplete}
      />
    </div>
  );
}
