import { useState } from 'react'

export default function FrameGallery({ frames, onDelete, onDownload, onDownloadAll }) {
  const [preview, setPreview] = useState(null)

  if (frames.length === 0) {
    return (
      <div className="gallery-empty">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="44" height="44">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M3 9h18" />
          <path d="M9 21V9" />
        </svg>
        <p>Belum ada frame di-crop</p>
        <p className="gallery-empty-sub">Tekan <strong>Crop</strong> atau <kbd>C</kbd> saat video berjalan</p>
      </div>
    )
  }

  return (
    <div className="gallery">
      <div className="gallery-hd">
        <h3>
          Frame Hasil Crop
          <span className="cnt">{frames.length}</span>
        </h3>
        <button className="btn-dl-all" onClick={onDownloadAll}>
          <DlIcon /> Download Semua
        </button>
      </div>

      <div className="gallery-grid">
        {frames.map((f, i) => (
          <div key={f.id} className="fc" onClick={() => setPreview(f)}>
            <div className="fc-wrap">
              <img src={f.src} alt={`Frame ${i + 1}`} className="fc-img" />
              <div className="fc-overlay">
                <button className="fc-btn" onClick={e => { e.stopPropagation(); onDownload(f) }} title="Download">
                  <DlIcon />
                </button>
                <button className="fc-btn fc-del" onClick={e => { e.stopPropagation(); onDelete(f.id) }} title="Hapus">
                  <DelIcon />
                </button>
              </div>
            </div>
            <div className="fc-foot">
              <span className="fc-source" title={f.sourceName}>{f.sourceName ?? '—'}</span>
              <span>
                {f.yolo && <span className="fc-yolo">640²</span>}
                {f.timestamp !== null ? fmtTime(f.timestamp) : 'foto'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {preview && (
        <div className="modal-bg" onClick={() => setPreview(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <button className="modal-x" onClick={() => setPreview(null)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
            <img src={preview.src} alt="Preview" className="modal-img" />
            <div className="modal-ft">
              <div className="modal-info">
                <span className="modal-source">{preview.sourceName}</span>
                <span className="modal-ts">
                  {preview.timestamp !== null ? fmtTimeFull(preview.timestamp) : 'foto'}
                  {preview.yolo && <span className="fc-yolo" style={{ marginLeft: 6 }}>640×640</span>}
                </span>
              </div>
              <button className="btn-dl-modal" onClick={() => onDownload(preview)}>
                <DlIcon /> Download
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function fmtTime(s) {
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(Math.floor(s % 60)).padStart(2, '0')}`
}
function fmtTimeFull(s) {
  const m = Math.floor(s / 60), sec = Math.floor(s % 60), ms = Math.floor((s % 1) * 100)
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}.${String(ms).padStart(2, '0')}`
}
function DlIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
}
function DelIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /></svg>
}
