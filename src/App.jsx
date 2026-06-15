import { useState, useRef, useCallback } from 'react'
import VideoList from './components/VideoList'
import VideoPlayer from './components/VideoPlayer'
import FrameGallery from './components/FrameGallery'
import UploadZone from './components/UploadZone'
import './App.css'

let uid = 1

export default function App() {
  const [videos, setVideos] = useState([])
  const [activeId, setActiveId] = useState(null)
  const [listOpen, setListOpen] = useState(false)
  const videoRef = useRef(null)

  const activeVideo = videos.find(v => v.id === activeId) ?? null

  const updateVideo = useCallback((id, patch) => {
    setVideos(prev => prev.map(v => v.id === id ? { ...v, ...patch } : v))
  }, [])

  const addVideos = useCallback((files) => {
    const entries = Array.from(files)
      .filter(f => f.type.startsWith('video/'))
      .map(f => ({
        id: uid++,
        name: f.name.replace(/\.[^/.]+$/, ''),
        url: URL.createObjectURL(f),
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

  const captureFrame = useCallback(() => {
    const v = videoRef.current
    if (!v || !activeId) return
    const canvas = document.createElement('canvas')
    canvas.width = v.videoWidth
    canvas.height = v.videoHeight
    canvas.getContext('2d').drawImage(v, 0, 0)
    const frame = { id: Date.now(), src: canvas.toDataURL('image/png'), timestamp: v.currentTime }
    setVideos(prev => prev.map(vid =>
      vid.id === activeId ? { ...vid, frames: [...vid.frames, frame] } : vid
    ))
  }, [activeId])

  const deleteFrame = useCallback((frameId) => {
    setVideos(prev => prev.map(vid =>
      vid.id === activeId
        ? { ...vid, frames: vid.frames.filter(f => f.id !== frameId) }
        : vid
    ))
  }, [activeId])

  const removeVideo = useCallback((id) => {
    setVideos(prev => {
      const next = prev.filter(v => v.id !== id)
      if (id === activeId) setActiveId(next[0]?.id ?? null)
      return next
    })
  }, [activeId])

  const downloadFrame = useCallback((frame) => {
    const a = document.createElement('a')
    a.href = frame.src
    a.download = `${activeVideo?.name ?? 'frame'}_${secToName(frame.timestamp)}.png`
    a.click()
  }, [activeVideo])

  const downloadAll = useCallback(() => {
    if (!activeVideo) return
    activeVideo.frames.forEach((f, i) => setTimeout(() => {
      const a = document.createElement('a')
      a.href = f.src
      a.download = `${activeVideo.name}_${String(i + 1).padStart(3, '0')}_${secToName(f.timestamp)}.png`
      a.click()
    }, i * 200))
  }, [activeVideo])

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
                : <><ListIcon /><span>{videos.length} Video</span></>
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
                onAddMore={addVideos}
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
            ? <UploadZone onAdd={addVideos} />
            : !activeVideo
              ? <p className="empty-hint">Pilih video dari daftar</p>
              : (
                <div className="workspace">
                  <VideoPlayer
                    key={activeVideo.id}
                    src={activeVideo.url}
                    name={activeVideo.name}
                    status={activeVideo.status}
                    videoRef={videoRef}
                    onCapture={captureFrame}
                    onThumb={thumb => updateVideo(activeId, { thumb })}
                    onMarkDone={() => updateVideo(activeId, { status: 'done' })}
                    onMarkPending={() => updateVideo(activeId, { status: 'pending' })}
                  />
                  <FrameGallery
                    frames={activeVideo.frames}
                    videoName={activeVideo.name}
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
