import { useState, useCallback, useEffect } from 'react'
import CropOverlay from './CropOverlay'

export default function ImageViewer({
  src, name, status, imgRef,
  yoloMode, cropPos, onCropMove, onYoloToggle,
  onCapture, onMarkDone, onMarkPending,
  onNext, hasNext,
}) {
  const [flash, setFlash] = useState(false)
  const [dims, setDims] = useState(null)

  const handleCapture = useCallback(() => {
    setFlash(true)
    setTimeout(() => setFlash(false), 300)
    onCapture(yoloMode)
  }, [onCapture, yoloMode])

  const STEP = 0.04
  useEffect(() => {
    const handler = (e) => {
      const tag = e.target.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      if (e.code === 'Enter') { e.preventDefault(); onNext(); return }
      if (e.code === 'KeyC') { handleCapture(); return }
      if (yoloMode && !e.shiftKey) {
        if (e.code === 'ArrowLeft')  { e.preventDefault(); onCropMove(p => ({ ...p, x: Math.max(0, p.x - STEP) })); return }
        if (e.code === 'ArrowRight') { e.preventDefault(); onCropMove(p => ({ ...p, x: Math.min(1, p.x + STEP) })); return }
        if (e.code === 'ArrowUp')    { e.preventDefault(); onCropMove(p => ({ ...p, y: Math.max(0, p.y - STEP) })); return }
        if (e.code === 'ArrowDown')  { e.preventDefault(); onCropMove(p => ({ ...p, y: Math.min(1, p.y + STEP) })); return }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [handleCapture, yoloMode, onCropMove, onNext])

  return (
    <div className="player">
      <div className="player-topbar">
        <div className="player-name-row">
          <span className="badge-img">IMG</span>
          <h2 className="player-name" title={name}>{name}</h2>
        </div>
        <div className="topbar-actions">
          <button
            className={`btn-done ${status === 'done' ? 'is-done' : ''}`}
            onClick={status === 'done' ? onMarkPending : onMarkDone}
            title={status === 'done' ? 'Batalkan selesai' : 'Tandai selesai'}
          >
            <CheckIcon />
            {status === 'done' ? 'Selesai' : 'Tandai Selesai'}
          </button>
          <button
            className="btn-next"
            onClick={onNext}
            title="Tandai selesai dan lanjut ke berikutnya"
          >
            Selesai & Lanjut
            <NextIcon />
          </button>
        </div>
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
        {yoloMode && dims && (
          <CropOverlay mediaW={dims.w} mediaH={dims.h} cropPos={cropPos} onMove={onCropMove} />
        )}
      </div>

      <div className="img-ctrl">
        <span className="img-dims">
          {dims ? `${dims.w} × ${dims.h} px` : ''}
          {dims && yoloMode && <span className="img-dims-arrow"> → 640 × 640 px</span>}
        </span>
        <div className="img-ctrl-right">
          <button className={`btn-yolo ${yoloMode ? 'yolo-on' : ''}`} onClick={onYoloToggle} title="Mode 640×640 YOLO">
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

function CheckIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="13" height="13"><polyline points="20 6 9 17 4 12" /></svg> }
function NextIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="13" height="13"><polyline points="9 18 15 12 9 6" /></svg> }
function CropIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15"><path d="M6.13 1L6 16a2 2 0 0 0 2 2h15" /><path d="M1 6.13L16 6a2 2 0 0 1 2 2v15" /></svg> }
