import { useState, useCallback } from 'react'

export default function ImageViewer({ src, name, status, imgRef, yoloMode, onYoloToggle, onCapture, onMarkDone, onMarkPending }) {
  const [flash, setFlash] = useState(false)
  const [dims, setDims] = useState(null)

  const handleCapture = useCallback(() => {
    setFlash(true)
    setTimeout(() => setFlash(false), 300)
    onCapture(yoloMode)
  }, [onCapture, yoloMode])

  return (
    <div className="player">
      <div className="player-topbar">
        <div className="player-name-row">
          <span className="badge-img">IMG</span>
          <h2 className="player-name" title={name}>{name}</h2>
        </div>
        <button
          className={`btn-done ${status === 'done' ? 'is-done' : ''}`}
          onClick={status === 'done' ? onMarkPending : onMarkDone}
        >
          <CheckIcon />
          {status === 'done' ? 'Selesai' : 'Tandai Selesai'}
        </button>
      </div>

      <div className="img-box">
        {flash && <div className="flash" />}
        <img
          ref={imgRef}
          src={src}
          alt={name}
          className="img-el"
          onLoad={e => setDims({ w: e.target.naturalWidth, h: e.target.naturalHeight })}
        />
      </div>

      <div className="img-ctrl">
        <span className="img-dims">
          {dims ? `${dims.w} × ${dims.h} px` : ''}
          {dims && yoloMode && <span className="img-dims-arrow"> → 640 × 640 px</span>}
        </span>
        <div className="img-ctrl-right">
          <button
            className={`btn-yolo ${yoloMode ? 'yolo-on' : ''}`}
            onClick={onYoloToggle}
            title="Mode 640×640 untuk dataset YOLO"
          >
            640×640
          </button>
          <button className="c-crop" onClick={handleCapture}>
            <CropIcon />
            <span>Crop{yoloMode ? ' YOLO' : ''}</span>
          </button>
        </div>
      </div>
    </div>
  )
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="13" height="13">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}
function CropIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15">
      <path d="M6.13 1L6 16a2 2 0 0 0 2 2h15" />
      <path d="M1 6.13L16 6a2 2 0 0 1 2 2v15" />
    </svg>
  )
}
