import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, FileText, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { apiUpload } from '../../lib/supabase';

const ACCEPTED_TYPES = {
  'application/pdf': ['.pdf'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
  'text/csv': ['.csv'],
  'text/plain': ['.txt'],
  'text/html': ['.html', '.htm'],
};

function formatSize(bytes) {
  if (!bytes) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function UploadModal({ isOpen, onClose, onUploadComplete }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null); // 'success' | 'error'
  const [uploadResult, setUploadResult] = useState(null);
  const [documentType, setDocumentType] = useState('other');
  const [company, setCompany] = useState('');
  const [ticker, setTicker] = useState('');

  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      setSelectedFile(acceptedFiles[0]);
      setUploadStatus(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    maxFiles: 1,
    disabled: uploading,
  });

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile || uploading) return;

    setUploading(true);
    setUploadStatus(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('document_type', documentType);
      if (company.trim()) formData.append('company', company.trim());
      if (ticker.trim()) formData.append('ticker', ticker.trim());

      const result = await apiUpload('/documents/upload', formData);
      setUploadResult(result);
      setUploadStatus('success');
      onUploadComplete?.(result);
    } catch (error) {
      console.error('Upload failed:', error);
      setUploadStatus('error');
      setUploadResult({ error: error.message || 'Failed to upload document' });
    } finally {
      setUploading(false);
    }
  };

  const resetAndClose = () => {
    setSelectedFile(null);
    setUploadStatus(null);
    setUploadResult(null);
    setDocumentType('other');
    setCompany('');
    setTicker('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={resetAndClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600 }}>Upload Financial Document</h2>
          <button className="btn btn-ghost btn-sm" onClick={resetAndClose}>
            <X size={18} />
          </button>
        </div>

        {/* Success State */}
        {uploadStatus === 'success' && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <CheckCircle size={44} color="var(--google-green)" style={{ marginBottom: 12 }} />
            <h3 style={{ color: 'var(--google-green)', marginBottom: 8, fontSize: 16 }}>
              Document Processed Successfully!
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
              {uploadResult?.filename} — {uploadResult?.num_chunks} text chunks indexed for AI RAG.
            </p>
            <button className="btn btn-primary" style={{ marginTop: 20 }} onClick={resetAndClose}>
              Done
            </button>
          </div>
        )}

        {/* Error State */}
        {uploadStatus === 'error' && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <AlertCircle size={44} color="var(--google-red)" style={{ marginBottom: 12 }} />
            <h3 style={{ color: 'var(--google-red)', marginBottom: 8, fontSize: 16 }}>
              Upload Failed
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
              {uploadResult?.error || 'Something went wrong processing the document.'}
            </p>
            <button className="btn btn-secondary" style={{ marginTop: 20 }} onClick={() => setUploadStatus(null)}>
              Try Again
            </button>
          </div>
        )}

        {/* Form State */}
        {!uploadStatus && (
          <form onSubmit={handleUploadSubmit}>
            {/* File Dropzone or Preview */}
            {!selectedFile ? (
              <div
                {...getRootProps()}
                className={`dropzone ${isDragActive ? 'active' : ''}`}
              >
                <input {...getInputProps()} />
                <div style={{ margin: '0 auto 12px', color: 'var(--google-blue)' }}>
                  <Upload size={36} />
                </div>
                <p style={{ fontSize: 13, fontWeight: 500 }}>
                  {isDragActive ? 'Drop your file here...' : 'Drag & drop a file, or click to browse'}
                </p>
                <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 6 }}>
                  Supports PDF, DOCX, XLSX, CSV, TXT, HTML (Max 50MB)
                </p>
              </div>
            ) : (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 14px',
                background: 'var(--bg-hover)',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                marginBottom: 16,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <FileText size={24} color="var(--google-blue)" />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{selectedFile.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                      {formatSize(selectedFile.size)}
                    </div>
                  </div>
                </div>
                {!uploading && (
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => setSelectedFile(null)}
                  >
                    <X size={14} /> Change
                  </button>
                )}
              </div>
            )}

            {/* Metadata Selection Controls */}
            <div className="form-group" style={{ marginTop: 14 }}>
              <label className="form-label">Document Category</label>
              <select
                className="form-select"
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value)}
                disabled={uploading}
              >
                <option value="sec_filing">SEC Filing (10-K, 10-Q, 8-K)</option>
                <option value="earnings_report">Earnings Report</option>
                <option value="annual_report">Annual Report</option>
                <option value="other">Other Financial Document</option>
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 10 }}>
              <div className="form-group">
                <label className="form-label">Company Name</label>
                <input
                  className="form-input"
                  placeholder="e.g. Apple Inc."
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  disabled={uploading}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Ticker</label>
                <input
                  className="form-input"
                  placeholder="e.g. AAPL"
                  value={ticker}
                  onChange={(e) => setTicker(e.target.value)}
                  disabled={uploading}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={resetAndClose}
                disabled={uploading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={!selectedFile || uploading}
              >
                {uploading ? (
                  <>
                    <div className="spinner" style={{ width: 14, height: 14 }} /> Processing...
                  </>
                ) : (
                  <>
                    <Upload size={14} /> Upload & Analyze
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
