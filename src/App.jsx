import { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import VideoList from './components/VideoList'
import VideoPlayer from './components/VideoPlayer'
import ImageViewer from './components/ImageViewer'
import FrameGallery from './components/FrameGallery'
import UploadZone from './components/UploadZone'
import './App.css'

let uid = 1

export default function App() {
  const [videos, setVideos] = useState([])
  const [activeId, setActiveId] = useState(null)
  const [listOpen, setListOpen] = useState(false)
  const [yoloMode, setYoloMode] = useState(false)
  const [cropPos, setCropPos] = useState({ x: 0.5, y: 0.5 })
  const videoRef = useRef(null)
  const imageRef = useRef(null)

  const activeVideo = videos.find(v => v.id === activeId) ?? null
  const activeType = activeVideo?.type ?? null

  // Reset crop box ke tengah tiap ganti file
  useEffect(() => { setCropPos({ x: 0.5, y: 0.5 }) }, [activeId])

  // Gallery global — semua frame dari semua video/foto digabung
  const allFrames = useMemo(() =>
    videos
      .flatMap(v => v.frames.map(f => ({ ...f, sourceName: v.name, sourceId: v.id })))
      .sort((a, b) => a.id - b.id),
    [videos]
  )

  const updateVideo = useCallback((id, patch) => {
    setVideos(prev => prev.map(v => v.id === id ? { ...v, ...patch } : v))
  }, [])

  const addFiles = useCallback((files) => {
    const entries = Array.from(files)
      .filter(f => f.type.startsWith('video/') || f.type.startsWith('image/'))
      .map(f => ({
        id: uid++,
        name: f.name.replace(/\.[^/.]+$/, ''),
        url: URL.createObjectURL(f),
        type: f.type.startsWith('video/') ? 'video' : 'image',
        status: 'pending',
        frames: [],
        thumb: null,
      }))
    if (!entries.length) return
    setVideos(prev => {
      const next = [...prev, ...entries]
      if (activeId === null) setActiveId(next[0].id)
      return next
    })
    setListOpen(false)
  }, [activeId])

  const captureFrame = useCallback((isYolo) => {
    if (!activeId) return
    const el = activeType === 'video' ? videoRef.current : imageRef.current
    if (!el) return

    const srcW = activeType === 'video' ? el.videoWidth : el.naturalWidth
    const srcH = activeType === 'video' ? el.videoHeight : el.naturalHeight

    let canvas
    if (isYolo) {
      const SIZE = 640
      canvas = document.createElement('canvas')
      canvas.width = SIZE
      canvas.height = SIZE
      const ctx = canvas.getContext('2d')
      const boxVid = Math.min(srcW, srcH)
      const cx = Math.max(boxVid / 2, Math.min(srcW - boxVid / 2, cropPos.x * srcW))
      const cy = Math.max(boxVid / 2, Math.min(srcH - boxVid / 2, cropPos.y * srcH))
      ctx.drawImage(el, cx - boxVid / 2, cy - boxVid / 2, boxVid, boxVid, 0, 0, SIZE, SIZE)
    } else {
      canvas = document.createElement('canvas')
      canvas.width = srcW
      canvas.height = srcH
      canvas.getContext('2d').drawImage(el, 0, 0)
    }

    const frame = {
      id: Date.now(),
      src: canvas.toDataURL('image/png'),
      timestamp: activeType === 'video' ? (videoRef.current?.currentTime ?? 0) : null,
      yolo: isYolo,
      sourceId: activeId,
      sourceName: activeVideo?.name ?? '',
    }
    setVideos(prev => prev.map(vid =>
      vid.id === activeId ? { ...vid, frames: [...vid.frames, frame] } : vid
    ))
  }, [activeId, activeType, cropPos, activeVideo])

  // Delete dari video manapun (ID frame unik global)
  const deleteFrame = useCallback((frameId) => {
    setVideos(prev => prev.map(v => ({
      ...v,
      frames: v.frames.filter(f => f.id !== frameId),
    })))
  }, [])

  const removeVideo = useCallback((id) => {
    setVideos(prev => {
      const next = prev.filter(v => v.id !== id)
      if (id === activeId) setActiveId(next[0]?.id ?? null)
      return next
    })
  }, [activeId])

  // Tandai selesai lalu pindah ke file berikutnya
  const goNext = useCallback(() => {
    if (!activeId) return
    updateVideo(activeId, { status: 'done' })
    const idx = videos.findIndex(v => v.id === activeId)
    const next = videos[idx + 1]
    if (next) setActiveId(next.id)
  }, [activeId, videos, updateVideo])

  const downloadFrame = useCallback((frame) => {
    const a = document.createElement('a')
    a.href = frame.src
    const name = frame.sourceName ?? 'frame'
    const ts = frame.timestamp !== null ? `_${secToName(frame.timestamp)}` : ''
    const suffix = frame.yolo ? '_640x640' : ''
    a.download = `${name}${ts}${suffix}.png`
    a.click()
  }, [])

  const downloadAll = useCallback(() => {
    allFrames.forEach((f, i) => setTimeout(() => {
      const a = document.createElement('a')
      a.href = f.src
      const name = f.sourceName ?? 'frame'
      const ts = f.timestamp !== null ? `_${secToName(f.timestamp)}` : ''
      const suffix = f.yolo ? '_640x640' : ''
      a.download = `${name}_${String(i + 1).padStart(3, '0')}${ts}${suffix}.png`
      a.click()
    }, i * 200))
  }, [allFrames])

  const doneCnt = videos.filter(v => v.status === 'done').length

  return (
    <div className="app">
      <header className="hdr">
        <div className="hdr-brand">
          <VideoIcon />
          <span>Video Crop</span>
        </div>

        {videos.length > 0 && (
          <div className="hdr-right">
            {doneCnt > 0 && (
              <span className="hdr-stat">{doneCnt}/{videos.length} selesai</span>
            )}
            <button className="btn-toggle" onClick={() => setListOpen(o => !o)}>
              {listOpen
                ? <XIcon />
                : <><ListIcon /><span>{videos.length} File</span></>
              }
            </button>
          </div>
        )}
      </header>

      <div className="body">
        {videos.length > 0 && (
          <>
            {listOpen && <div className="overlay" onClick={() => setListOpen(false)} />}
            <aside className={`sidebar ${listOpen ? 'open' : ''}`}>
              <VideoList
                videos={videos}
                activeId={activeId}
                onSelect={id => { setActiveId(id); setListOpen(false) }}
                onAddMore={addFiles}
                onRemove={removeVideo}
                onToggleDone={id => updateVideo(id, {
                  status: videos.find(v => v.id === id)?.status === 'done' ? 'pending' : 'done'
                })}
                onSetThumb={(id, thumb) => updateVideo(id, { thumb })}
              />
            </aside>
          </>
        )}

        <main className="main">
          {videos.length === 0
            ? <UploadZone onAdd={addFiles} />
            : !activeVideo
              ? <p className="empty-hint">Pilih file dari daftar</p>
              : (
                <div className="workspace">
                  {activeVideo.type === 'video'
                    ? (
                      <VideoPlayer
                        key={activeVideo.id}
                        src={activeVideo.url}
                        name={activeVideo.name}
                        status={activeVideo.status}
                        videoRef={videoRef}
                        yoloMode={yoloMode}
                        cropPos={cropPos}
                        onCropMove={setCropPos}
                        onYoloToggle={() => setYoloMode(m => !m)}
                        onCapture={captureFrame}
                        onThumb={thumb => updateVideo(activeId, { thumb })}
                        onMarkDone={() => updateVideo(activeId, { status: 'done' })}
                        onMarkPending={() => updateVideo(activeId, { status: 'pending' })}
                        onNext={goNext}
                        hasNext={videos.findIndex(v => v.id === activeId) < videos.length - 1}
                      />
                    )
                    : (
                      <ImageViewer
                        key={activeVideo.id}
                        src={activeVideo.url}
                        name={activeVideo.name}
                        status={activeVideo.status}
                        imgRef={imageRef}
                        yoloMode={yoloMode}
                        cropPos={cropPos}
                        onCropMove={setCropPos}
                        onYoloToggle={() => setYoloMode(m => !m)}
                        onCapture={captureFrame}
                        onMarkDone={() => updateVideo(activeId, { status: 'done' })}
                        onMarkPending={() => updateVideo(activeId, { status: 'pending' })}
                        onNext={goNext}
                        hasNext={videos.findIndex(v => v.id === activeId) < videos.length - 1}
                      />
                    )
                  }
                  <FrameGallery
                    frames={allFrames}
                    onDelete={deleteFrame}
                    onDownload={downloadFrame}
                    onDownloadAll={downloadAll}
                  />
                </div>
              )
          }
        </main>
      </div>
    </div>
  )
}

function secToName(s) {
  return `${String(Math.floor(s / 60)).padStart(2, '0')}${String(Math.floor(s % 60)).padStart(2, '0')}`
}

function VideoIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="23 7 16 12 23 17 23 7" />
      <rect x="1" y="5" width="15" height="14" rx="2" />
    </svg>
  )
}
function ListIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" />
      <circle cx="3" cy="6" r="1" fill="currentColor" /><circle cx="3" cy="12" r="1" fill="currentColor" /><circle cx="3" cy="18" r="1" fill="currentColor" />
    </svg>
  )
}
function XIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}
