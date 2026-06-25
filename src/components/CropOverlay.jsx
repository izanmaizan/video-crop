import { useRef, useEffect, useState, useCallback } from 'react'

export default function CropOverlay({ mediaW, mediaH, cropPos, onMove }) {
  const overlayRef = useRef(null)
  const [box, setBox] = useState(null)
  const dragging = useRef(false)
  const dragStart = useRef(null)

  const calcBox = useCallback(() => {
    const ov = overlayRef.current
    if (!ov || !mediaW || !mediaH) return
    const cW = ov.clientWidth
    const cH = ov.clientHeight

    // Area video yang sebenarnya dirender (object-fit: contain)
    const scale = Math.min(cW / mediaW, cH / mediaH)
    const rW = mediaW * scale
    const rH = mediaH * scale
    const rX = (cW - rW) / 2
    const rY = (cH - rH) / 2

    // Crop box = persegi selebar min(mediaW, mediaH) dalam piksel video
    const boxVid = Math.min(mediaW, mediaH)
    const boxDisp = boxVid * scale

    // Posisi tengah crop box dalam piksel video (diklem ke batas valid)
    const cx = Math.max(boxVid / 2, Math.min(mediaW - boxVid / 2, cropPos.x * mediaW))
    const cy = Math.max(boxVid / 2, Math.min(mediaH - boxVid / 2, cropPos.y * mediaH))

    // Koordinat display
    const bx = rX + (cx - boxVid / 2) * scale
    const by = rY + (cy - boxVid / 2) * scale

    setBox({ bx, by, size: boxDisp, rX, rY, rW, rH })
  }, [mediaW, mediaH, cropPos])

  useEffect(() => { calcBox() }, [calcBox])

  useEffect(() => {
    const ov = overlayRef.current
    if (!ov) return
    const ro = new ResizeObserver(calcBox)
    ro.observe(ov)
    return () => ro.disconnect()
  }, [calcBox])

  const startDrag = useCallback((e) => {
    e.preventDefault()
    dragging.current = true
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const clientY = e.touches ? e.touches[0].clientY : e.clientY
    dragStart.current = { clientX, clientY, pos: { ...cropPos } }
  }, [cropPos])

  useEffect(() => {
    const handleMove = (e) => {
      if (!dragging.current || !dragStart.current || !box) return
      const clientX = e.touches ? e.touches[0].clientX : e.clientX
      const clientY = e.touches ? e.touches[0].clientY : e.clientY
      const dx = (clientX - dragStart.current.clientX) / box.rW
      const dy = (clientY - dragStart.current.clientY) / box.rH
      onMove({
        x: Math.max(0, Math.min(1, dragStart.current.pos.x + dx)),
        y: Math.max(0, Math.min(1, dragStart.current.pos.y + dy)),
      })
    }
    const handleUp = () => { dragging.current = false }
    window.addEventListener('mousemove', handleMove)
    window.addEventListener('mouseup', handleUp)
    window.addEventListener('touchmove', handleMove, { passive: false })
    window.addEventListener('touchend', handleUp)
    return () => {
      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('mouseup', handleUp)
      window.removeEventListener('touchmove', handleMove)
      window.removeEventListener('touchend', handleUp)
    }
  }, [box, onMove])

  if (!box) return <div ref={overlayRef} className="crop-ov" />

  const { bx, by, size, rX, rY, rW, rH } = box

  return (
    <div ref={overlayRef} className="crop-ov">
      {/* Masking di atas crop box (dalam area video) */}
      <div className="crop-mask" style={{ left: rX, top: rY, width: rW, height: Math.max(0, by - rY) }} />
      {/* Masking di bawah */}
      <div className="crop-mask" style={{ left: rX, top: by + size, width: rW, height: Math.max(0, rY + rH - by - size) }} />
      {/* Masking kiri */}
      <div className="crop-mask" style={{ left: rX, top: by, width: Math.max(0, bx - rX), height: size }} />
      {/* Masking kanan */}
      <div className="crop-mask" style={{ left: bx + size, top: by, width: Math.max(0, rX + rW - bx - size), height: size }} />

      {/* Kotak crop */}
      <div
        className="crop-box"
        style={{ left: bx, top: by, width: size, height: size }}
        onMouseDown={startDrag}
        onTouchStart={startDrag}
      >
        <div className="cb-c cb-tl" />
        <div className="cb-c cb-tr" />
        <div className="cb-c cb-bl" />
        <div className="cb-c cb-br" />
        <div className="cb-grid">
          <div /><div /><div />
          <div /><div /><div />
          <div /><div /><div />
        </div>
        <div className="cb-label">640 × 640</div>
      </div>
    </div>
  )
}
