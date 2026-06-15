import { useRef, useEffect } from 'react'

export default function VideoList({ videos, activeId, onSelect, onAddMore, onRemove, onToggleDone, onSetThumb }) {
  const inputRef = useRef(null)
  const done = videos.filter(v => v.status === 'done').length

  return (
    <div className="vlist">
      <div className="vlist-head">
        <span className="vlist-title">Daftar Video</span>
        <span className="vlist-stat">{done}/{videos.length} selesai</span>
      </div>

      <div className="vlist-body">
        {videos.map((v, i) => (
          <VideoItem
            key={v.id}
            video={v}
            index={i}
            active={v.id === activeId}
            onSelect={() => onSelect(v.id)}
            onRemove={() => onRemove(v.id)}
            onToggleDone={() => onToggleDone(v.id)}
            onSetThumb={(thumb) => onSetThumb(v.id, thumb)}
          />
        ))}
      </div>

      <div className="vlist-foot">
        <input
          ref={inputRef}
          type="file"
          accept="video/*"
          multiple
          hidden
          onChange={e => { onAddMore(e.target.files); inputRef.current.value = '' }}
        />
        <button className="btn-add" onClick={() => inputRef.current.click()}>
          <PlusIcon />
          Tambah Video
        </button>
      </div>
    </div>
  )
}

function VideoItem({ video, index, active, onSelect, onRemove, onToggleDone, onSetThumb }) {
  const generated = useRef(false)

  useEffect(() => {
    if (video.thumb || generated.current) return
    generated.current = true
    const el = document.createElement('video')
    el.muted = true
    el.preload = 'metadata'
    el.src = video.url
    const capture = () => {
      if (!el.videoWidth) return
      const c = document.createElement('canvas')
      c.width = 160
      c.height = 90
      c.getContext('2d').drawImage(el, 0, 0, 160, 90)
      onSetThumb(c.toDataURL('image/jpeg', 0.65))
    }
    el.addEventListener('loadeddata', capture, { once: true })
    el.load()
    return () => { el.src = '' }
  }, [video.id])

  const done = video.status === 'done'

  return (
    <div
      className={`vi ${active ? 'vi-active' : ''} ${done ? 'vi-done' : ''}`}
      onClick={onSelect}
    >
      <div className="vi-thumb">
        {video.thumb
          ? <img src={video.thumb} alt="" />
          : <span className="vi-num">{index + 1}</span>
        }
        {done && (
          <div className="vi-check">
            <CheckIcon size={10} />
          </div>
        )}
      </div>

      <div className="vi-info">
        <p className="vi-name" title={video.name}>{video.name}</p>
        <p className="vi-meta">
          <span>{video.frames.length} frame</span>
          {done && <span className="vi-badge">Selesai</span>}
        </p>
      </div>

      <div className="vi-btns" onClick={e => e.stopPropagation()}>
        <button
          className={`vi-btn ${done ? 'vi-btn-ok' : ''}`}
          onClick={onToggleDone}
          title={done ? 'Batalkan selesai' : 'Tandai selesai'}
        >
          <CheckIcon size={13} />
        </button>
        <button className="vi-btn vi-btn-del" onClick={onRemove} title="Hapus">
          <XIcon />
        </button>
      </div>
    </div>
  )
}

function CheckIcon({ size = 14 }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width={size} height={size}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}
function XIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}
function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  )
}
