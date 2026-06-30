import { useState, useRef, useEffect, useCallback } from 'react'
import CropOverlay from './CropOverlay'

export default function VideoPlayer({
  src, name, status, videoRef,
  yoloMode, cropPos, onCropMove, onYoloToggle,
  onCapture, onThumb, onMarkDone, onMarkPending,
  onNext, hasNext,
}) {
  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [muted, setMuted] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [flash, setFlash] = useState(false)
  const [dims, setDims] = useState(null)
  const progressRef = useRef(null)

  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    const onTime = () => setCurrentTime(v.currentTime)
    const onMeta = () => { setDuration(v.duration); setDims({ w: v.videoWidth, h: v.videoHeight }) }
    const onEnded = () => setPlaying(false)
    const onData = () => {
      if (!v.videoWidth) return
      const c = document.createElement('canvas')
      c.width = v.videoWidth; c.height = v.videoHeight
      c.getContext('2d').drawImage(v, 0, 0)
      onThumb(c.toDataURL('image/jpeg', 0.7))
    }
    v.addEventListener('timeupdate', onTime)
    v.addEventListener('loadedmetadata', onMeta)
    v.addEventListener('ended', onEnded)
    v.addEventListener('loadeddata', onData, { once: true })
    return () => {
      v.removeEventListener('timeupdate', onTime)
      v.removeEventListener('loadedmetadata', onMeta)
      v.removeEventListener('ended', onEnded)
    }
  }, [videoRef, onThumb])

  const togglePlay = useCallback(() => {
    const v = videoRef.current
    if (!v) return
    if (v.paused) { v.play(); setPlaying(true) }
    else { v.pause(); setPlaying(false) }
  }, [videoRef])

  const seekTo = useCallback((clientX) => {
    const bar = progressRef.current
    if (!bar || !duration) return
    const rect = bar.getBoundingClientRect()
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
    if (videoRef.current) videoRef.current.currentTime = ratio * duration
  }, [duration, videoRef])

  const skip = useCallback((delta) => {
    const v = videoRef.current
    if (v) v.currentTime = Math.max(0, Math.min(duration, v.currentTime + delta))
  }, [videoRef, duration])

  const handleVolume = (e) => {
    const val = parseFloat(e.target.value)
    setVolume(val); setMuted(val === 0)
    if (videoRef.current) { videoRef.current.volume = val; videoRef.current.muted = val === 0 }
  }

  const toggleMute = () => {
    const v = videoRef.current
    if (!v) return
    const next = !muted
    v.muted = next; setMuted(next)
    if (!next && volume === 0) { v.volume = 0.5; setVolume(0.5) }
  }

  const setSpd = (s) => {
    setSpeed(s)
    if (videoRef.current) videoRef.current.playbackRate = s
  }

  const handleCapture = useCallback(() => {
    setFlash(true)
    setTimeout(() => setFlash(false), 300)
    onCapture(yoloMode)
  }, [onCapture, yoloMode])

  // Keyboard: YOLO mode → Arrow geser kotak, Shift+Arrow skip video
  // Normal mode → Arrow skip video
  useEffect(() => {
    const STEP = 0.04
    const handler = (e) => {
      const tag = e.target.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return

      if (e.code === 'Space') { e.preventDefault(); togglePlay(); return }
      if (e.code === 'KeyC') { handleCapture(); return }

      if (yoloMode) {
        if (!e.shiftKey) {
          if (e.code === 'ArrowLeft')  { e.preventDefault(); onCropMove(p => ({ ...p, x: Math.max(0, p.x - STEP) })); return }
          if (e.code === 'ArrowRight') { e.preventDefault(); onCropMove(p => ({ ...p, x: Math.min(1, p.x + STEP) })); return }
          if (e.code === 'ArrowUp')    { e.preventDefault(); onCropMove(p => ({ ...p, y: Math.max(0, p.y - STEP) })); return }
          if (e.code === 'ArrowDown')  { e.preventDefault(); onCropMove(p => ({ ...p, y: Math.min(1, p.y + STEP) })); return }
        }
        if (e.shiftKey) {
          if (e.code === 'ArrowLeft')  { e.preventDefault(); skip(-5); return }
          if (e.code === 'ArrowRight') { e.preventDefault(); skip(5);  return }
        }
      } else {
        if (e.code === 'ArrowLeft')  { e.preventDefault(); skip(-5) }
        if (e.code === 'ArrowRight') { e.preventDefault(); skip(5)  }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [togglePlay, skip, handleCapture, yoloMode, onCropMove])

  const pct = duration ? (currentTime / duration) * 100 : 0

  return (
    <div className="player">
      <div className="player-topbar">
        <h2 className="player-name" title={name}>{name}</h2>
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

      <div className="video-box" onClick={!yoloMode ? togglePlay : undefined}>
        {flash && <div className="flash" />}
        <video ref={videoRef} src={src} className="video-el" playsInline />
        {!playing && !yoloMode && (
          <div className="play-overlay">
            <svg viewBox="0 0 24 24" fill="currentColor" width="54" height="54">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          </div>
        )}
        {yoloMode && dims && (
          <CropOverlay mediaW={dims.w} mediaH={dims.h} cropPos={cropPos} onMove={onCropMove} />
        )}
      </div>

      <div className="ctrl-wrap">
        <div
          className="prog"
          ref={progressRef}
          onClick={e => seekTo(e.clientX)}
          onTouchStart={e => { e.preventDefault(); seekTo(e.touches[0].clientX) }}
          onTouchMove={e => { e.preventDefault(); seekTo(e.touches[0].clientX) }}
        >
          <div className="prog-fill" style={{ width: `${pct}%` }} />
          <div className="prog-dot" style={{ left: `${pct}%` }} />
        </div>

        <div className="ctrl-main">
          <div className="ctrl-playback">
            <button className="c-btn" onClick={() => skip(-10)} title="−10s"><SkipBackIcon /></button>
            <button className="c-btn c-play" onClick={togglePlay}>
              {playing ? <PauseIcon /> : <PlayIcon />}
            </button>
            <button className="c-btn" onClick={() => skip(10)} title="+10s"><SkipFwdIcon /></button>
          </div>

          <div className="ctrl-secondary">
            <div className="vol-grp">
              <button className="c-btn" onClick={toggleMute}>
                {muted || volume === 0 ? <MuteIcon /> : <VolIcon />}
              </button>
              <input type="range" min="0" max="1" step="0.05"
                value={muted ? 0 : volume} onChange={handleVolume} className="vol-range" />
            </div>
            <span className="time">{fmt(currentTime)} / {fmt(duration)}</span>
          </div>

          <div className="ctrl-right">
            <div className="speeds">
              {[0.5, 1, 1.5, 2].map(s => (
                <button key={s} className={`spd ${speed === s ? 'spd-on' : ''}`} onClick={() => setSpd(s)}>
                  {s}x
                </button>
              ))}
            </div>
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

      <p className="hint">
        {yoloMode
          ? <><kbd>←</kbd><kbd>↑</kbd><kbd>↓</kbd><kbd>→</kbd> geser kotak &nbsp; <kbd>Shift</kbd>+<kbd>←</kbd><kbd>→</kbd> skip 5s &nbsp; <kbd>C</kbd> crop</>
          : <><kbd>Space</kbd> play/pause &nbsp; <kbd>←</kbd><kbd>→</kbd> skip 5s &nbsp; <kbd>C</kbd> crop</>
        }
      </p>
    </div>
  )
}

function fmt(s) {
  if (!s || isNaN(s)) return '00:00'
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(Math.floor(s % 60)).padStart(2, '0')}`
}

function PlayIcon() { return <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><polygon points="5 3 19 12 5 21 5 3" /></svg> }
function PauseIcon() { return <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></svg> }
function SkipBackIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><path d="M11 17l-5-5 5-5" /><path d="M18 17l-5-5 5-5" /></svg> }
function SkipFwdIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><path d="M13 17l5-5-5-5" /><path d="M6 17l5-5-5-5" /></svg> }
function VolIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="17" height="17"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><path d="M19.07 4.93a10 10 0 0 1 0 14.14" /><path d="M15.54 8.46a5 5 0 0 1 0 7.07" /></svg> }
function MuteIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="17" height="17"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><line x1="23" y1="9" x2="17" y2="15" /><line x1="17" y1="9" x2="23" y2="15" /></svg> }
function CropIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15"><path d="M6.13 1L6 16a2 2 0 0 0 2 2h15" /><path d="M1 6.13L16 6a2 2 0 0 1 2 2v15" /></svg> }
function CheckIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="13" height="13"><polyline points="20 6 9 17 4 12" /></svg> }
function NextIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="13" height="13"><polyline points="9 18 15 12 9 6" /></svg> }
