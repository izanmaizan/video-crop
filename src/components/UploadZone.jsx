import { useState, useRef } from 'react'

export default function UploadZone({ onAdd }) {
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef(null)

  const handleDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    const files = [...e.dataTransfer.files].filter(f => f.type.startsWith('video/'))
    if (files.length) onAdd(files)
  }

  return (
    <div
      className={`upload ${dragging ? 'drag-on' : ''}`}
      onDragOver={e => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept="video/*"
        multiple
        hidden
        onChange={e => { onAdd(e.target.files); inputRef.current.value = '' }}
      />
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="64" height="64" className="upload-icon">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="17 8 12 3 7 8" />
        <line x1="12" y1="3" x2="12" y2="15" />
      </svg>
      <p className="upload-t">Pilih atau seret video ke sini</p>
      <p className="upload-s">Bisa pilih banyak video sekaligus &nbsp;·&nbsp; MP4, MOV, AVI, WebM</p>
      <button className="btn-pick" onClick={e => { e.stopPropagation(); inputRef.current.click() }}>
        Pilih Video
      </button>
    </div>
  )
}
