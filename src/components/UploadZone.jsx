import { useState, useRef } from 'react'

export default function UploadZone({ onAdd }) {
  const [dragging, setDragging] = useState(false)
  const fileRef = useRef(null)
  const folderRef = useRef(null)

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
    >
      <input
        ref={fileRef}
        type="file"
        accept="video/*"
        multiple
        hidden
        onChange={e => { onAdd(e.target.files); fileRef.current.value = '' }}
      />
      <input
        ref={folderRef}
        type="file"
        webkitdirectory=""
        hidden
        onChange={e => { onAdd(e.target.files); folderRef.current.value = '' }}
      />
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="64" height="64" className="upload-icon">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="17 8 12 3 7 8" />
        <line x1="12" y1="3" x2="12" y2="15" />
      </svg>
      <p className="upload-t">Pilih video atau buka folder</p>
      <p className="upload-s">Semua video dalam folder otomatis terbaca &nbsp;·&nbsp; MP4, MOV, AVI, WebM</p>
      <div className="upload-btns">
        <button className="btn-pick" onClick={e => { e.stopPropagation(); fileRef.current.click() }}>
          Pilih Video
        </button>
        <button className="btn-pick btn-folder" onClick={e => { e.stopPropagation(); folderRef.current.click() }}>
          <FolderIcon />
          Buka Folder
        </button>
      </div>
    </div>
  )
}

function FolderIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
  )
}
