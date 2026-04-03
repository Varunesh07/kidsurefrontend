// src/pages/Login.jsx
import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { GoogleLogin } from '@react-oauth/google'
import api from '../api/axios'
import './Login.css'

export default function Login() {
  const [mode, setMode] = useState('login')
  const [swapping, setSwapping] = useState(false)
  const navigate = useNavigate()

  const [loginData, setLoginData] = useState({ email: '', password: '' })
  const [signupData, setSignupData] = useState({ firstName: '', lastName: '', email: '', password: '', role: 'user', agreed: false })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [visContent, setVisContent] = useState({
    title: 'Your health guide<br/><em>in every city</em>',
    sub: 'Hospitals & specialist doctors — found instantly wherever you travel.',
    pills: ['4,200+ Hospitals', '60+ Specialties', '180 Cities'],
  })

  const bgCanvasRef = useRef(null)
  const sceneCanvasRef = useRef(null)

  const isMobile = () => window.innerWidth <= 640

  function toSignup() {
    if (mode === 'signup' || swapping) return
    setSwapping(true)
    setMode('signup')
    setError('')
    setTimeout(() => setSwapping(false), 460)
    if (!isMobile()) setVisContent({
      title: 'Healthcare<br/><em>at your fingertips</em>',
      sub: 'Tell us your symptoms — matched to the right specialist near you.',
      pills: ['Instant Matching', 'Verified Doctors', 'Free to Join'],
    })
  }

  function toLogin() {
    if (mode === 'login' || swapping) return
    setSwapping(true)
    setMode('login')
    setError('')
    setTimeout(() => setSwapping(false), 460)
    if (!isMobile()) setVisContent({
      title: 'Your health guide<br/><em>in every city</em>',
      sub: 'Hospitals & specialist doctors — found instantly wherever you travel.',
      pills: ['4,200+ Hospitals', '60+ Specialties', '180 Cities'],
    })
  }

  async function handleLogin(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await api.post('/api/auth/login', loginData)
      localStorage.setItem('token', res.data.token)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleSignup(e) {
    e.preventDefault()
    if (!signupData.agreed) { setError('Please accept the Terms of Service to continue.'); return }
    setError('')
    setLoading(true)
    try {
      const res = await api.post('/api/auth/register', {
        name: `${signupData.firstName} ${signupData.lastName}`.trim(),
        email: signupData.email,
        password: signupData.password,
        role: signupData.role,
      })
      localStorage.setItem('token', res.data.token)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSuccess = async (credentialResponse) => {
    setError('')
    setLoading(true)
    try {
      const res = await api.post('/api/auth/google', { credential: credentialResponse.credential })
      localStorage.setItem('token', res.data.token)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.message || 'Google sign-in failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  /* ── BG CANVAS ── */
  useEffect(() => {
    const bgC = bgCanvasRef.current
    if (!bgC) return
    const bgX = bgC.getContext('2d')
    let BW = 0, BH = 0, animId

    function resizeBg() {
      const dpr = devicePixelRatio || 1
      BW = bgC.offsetWidth * dpr; BH = bgC.offsetHeight * dpr
      bgC.width = BW; bgC.height = BH
      bgC.style.width = bgC.offsetWidth + 'px'; bgC.style.height = bgC.offsetHeight + 'px'
    }
    resizeBg()
    const ro = new ResizeObserver(resizeBg)
    ro.observe(bgC)

    const COLS = 10, ROWS = 10
    const pulses = []
    function spawnPulse() {
      pulses.push({ row: Math.floor(Math.random() * ROWS), dir: Math.random() < .5 ? 'h' : 'v', t: Math.random(), speed: .004 + Math.random() * .005, col: Math.random() < .6 ? '#3590d4' : '#1db896' })
    }
    for (let i = 0; i < 8; i++) spawnPulse()
    function iso(gx, gy, tW, tH) { return { x: (gx - gy) * (tW / 2), y: (gx + gy) * (tH / 2) } }

    function drawBg() {
      const dpr = devicePixelRatio || 1
      bgX.clearRect(0, 0, BW, BH)
      bgX.fillStyle = '#e8f4fc'; bgX.fillRect(0, 0, BW, BH)
      const g = bgX.createLinearGradient(0, 0, BW, BH)
      g.addColorStop(0, 'rgba(200,232,252,.6)'); g.addColorStop(.5, 'rgba(240,250,255,.2)'); g.addColorStop(1, 'rgba(180,235,220,.5)')
      bgX.fillStyle = g; bgX.fillRect(0, 0, BW, BH)
      const tW = BW * .12, tH = BH * .055, offX = BW * .5, offY = BH * .18
      bgX.lineWidth = 1.2 * dpr
      for (let r = 0; r <= ROWS; r++) for (let c = 0; c <= COLS; c++) {
        if (c < COLS) { const a = iso(c, r, tW, tH), b = iso(c + 1, r, tW, tH); bgX.strokeStyle = 'rgba(53,144,212,.12)'; bgX.beginPath(); bgX.moveTo(offX + a.x, offY + a.y); bgX.lineTo(offX + b.x, offY + b.y); bgX.stroke() }
        if (r < ROWS) { const a = iso(c, r, tW, tH), b = iso(c, r + 1, tW, tH); bgX.strokeStyle = 'rgba(29,184,150,.09)'; bgX.beginPath(); bgX.moveTo(offX + a.x, offY + a.y); bgX.lineTo(offX + b.x, offY + b.y); bgX.stroke() }
      }
      for (let r = 0; r <= ROWS; r++) for (let c = 0; c <= COLS; c++) {
        const pt = iso(c, r, tW, tH); const px = offX + pt.x, py = offY + pt.y
        if (px < -20 || px > BW + 20 || py < -20 || py > BH + 20) continue
        bgX.beginPath(); bgX.arc(px, py, 1.8 * dpr, 0, Math.PI * 2); bgX.fillStyle = 'rgba(53,144,212,.22)'; bgX.fill()
      }
      pulses.forEach(p => {
        p.t += p.speed; if (p.t >= 1) p.t = 0
        let ax, ay, bx, by, frac
        if (p.dir === 'h') { const ci = Math.floor(p.t * COLS); const a = iso(ci, p.row, tW, tH), b = iso(ci + 1, p.row, tW, tH); ax = offX + a.x; ay = offY + a.y; bx = offX + b.x; by = offY + b.y }
        else { const ri = Math.floor(p.t * ROWS); const a = iso(p.row, ri, tW, tH), b = iso(p.row, ri + 1, tW, tH); ax = offX + a.x; ay = offY + a.y; bx = offX + b.x; by = offY + b.y }
        frac = p.dir === 'h' ? (p.t * COLS) % 1 : (p.t * ROWS) % 1
        const px2 = ax + (bx - ax) * frac, py2 = ay + (by - ay) * frac
        bgX.beginPath(); bgX.arc(px2, py2, 3.5 * dpr, 0, Math.PI * 2); bgX.fillStyle = p.col + 'cc'; bgX.fill()
        const g2 = bgX.createLinearGradient(ax, ay, px2, py2); g2.addColorStop(0, p.col + '00'); g2.addColorStop(1, p.col + '55')
        bgX.strokeStyle = g2; bgX.lineWidth = 2 * dpr; bgX.beginPath(); bgX.moveTo(ax, ay); bgX.lineTo(px2, py2); bgX.stroke()
      })
      const vig = bgX.createRadialGradient(BW / 2, BH / 2, BH * .2, BW / 2, BH / 2, BH * .85)
      vig.addColorStop(0, 'rgba(0,0,0,0)'); vig.addColorStop(1, 'rgba(200,230,248,.25)')
      bgX.fillStyle = vig; bgX.fillRect(0, 0, BW, BH)
      animId = requestAnimationFrame(drawBg)
    }
    drawBg()
    return () => { cancelAnimationFrame(animId); ro.disconnect() }
  }, [])

  /* ── SCENE CANVAS ── */
  useEffect(() => {
    const sc = sceneCanvasRef.current
    if (!sc) return
    const ctx = sc.getContext('2d')
    const W = sc.width, H = sc.height
    const buildings = [
      { x: 0, w: 50, h: 108, col: '#b8d8ef' }, { x: 46, w: 34, h: 72, col: '#c6e2f5' },
      { x: 76, w: 60, h: 136, col: '#aed2ec' }, { x: 132, w: 42, h: 88, col: '#b8d8ef' },
      { x: 170, w: 36, h: 116, col: '#a8cceb' }, { x: 202, w: 54, h: 92, col: '#bcddf2' },
      { x: 252, w: 40, h: 155, col: '#a2c8e8' }, { x: 288, w: 46, h: 78, col: '#b8d8ef' },
      { x: 330, w: 34, h: 102, col: '#c2dff4' }, { x: 360, w: 58, h: 130, col: '#acd0ec' },
      { x: 414, w: 66, h: 85, col: '#b8d8ef' },
    ]
    const pins = [
      { x: 90, y: 172, label: 'City Hospital', spec: 'Emergency', col: '#3590d4' },
      { x: 196, y: 148, label: 'Apollo Clinic', spec: 'Cardiology', col: '#e8506a' },
      { x: 302, y: 186, label: 'MediCare', spec: 'General', col: '#1db896' },
      { x: 386, y: 156, label: 'Health Hub', spec: 'Ortho', col: '#f0a033' },
    ]
    const tourist = { x: 242, y: 222, tx: 0, ty: 0, trail: [], targetIdx: 0 }
    const ripples = []
    let scFrame = 0, nearTimer = 0, animId

    function newTarget() { const p = pins[tourist.targetIdx % pins.length]; tourist.tx = p.x; tourist.ty = p.y - 26; tourist.targetIdx++ }
    function addRipple(x, y, col) { ripples.push({ x, y, r: 3, alpha: .75, col }) }
    function rr(c, x, y, w, h, r) {
      c.beginPath(); c.moveTo(x + r, y); c.lineTo(x + w - r, y); c.quadraticCurveTo(x + w, y, x + w, y + r)
      c.lineTo(x + w, y + h - r); c.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
      c.lineTo(x + r, y + h); c.quadraticCurveTo(x, y + h, x, y + h - r)
      c.lineTo(x, y + r); c.quadraticCurveTo(x, y, x + r, y); c.closePath()
    }
    newTarget()

    function drawScene() {
      ctx.clearRect(0, 0, W, H)
      ctx.fillStyle = '#c2dff0'; ctx.fillRect(0, H - 42, W, 42)
      ctx.fillStyle = '#aacfe8'; ctx.fillRect(0, H - 29, W, 17)
      ctx.setLineDash([20, 14]); ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 1.8
      ctx.beginPath(); ctx.moveTo(0, H - 21); ctx.lineTo(W, H - 21); ctx.stroke(); ctx.setLineDash([])
      ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(0, H - 43, W, 2)

      buildings.forEach(b => {
        ctx.fillStyle = b.col; ctx.fillRect(b.x, H - 42 - b.h, b.w, b.h)
        ctx.fillStyle = 'rgba(0,60,100,.07)'; ctx.fillRect(b.x + b.w - 6, H - 42 - b.h, 6, b.h)
        ctx.fillStyle = 'rgba(255,255,255,.3)'; ctx.fillRect(b.x, H - 42 - b.h, b.w, 2)
        ctx.fillStyle = 'rgba(255,255,255,.28)'
        for (let wy = H - 42 - b.h + 10; wy < H - 54; wy += 16)
          for (let wx = b.x + 7; wx < b.x + b.w - 9; wx += 11) ctx.fillRect(wx, wy, 5, 8)
      })

      const tp = pins[(tourist.targetIdx - 1) % pins.length]
      if (tp) {
        ctx.save(); ctx.strokeStyle = 'rgba(53,144,212,.45)'; ctx.lineWidth = 2.2
        ctx.setLineDash([7, 6]); ctx.lineDashOffset = -(scFrame * .6)
        ctx.beginPath(); ctx.moveTo(tourist.x, tourist.y); ctx.lineTo(tp.x, tourist.y); ctx.lineTo(tp.x, tp.y - 17)
        ctx.stroke(); ctx.setLineDash([]); ctx.restore()
        const dist = Math.max(10, Math.round(Math.hypot(tp.x - tourist.x, tp.y - tourist.y) / 8) * 10)
        const mx = (tourist.x + tp.x) / 2, my = tourist.y - 16
        ctx.save(); ctx.fillStyle = 'rgba(255,255,255,.88)'; rr(ctx, mx - 22, my - 12, 44, 20, 8); ctx.fill()
        ctx.font = 'bold 9px Outfit,sans-serif'; ctx.fillStyle = '#1c70b8'; ctx.textAlign = 'center'
        ctx.fillText(dist + 'm', mx, my + 2); ctx.restore()
      }

      for (let i = ripples.length - 1; i >= 0; i--) {
        const rp = ripples[i]; rp.r += 1; rp.alpha -= .02
        if (rp.alpha <= 0) { ripples.splice(i, 1); continue }
        ctx.beginPath(); ctx.arc(rp.x, rp.y, rp.r, 0, Math.PI * 2)
        ctx.strokeStyle = rp.col + Math.round(rp.alpha * 255).toString(16).padStart(2, '0')
        ctx.lineWidth = 1.5; ctx.stroke()
      }

      pins.forEach((p, i) => {
        const pulse = Math.sin(scFrame * .045 + i * 1.2)
        ctx.beginPath(); ctx.arc(p.x, p.y - 3, 12 + pulse * 2, 0, Math.PI * 2); ctx.fillStyle = p.col + '22'; ctx.fill()
        ctx.save(); ctx.translate(p.x, p.y)
        ctx.beginPath(); ctx.arc(0, -18, 10, 0, Math.PI * 2); ctx.fillStyle = p.col; ctx.fill()
        ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 2; ctx.stroke()
        ctx.beginPath(); ctx.moveTo(-5, -10); ctx.lineTo(5, -10); ctx.lineTo(0, 0); ctx.fillStyle = p.col; ctx.fill()
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 2.2
        ctx.beginPath(); ctx.moveTo(0, -23); ctx.lineTo(0, -13); ctx.moveTo(-5, -18); ctx.lineTo(5, -18); ctx.stroke()
        ctx.restore()
        ctx.save(); ctx.fillStyle = 'rgba(255,255,255,.9)'; rr(ctx, p.x - 35, p.y - 52, 70, 17, 5); ctx.fill()
        ctx.font = 'bold 8px Outfit,sans-serif'; ctx.fillStyle = p.col; ctx.textAlign = 'center'; ctx.fillText(p.label, p.x, p.y - 41); ctx.restore()
        ctx.save(); ctx.fillStyle = p.col + '1a'; rr(ctx, p.x - 21, p.y + 3, 42, 13, 4); ctx.fill()
        ctx.font = '6.5px Outfit,sans-serif'; ctx.fillStyle = p.col; ctx.textAlign = 'center'; ctx.fillText(p.spec, p.x, p.y + 13); ctx.restore()
      })

      tourist.trail.forEach((pt, i) => {
        const t = i / tourist.trail.length
        ctx.beginPath(); ctx.arc(pt.x, pt.y, 2.5 * t, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(29,184,150,${.4 * t})`; ctx.fill()
      })
      ctx.beginPath(); ctx.arc(tourist.x, tourist.y, 10, 0, Math.PI * 2); ctx.fillStyle = 'rgba(29,184,150,.14)'; ctx.fill()
      ctx.beginPath(); ctx.arc(tourist.x, tourist.y, 7, 0, Math.PI * 2); ctx.fillStyle = '#1db896'; ctx.fill()
      ctx.beginPath(); ctx.arc(tourist.x, tourist.y, 3.2, 0, Math.PI * 2); ctx.fillStyle = '#fff'; ctx.fill()
      ctx.font = 'bold 8.5px Outfit,sans-serif'; ctx.fillStyle = '#0d2b40'; ctx.textAlign = 'center'
      ctx.fillText('You', tourist.x, tourist.y - 14)

      const dx = tourist.tx - tourist.x, dy = tourist.ty - tourist.y
      tourist.x += dx * .022; tourist.y += dy * .022
      tourist.trail.push({ x: tourist.x, y: tourist.y })
      if (tourist.trail.length > 22) tourist.trail.shift()
      if (Math.hypot(dx, dy) < 5) {
        nearTimer++
        if (nearTimer === 1) { addRipple(tp.x, tp.y - 18, tp.col); addRipple(tourist.x, tourist.y, '#1db896') }
        if (nearTimer > 85) { nearTimer = 0; newTarget() }
      } else nearTimer = 0

      scFrame++
      animId = requestAnimationFrame(drawScene)
    }
    drawScene()
    return () => cancelAnimationFrame(animId)
  }, [])

  /* ── JSX ── */
  return (
    <div className={`shell ${mode === 'signup' ? 'signup' : ''}`}>

      {/* FORM HALF */}
      <div className="half half-form">

        {/* LOGIN PANEL */}
        <div className={`fpanel ${mode !== 'login' ? 'hidden' : ''}`}>
          <div className="logo">
            <div className="lmark">
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
                <circle cx="12" cy="9" r="2.5"/>
              </svg>
            </div>
            <div className="lname">Kid<span>Sure</span></div>
          </div>
          <h2>Welcome back</h2>
          <p className="subh">Find care wherever you are, instantly.</p>
          {error && <p className="err-msg">{error}</p>}
          <form onSubmit={handleLogin}>
            <div className="field">
              <label>Email</label>
              <input type="email" placeholder="you@example.com" autoComplete="email" required
                value={loginData.email} onChange={e => setLoginData({ ...loginData, email: e.target.value })} />
            </div>
            <div className="field">
              <label>Password</label>
              <input type="password" placeholder="••••••••" autoComplete="current-password" required
                value={loginData.password} onChange={e => setLoginData({ ...loginData, password: e.target.value })} />
            </div>
            <div className="forgot">Forgot password?</div>
            <button className="btn" type="submit" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign In →'}
            </button>
          </form>
          <div className="divider"><span>or</span></div>
          {mode === 'login' && (
            <div style={{display:'flex', justifyContent:'center'}}>
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setError('Google sign-in was cancelled or failed.')}
                useOneTap={false}
                shape="rectangular"
                theme="outline"
                text="continue_with"
                locale="en"
              />
            </div>
          )}
          <p className="sw">New here? <a onClick={toSignup}>Create an account</a></p>
        </div>

        {/* SIGNUP PANEL */}
        <div className={`fpanel ${mode !== 'signup' ? 'hidden' : ''}`}>
          <button className="back-btn" type="button" onClick={toLogin}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <path d="M19 12H5M12 5l-7 7 7 7"/>
            </svg>
            Back to login
          </button>
          <div className="logo">
            <div className="lmark">
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
                <circle cx="12" cy="9" r="2.5"/>
              </svg>
            </div>
            <div className="lname">Kid<span>Sure</span></div>
          </div>
          <h2>Join KidSure</h2>
          <p className="subh">Your personal health guide on every trip.</p>
          {error && <p className="err-msg">{error}</p>}
          <form onSubmit={handleSignup}>
            <div className="row2">
              <div className="field">
                <label>First Name</label>
                <input type="text" placeholder="Alex" autoComplete="given-name" required
                  value={signupData.firstName} onChange={e => setSignupData({ ...signupData, firstName: e.target.value })} />
              </div>
              <div className="field">
                <label>Last Name</label>
                <input type="text" placeholder="Smith" autoComplete="family-name" required
                  value={signupData.lastName} onChange={e => setSignupData({ ...signupData, lastName: e.target.value })} />
              </div>
            </div>
            <div className="field">
              <label>Email</label>
              <input type="email" placeholder="you@example.com" autoComplete="email" required
                value={signupData.email} onChange={e => setSignupData({ ...signupData, email: e.target.value })} />
            </div>
            <div className="field">
              <label>Password</label>
              <input type="password" placeholder="Min. 8 characters" autoComplete="new-password" required minLength={8}
                value={signupData.password} onChange={e => setSignupData({ ...signupData, password: e.target.value })} />
            </div>
            <div className="field">
              <label>I am a</label>
              <select 
                value={signupData.role} 
                onChange={e => setSignupData({ ...signupData, role: e.target.value })}
                required
              >
                <option value="user">Parent</option>
                <option value="hospital_admin">Hospital Admin</option>
              </select>
            </div>
            <div className="chkRow">
              <input type="checkbox" id="terms" checked={signupData.agreed}
                onChange={e => setSignupData({ ...signupData, agreed: e.target.checked })} />
              <label htmlFor="terms">I agree to the <a>Terms of Service</a> and <a>Privacy Policy</a></label>
            </div>
            <button className="btn" type="submit" disabled={loading}>
              {loading ? 'Creating account…' : 'Create Account →'}
            </button>
          </form>
          <div className="divider"><span>or</span></div>
          {mode === 'signup' && (
            <div style={{display:'flex', justifyContent:'center'}}>
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setError('Google sign-in was cancelled or failed.')}
                useOneTap={false}
                shape="rectangular"
                theme="outline"
                text="continue_with"
                locale="en"
              />
            </div>
          )}
          <p className="sw">Already have an account? <a onClick={toLogin}>Sign in</a></p>
        </div>

      </div>

      {/* VISUAL HALF */}
      <div className="half half-visual">
        <canvas ref={bgCanvasRef} id="bgCanvas" />
        <div className="vis-inner">
          <div className="live-row">
            <span className="ldot" />
            <span className="ltxt">Live Finder Active</span>
          </div>
          <canvas ref={sceneCanvasRef} id="sceneCanvas" width="480" height="390" />
          <div className="vis-title" dangerouslySetInnerHTML={{ __html: visContent.title }} />
          <div className="vis-sub">{visContent.sub}</div>
          <div className="pills">
            {visContent.pills.map(pill => <span key={pill} className="pill">{pill}</span>)}
          </div>
        </div>
      </div>

    </div>
  )
}
