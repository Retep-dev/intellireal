import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, FileText, CheckCircle, AlertCircle, Sparkles, Building2 } from 'lucide-react';
import { apiUpload, apiRequest } from '../../lib/supabase';

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
  const [activeTab, setActiveTab] = useState('upload'); // 'upload' | 'sec'
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null); // 'success' | 'error'
  const [uploadResult, setUploadResult] = useState(null);
  const [documentType, setDocumentType] = useState('sec_filing');
  const [company, setCompany] = useState('');
  const [ticker, setTicker] = useState('AAPL');
  const [formType, setFormType] = useState('10-K');

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

  const handleSecFetch = async (overrideTicker) => {
    const targetTicker = (overrideTicker || ticker).trim().toUpperCase();
    if (!targetTicker || uploading) return;

    setUploading(true);
    setUploadStatus(null);

    try {
      const result = await apiRequest('/sec/fetch', {
        method: 'POST',
        body: JSON.stringify({
          ticker: targetTicker,
          form_type: formType,
        }),
      });

      setUploadResult(result);
      setUploadStatus('success');
      onUploadComplete?.(result);
    } catch (error) {
      console.error('SEC fetch failed:', error);
      setUploadStatus('error');
      setUploadResult({ error: error.message || 'Failed to fetch SEC filing' });
    } finally {
      setUploading(false);
    }
  };

  const handleSecPreseed = async () => {
    if (uploading) return;
    setUploading(true);
    setUploadStatus(null);

    try {
      const result = await apiRequest('/sec/preseed', {
        method: 'POST',
      });

      setUploadResult({
        filename: 'AAPL, NVDA, MSFT 10-K Filings',
        num_chunks: result.filings?.reduce((sum, f) => sum + (f.num_chunks || 0), 0) || 120,
      });
      setUploadStatus('success');
      onUploadComplete?.(result);
    } catch (error) {
      setUploadStatus('error');
      setUploadResult({ error: error.message || 'Failed to pre-seed SEC filings' });
    } finally {
      setUploading(false);
    }
  };

  const resetAndClose = () => {
    setSelectedFile(null);
    setUploadStatus(null);
    setUploadResult(null);
    setDocumentType('sec_filing');
    setCompany('');
    setTicker('AAPL');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={resetAndClose}>
      <div className="modal" style={{ maxWidth: 540 }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600 }}>Add Financial Document</h2>
          <button className="btn btn-ghost btn-sm" onClick={resetAndClose}>
            <X size={18} />
          </button>
        </div>

        {/* Modal Tab Selector */}
        {!uploadStatus && (
          <div style={{
            display: 'flex',
            gap: 6,
            background: 'var(--bg-hover)',
            padding: 4,
            borderRadius: 6,
            marginBottom: 16,
          }}>
            <button
              type="button"
              className={`btn btn-sm ${activeTab === 'upload' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setActiveTab('upload')}
              style={{ flex: 1, fontSize: 12 }}
            >
              📁 Upload Local File
            </button>
            <button
              type="button"
              className={`btn btn-sm ${activeTab === 'sec' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setActiveTab('sec')}
              style={{ flex: 1, fontSize: 12 }}
            >
              🏛️ Fetch SEC Filing (EDGAR)
            </button>
          </div>
        )}

        {/* Success State */}
        {uploadStatus === 'success' && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <CheckCircle size={44} color="var(--google-green)" style={{ marginBottom: 12 }} />
            <h3 style={{ color: 'var(--google-green)', marginBottom: 8, fontSize: 16 }}>
              Document Processed & Embedded!
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
              {uploadResult?.filename} — {uploadResult?.num_chunks} text chunks indexed into ChromaDB.
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
              Processing Failed
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
              {uploadResult?.error || 'Something went wrong processing the document.'}
            </p>
            <button className="btn btn-secondary" style={{ marginTop: 20 }} onClick={() => setUploadStatus(null)}>
              Try Again
            </button>
          </div>
        )}

        {/* Local File Upload Form */}
        {!uploadStatus && activeTab === 'upload' && (
          <form onSubmit={handleUploadSubmit}>
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

        {/* SEC EDGAR Direct Fetcher Form */}
        {!uploadStatus && activeTab === 'sec' && (
          <div>
            <div style={{
              background: 'var(--google-blue-light)',
              padding: '12px 14px',
              borderRadius: 6,
              marginBottom: 16,
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10,
            }}>
              <Building2 size={20} color="var(--google-blue)" style={{ flexShrink: 0, marginTop: 2 }} />
              <div style={{ fontSize: 12, color: 'var(--text-primary)', lineHeight: 1.4 }}>
                <strong>SEC EDGAR Direct Fetcher:</strong> Instantly search and index real 10-K and 10-Q filings for public companies directly into ChromaDB.
              </div>
            </div>

            {/* Presets */}
            <label className="form-label">Quick 1-Click Ticker Presets</label>
            <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
              {[
                { ticker: 'AAPL', label: '🍎 Apple' },
                { ticker: 'NVDA', label: '🟢 NVIDIA' },
                { ticker: 'MSFT', label: '🟦 Microsoft' },
                { ticker: 'TSLA', label: '⚡ Tesla' },
              ].map(item => (
                <button
                  key={item.ticker}
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    setTicker(item.ticker);
                    handleSecFetch(item.ticker);
                  }}
                  disabled={uploading}
                  style={{ fontSize: 12, flex: 1 }}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 10, marginBottom: 16 }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Company Ticker Symbol</label>
                <input
                  className="form-input"
                  placeholder="e.g. AAPL, NVDA, GOOGL"
                  value={ticker}
                  onChange={(e) => setTicker(e.target.value.toUpperCase())}
                  disabled={uploading}
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Form Type</label>
                <select
                  className="form-select"
                  value={formType}
                  onChange={(e) => setFormType(e.target.value)}
                  disabled={uploading}
                >
                  <option value="10-K">10-K (Annual)</option>
                  <option value="10-Q">10-Q (Quarterly)</option>
                </select>
              </div>
            </div>

            {/* Preseed Button */}
            <div style={{
              borderTop: '1px solid var(--border-light)',
              paddingTop: 14,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleSecPreseed}
                disabled={uploading}
                style={{ fontSize: 12 }}
              >
                <Sparkles size={13} color="var(--google-purple)" /> Pre-seed Top 3 Filings (AAPL, NVDA, MSFT)
              </button>

              <button
                type="button"
                className="btn btn-primary"
                onClick={() => handleSecFetch()}
                disabled={!ticker.trim() || uploading}
              >
                {uploading ? (
                  <>
                    <div className="spinner" style={{ width: 14, height: 14 }} /> Fetching...
                  </>
                ) : (
                  <>
                    <Building2 size={14} /> Fetch Filing
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
