import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { apiUpload } from '../../lib/supabase';

const ACCEPTED_TYPES = {
  'application/pdf': ['.pdf'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
  'text/csv': ['.csv'],
  'text/plain': ['.txt'],
  'text/html': ['.html', '.htm'],
};

export default function UploadModal({ isOpen, onClose, onUploadComplete }) {
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null); // 'success' | 'error'
  const [uploadResult, setUploadResult] = useState(null);
  const [documentType, setDocumentType] = useState('other');
  const [company, setCompany] = useState('');
  const [ticker, setTicker] = useState('');

  const onDrop = useCallback(async (acceptedFiles) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    setUploading(true);
    setUploadStatus(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('document_type', documentType);
      if (company) formData.append('company', company);
      if (ticker) formData.append('ticker', ticker);

      const result = await apiUpload('/documents/upload', formData);
      setUploadResult(result);
      setUploadStatus('success');
      onUploadComplete?.(result);
    } catch (error) {
      console.error('Upload failed:', error);
      setUploadStatus('error');
      setUploadResult({ error: error.message });
    } finally {
      setUploading(false);
    }
  }, [documentType, company, ticker, onUploadComplete]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    maxFiles: 1,
    disabled: uploading,
  });

  const resetAndClose = () => {
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 className="modal-title">Upload Document</h2>
          <button className="btn btn-ghost btn-sm" onClick={resetAndClose}>
            <X size={18} />
          </button>
        </div>

        {/* Success State */}
        {uploadStatus === 'success' && (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <CheckCircle size={48} color="var(--accent-green)" style={{ marginBottom: 12 }} />
            <h3 style={{ color: 'var(--accent-green)', marginBottom: 8 }}>
              Document Processed!
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
              {uploadResult?.filename} — {uploadResult?.num_chunks} chunks created
            </p>
            <button className="btn btn-primary" style={{ marginTop: 20 }} onClick={resetAndClose}>
              Done
            </button>
          </div>
        )}

        {/* Error State */}
        {uploadStatus === 'error' && (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <AlertCircle size={48} color="var(--accent-red)" style={{ marginBottom: 12 }} />
            <h3 style={{ color: 'var(--accent-red)', marginBottom: 8 }}>
              Upload Failed
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
              {uploadResult?.error || 'Something went wrong'}
            </p>
            <button className="btn btn-secondary" style={{ marginTop: 20 }} onClick={() => setUploadStatus(null)}>
              Try Again
            </button>
          </div>
        )}

        {/* Upload Form */}
        {!uploadStatus && (
          <>
            {/* Dropzone */}
            <div
              {...getRootProps()}
              className={`dropzone ${isDragActive ? 'active' : ''}`}
            >
              <input {...getInputProps()} />
              {uploading ? (
                <>
                  <div className="spinner" style={{ width: 32, height: 32, margin: '0 auto 12px' }} />
                  <p className="dropzone-text">Processing document...</p>
                </>
              ) : (
                <>
                  <div className="dropzone-icon">
                    <Upload size={36} />
                  </div>
                  <p className="dropzone-text">
                    {isDragActive
                      ? 'Drop your file here...'
                      : 'Drag & drop a file, or click to browse'}
                  </p>
                  <p className="dropzone-hint">
                    PDF, DOCX, XLSX, CSV, TXT, HTML — Max 50MB
                  </p>
                </>
              )}
            </div>

            {/* Metadata Fields */}
            <div style={{ marginTop: 20 }}>
              <div className="form-group">
                <label className="form-label">Document Type</label>
                <select
                  className="form-select"
                  value={documentType}
                  onChange={(e) => setDocumentType(e.target.value)}
                >
                  <option value="other">Other</option>
                  <option value="sec_filing">SEC Filing</option>
                  <option value="earnings_report">Earnings Report</option>
                  <option value="annual_report">Annual Report</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Company (optional)</label>
                  <input
                    className="form-input"
                    placeholder="e.g. Apple Inc."
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Ticker (optional)</label>
                  <input
                    className="form-input"
                    placeholder="e.g. AAPL"
                    value={ticker}
                    onChange={(e) => setTicker(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
