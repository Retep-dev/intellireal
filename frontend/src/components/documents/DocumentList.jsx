import { FileText, Trash2 } from 'lucide-react';

const TYPE_ICONS = {
  pdf: '📄',
  docx: '📝',
  xlsx: '📊',
  csv: '📊',
  html: '🌐',
  txt: '📃',
};

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function DocumentList({ documents, onDelete }) {
  if (!documents || documents.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon"><FileText size={48} /></div>
        <h3 className="empty-state-title">No Documents Yet</h3>
        <p className="empty-state-text">
          Upload financial documents (SEC filings, earnings reports, annual reports) to start analyzing.
        </p>
      </div>
    );
  }

  return (
    <div className="doc-list">
      {documents.map((doc) => {
        const ext = doc.filename.split('.').pop()?.toLowerCase() || 'txt';
        const icon = TYPE_ICONS[ext] || '📄';

        return (
          <div className="doc-item" key={doc.id}>
            <div className={`doc-icon ${ext}`}>
              {icon}
            </div>
            <div className="doc-info">
              <div className="doc-name">{doc.filename}</div>
              <div className="doc-meta">
                {formatFileSize(doc.file_size)} · {doc.num_chunks} chunks
                {doc.company && ` · ${doc.company}`}
                {doc.ticker && ` (${doc.ticker})`}
                {doc.created_at && ` · ${formatDate(doc.created_at)}`}
              </div>
            </div>
            <span className={`doc-status ${doc.status}`}>
              {doc.status}
            </span>
            {onDelete && (
              <button
                className="btn btn-ghost btn-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(doc.id);
                }}
                title="Delete document"
              >
                <Trash2 size={14} color="var(--accent-red)" />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
