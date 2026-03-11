'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Flame, LayoutDashboard, Users, MessageSquare, CheckSquare,
  Plus, Search, X, Edit2, Trash2, ChevronDown, ChevronRight,
  Coffee, Beer, Hotel, Heart, Copy, Check, Target, Trophy,
  LogOut, TrendingUp, Zap, Star, Smartphone, Calendar,
  UtensilsCrossed, AlertTriangle, FileText, Eye, EyeOff,
  Lock, Mail, ArrowRight,
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────────

type Screen = 'auth' | 'dashboard' | 'crm' | 'phrases' | 'routine'
type Phase  = 'アポ前' | 'アポ済み' | 'セフレ' | '疎遠'
type Sit    = 'カフェ' | '居酒屋' | 'ホテル前' | 'ホテル内'
type Mode   = 'login'  | 'signup'

interface Woman {
  id: string
  name: string
  metDate: string
  appName: string
  phase: Phase
  favoriteFood: string
  ngTopics: string
  notes: string
}

interface RoutineItem {
  id: string
  label: string
  category: string
}

interface AppState {
  loggedIn: boolean
  women: Woman[]
  routineItems: RoutineItem[]
  routineLogs: Record<string, string[]> // date → item ids
}

// ─── Constants ───────────────────────────────────────────────────────────────

const PHASES: Phase[] = ['アポ前', 'アポ済み', 'セフレ', '疎遠']
const PHASE_COLOR: Record<Phase, string> = {
  'アポ前':  '#818cf8',
  'アポ済み':'#f59e0b',
  'セフレ':  '#f43f5e',
  '疎遠':    '#6b7280',
}
const APPS = ['Tinder','Pairs','Bumble','with','Omiai','タップル','ゼクシィ縁結び','ハッピーメール','YYC','Dine','リアル出会い','その他']

const DEFAULT_ROUTINES: RoutineItem[] = [
  { id:'r1',  label:'スキンケア（朝）',          category:'ケア'       },
  { id:'r2',  label:'スキンケア（夜）',          category:'ケア'       },
  { id:'r3',  label:'筋トレ',                    category:'フィジカル' },
  { id:'r4',  label:'歯のホワイトニング',        category:'ケア'       },
  { id:'r5',  label:'身だしなみチェック（髪）',  category:'外見'       },
  { id:'r6',  label:'身だしなみチェック（服装）',category:'外見'       },
  { id:'r7',  label:'香水をつける',              category:'外見'       },
  { id:'r8',  label:'マッチングアプリ送信10件',  category:'行動'       },
  { id:'r9',  label:'プロフィール確認・更新',    category:'行動'       },
  { id:'r10', label:'読書・自己投資（30分）',    category:'メンタル'   },
]

const CATS = ['ケア','フィジカル','外見','行動','メンタル','一般']
const CAT_COLOR: Record<string,string> = {
  'ケア':'#06b6d4','フィジカル':'#f43f5e','外見':'#8b5cf6',
  '行動':'#f59e0b','メンタル':'#10b981','一般':'#6b7280',
}

type Phrase = { title:string; content:string; tip:string; level:'basic'|'advanced' }
const PHRASES: Record<Sit, Phrase[]> = {
  'カフェ': [
    { title:'共通点を作る',    content:'「ここのコーヒー、なんか落ち着くよね。よく来るの？」',                        tip:'相手の話を引き出しながら共通点を見つける。うなずきながら聞く。',      level:'basic'    },
    { title:'距離感を縮める',  content:'「ちょっと寒くない？そっち行っていい？」',                                    tip:'物理的な距離を縮めるきっかけ。断られたら笑ってOK。',               level:'basic'    },
    { title:'夢・将来トーク',  content:'「将来どんな生活したいとか、ある？俺は正直〇〇みたいな感じが理想なんだよね」',tip:'自分の話を先にすると相手が話しやすくなる。',                        level:'advanced' },
    { title:'次の約束を取る',  content:'「ここ好きになったわ。また来たいな。今度は夜バー版で来ない？」',              tip:'カフェから夜の場所へとステップアップ。',                            level:'advanced' },
    { title:'センスで褒める',  content:'「さっきの話、独特の視点でおもしろかった。他の子とちょっと違うよね」',        tip:'外見より「センス・考え方」を褒めると刺さりやすい。',               level:'basic'    },
  ],
  '居酒屋': [
    { title:'本音フラグ',      content:'「俺、酔うと本音しか言えなくなるんだよ（笑）。だから聞かないでね」',          tip:'笑えるフリで本音を出すフラグを立てる。',                           level:'basic'    },
    { title:'ボディタッチ布石',content:'「見て見て、この筋肉触ってみて（笑）。全然ないから」',                         tip:'自虐ネタでボディタッチの抵抗を下げる。',                           level:'advanced' },
    { title:'好感を伝える',    content:'「今日一緒にいて、なんか居心地いいんだよね。こういう感覚ひさびさ」',           tip:'「好き」とは言わず、空気感で伝える。',                              level:'advanced' },
    { title:'2軒目を提案',     content:'「そろそろ場所変えない？もう少し静かなバーとか」',                             tip:'より親密な空間へ。絶対に断られにくいタイミングで言う。',            level:'advanced' },
    { title:'恋愛トーク誘導',  content:'「好きな人の前だとどんな感じになる？緊張するタイプ？」',                       tip:'恋愛の話に自然に持っていける質問。',                               level:'basic'    },
  ],
  'ホテル前': [
    { title:'ナチュラルな誘い',content:'「もう少し話せる場所ない？静かに飲もうよ」',                                   tip:'「ホテル」という言葉を使わずに自然に誘う。',                        level:'basic'    },
    { title:'逃げ道を作る',    content:'「ちょっとだけね。すぐ解散でいいから」',                                       tip:'「すぐ帰れる」という安心感を与える。',                              level:'advanced' },
    { title:'空気感で押す',    content:'「（目を見て）…来て」',                                                        tip:'言葉より目線。シンプルな言葉が最強のとき。',                        level:'advanced' },
    { title:'選択権を渡す',    content:'「どうする？俺は一緒にいたい」',                                               tip:'相手に選択権を渡す。プレッシャーをかけない。',                      level:'basic'    },
  ],
  'ホテル内': [
    { title:'緊張をほぐす',    content:'「緊張してる？俺もだよ（笑）。正直に言うと」',                                  tip:'自分も緊張していると言うことで相手がリラックスする。',              level:'basic'    },
    { title:'距離をゼロに',    content:'「寒くない？こっち来て」',                                                      tip:'シンプルに体の距離を縮める。',                                      level:'basic'    },
    { title:'言葉で伝える',    content:'「かわいいな、本当に」',                                                         tip:'タイミングよく短く言う。長く言わない。',                            level:'advanced' },
    { title:'次につなげる',    content:'「また会いたいな。来週空いてる？」',                                            tip:'帰り際に次の約束をさりげなく。',                                    level:'advanced' },
  ],
}

const SIT_META: Record<Sit, { icon:React.ReactNode; color:string; desc:string }> = {
  'カフェ':   { icon:<Coffee  className="w-4 h-4"/>, color:'#f59e0b', desc:'初アポの緊張を解きながら距離を縮める場面' },
  '居酒屋':   { icon:<Beer    className="w-4 h-4"/>, color:'#f43f5e', desc:'お酒の力を借りて関係を深める場面'         },
  'ホテル前': { icon:<Hotel   className="w-4 h-4"/>, color:'#8b5cf6', desc:'最後の一歩を踏み出す重要な場面'           },
  'ホテル内': { icon:<Heart   className="w-4 h-4"/>, color:'#ec4899', desc:'二人の時間を大切にする場面'               },
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const uid = () => Math.random().toString(36).slice(2)
const todayStr = () => new Date().toISOString().split('T')[0]

const STORAGE_KEY = 'mote_state'

const defaultState = (): AppState => ({
  loggedIn: false,
  women: [],
  routineItems: DEFAULT_ROUTINES,
  routineLogs: {},
})

function loadState(): AppState {
  if (typeof window === 'undefined') return defaultState()
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? { ...defaultState(), ...JSON.parse(raw) } : defaultState()
  } catch { return defaultState() }
}

function saveState(s: AppState) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)) } catch {}
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Spinner() {
  return <div className="spinner" />
}

function BottomNav({ screen, setScreen }: { screen: Screen; setScreen:(s:Screen)=>void }) {
  const nav = [
    { id:'dashboard' as Screen, icon:<LayoutDashboard className="w-5 h-5"/>, label:'ホーム'    },
    { id:'crm'       as Screen, icon:<Users            className="w-5 h-5"/>, label:'女性管理'  },
    { id:'phrases'   as Screen, icon:<MessageSquare    className="w-5 h-5"/>, label:'フレーズ'  },
    { id:'routine'   as Screen, icon:<CheckSquare      className="w-5 h-5"/>, label:'ルーティン'},
  ]
  return (
    <nav style={{
      position:'fixed', bottom:0, left:0, right:0, zIndex:50,
      background:'rgba(17,17,24,0.95)', borderTop:'1px solid #2d2d3d',
      backdropFilter:'blur(12px)',
    }}>
      <div style={{ display:'flex', justifyContent:'space-around', maxWidth:480, margin:'0 auto', padding:'6px 8px' }}>
        {nav.map(n => {
          const active = screen === n.id
          return (
            <button key={n.id} onClick={() => setScreen(n.id)}
              style={{
                display:'flex', flexDirection:'column', alignItems:'center', gap:2,
                padding:'8px 16px', borderRadius:12, border:'none', cursor:'pointer',
                background:'transparent',
                color: active ? 'var(--red)' : 'var(--dim)',
                transition:'color .2s',
              }}>
              <div style={{ position:'relative' }}>
                {n.icon}
                {active && (
                  <div className="pdot" style={{
                    position:'absolute', bottom:-4, left:'50%', transform:'translateX(-50%)',
                    width:4, height:4, background:'var(--red)', borderRadius:'50%',
                  }}/>
                )}
              </div>
              <span style={{ fontSize:10, fontWeight:500 }}>{n.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}

// ─── Screen: Auth ─────────────────────────────────────────────────────────────

function AuthScreen({ onLogin }: { onLogin:()=>void }) {
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [pw, setPw] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const submit = () => {
    if (!email || !pw) { setError('メールアドレスとパスワードを入力してください'); return }
    if (pw.length < 6)  { setError('パスワードは6文字以上で設定してください'); return }
    setLoading(true)
    setTimeout(() => { setLoading(false); onLogin() }, 800)
  }

  return (
    <div style={{
      minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center',
      padding:'0 1rem', position:'relative', overflow:'hidden',
    }}>
      {/* blobs */}
      <div style={{ position:'absolute', inset:0, pointerEvents:'none' }}>
        <div style={{ position:'absolute', top:'25%', left:'50%', transform:'translateX(-50%)', width:384, height:384, background:'#f43f5e', borderRadius:'50%', opacity:.06, filter:'blur(120px)' }}/>
        <div style={{ position:'absolute', bottom:'25%', right:'25%', width:256, height:256, background:'#7c3aed', borderRadius:'50%', opacity:.06, filter:'blur(100px)' }}/>
      </div>

      <div className="fu" style={{ width:'100%', maxWidth:360, position:'relative', zIndex:1 }}>
        {/* logo */}
        <div style={{ textAlign:'center', marginBottom:'2.5rem' }}>
          <div style={{
            display:'inline-flex', alignItems:'center', justifyContent:'center',
            width:52, height:52, borderRadius:16,
            background:'linear-gradient(135deg,#f43f5e,#be123c)',
            boxShadow:'0 0 20px rgba(244,63,94,.35)', marginBottom:12,
          }}>
            <Flame className="w-6 h-6" style={{ color:'#fff' }}/>
          </div>
          <h1 style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'3.5rem', letterSpacing:'.12em', lineHeight:1 }}>MOTE</h1>
          <p style={{ color:'var(--muted)', fontSize:'.8rem', marginTop:4 }}>モテ戦略ダッシュボード</p>
        </div>

        <div className="card" style={{ padding:'1.5rem' }}>
          {/* mode tabs */}
          <div style={{ display:'flex', background:'#111118', borderRadius:12, padding:4, marginBottom:'1.5rem' }}>
            {(['login','signup'] as Mode[]).map(m => (
              <button key={m} onClick={() => { setMode(m); setError('') }}
                style={{
                  flex:1, padding:'8px 0', borderRadius:10, border:'none', cursor:'pointer', fontSize:'.85rem', fontWeight:600,
                  background: mode===m ? 'var(--red)' : 'transparent',
                  color: mode===m ? '#fff' : 'var(--muted)',
                  transition:'all .2s',
                }}>
                {m === 'login' ? 'ログイン' : '新規登録'}
              </button>
            ))}
          </div>

          <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
            <div>
              <label style={{ display:'block', fontSize:11, color:'var(--muted)', marginBottom:6, textTransform:'uppercase', letterSpacing:'.08em' }}>メールアドレス</label>
              <div style={{ position:'relative' }}>
                <Mail style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', width:16, height:16, color:'var(--dim)' }}/>
                <input type="email" value={email} onChange={e=>setEmail(e.target.value)}
                  onKeyDown={e=>e.key==='Enter'&&submit()} placeholder="you@example.com"
                  style={{ paddingLeft:40 }}/>
              </div>
            </div>
            <div>
              <label style={{ display:'block', fontSize:11, color:'var(--muted)', marginBottom:6, textTransform:'uppercase', letterSpacing:'.08em' }}>パスワード</label>
              <div style={{ position:'relative' }}>
                <Lock style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', width:16, height:16, color:'var(--dim)' }}/>
                <input type={showPw?'text':'password'} value={pw} onChange={e=>setPw(e.target.value)}
                  onKeyDown={e=>e.key==='Enter'&&submit()} placeholder="••••••••"
                  style={{ paddingLeft:40, paddingRight:44 }}/>
                <button onClick={()=>setShowPw(!showPw)} style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'var(--dim)' }}>
                  {showPw ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}
                </button>
              </div>
              {mode==='signup' && <p style={{ fontSize:11, color:'var(--dim)', marginTop:4 }}>6文字以上</p>}
            </div>
          </div>

          {error && <div style={{ marginTop:'1rem', padding:'10px 12px', borderRadius:10, background:'rgba(244,63,94,.12)', border:'1px solid rgba(244,63,94,.25)', color:'#fda4af', fontSize:'.8rem' }}>{error}</div>}

          <button className="btn btn-red" onClick={submit} disabled={loading}
            style={{ width:'100%', marginTop:'1.5rem' }}>
            {loading ? <Spinner/> : <>{mode==='login'?'ログイン':'アカウント作成'}<ArrowRight className="w-4 h-4"/></>}
          </button>
        </div>

        <p style={{ textAlign:'center', fontSize:11, color:'var(--dim)', marginTop:'1.5rem' }}>For men 23+ who want to level up.</p>
      </div>
    </div>
  )
}

// ─── Screen: Dashboard ────────────────────────────────────────────────────────

function DashboardScreen({ state, setScreen, onLogout }: {
  state: AppState
  setScreen:(s:Screen)=>void
  onLogout:()=>void
}) {
  const today = todayStr()
  const logs = state.routineLogs[today] || []
  const total = state.routineItems.length
  const done  = logs.length
  const pct   = total > 0 ? Math.round((done/total)*100) : 0

  const phaseCount = (p:string) => state.women.filter(w=>w.phase===p).length

  const greet = () => {
    const h = new Date().getHours()
    if (h<6)  return 'おはよう💤'
    if (h<12) return 'おはよう☀️'
    if (h<18) return 'こんにちは🔥'
    return 'こんばんは🌙'
  }

  const actions = [
    { id:'crm'     as Screen, icon:<Users         className="w-5 h-5"/>, label:'女性管理 CRM',    sub:'名前・フェーズ・メモを管理', color:'var(--red)'   },
    { id:'phrases' as Screen, icon:<MessageSquare className="w-5 h-5"/>, label:'実戦フレーズ集',  sub:'シチュエーション別の即戦力', color:'var(--amber)' },
    { id:'routine' as Screen, icon:<CheckSquare   className="w-5 h-5"/>, label:'デイリールーティン',sub:'毎日の習慣をチェック',     color:'var(--green)' },
  ]

  return (
    <div style={{ minHeight:'100vh', paddingBottom:88, maxWidth:480, margin:'0 auto', padding:'1.5rem 1rem 88px' }}>
      {/* header */}
      <div className="fu" style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'2rem' }}>
        <div>
          <p style={{ color:'var(--muted)', fontSize:'.8rem' }}>{greet()}</p>
          <h1 style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'1.9rem', letterSpacing:'.06em', lineHeight:1.1 }}>MOTE DASHBOARD</h1>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <div style={{ width:36, height:36, borderRadius:12, background:'linear-gradient(135deg,#f43f5e,#be123c)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 0 10px rgba(244,63,94,.25)' }}>
            <Flame className="w-4 h-4" style={{ color:'#fff' }}/>
          </div>
          <button onClick={onLogout} style={{ width:36, height:36, borderRadius:12, border:'1px solid var(--border)', background:'var(--card)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'var(--dim)' }}>
            <LogOut className="w-4 h-4"/>
          </button>
        </div>
      </div>

      {/* progress */}
      <div className="card fu1" style={{ padding:'1.25rem', marginBottom:'1rem' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <Zap className="w-4 h-4" style={{ color:'var(--red)' }}/>
            <span style={{ fontSize:'.85rem', fontWeight:500 }}>今日のルーティン</span>
          </div>
          <span style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'1.5rem', color:'var(--red)' }}>{pct}%</span>
        </div>
        <div style={{ height:8, borderRadius:4, background:'var(--raised)', overflow:'hidden' }}>
          <div style={{
            height:'100%', borderRadius:4,
            width:`${pct}%`,
            background: pct===100 ? 'linear-gradient(90deg,#10b981,#059669)' : 'linear-gradient(90deg,#f43f5e,#be123c)',
            boxShadow: pct>0 ? '0 0 8px rgba(244,63,94,.4)' : 'none',
            transition:'width .6s ease',
          }}/>
        </div>
        <p style={{ fontSize:11, color:'var(--dim)', marginTop:6 }}>{done} / {total} 完了{pct===100?' 🎉 完璧！':''}</p>
      </div>

      {/* phase stats */}
      <div className="card fu1" style={{ padding:'1.25rem', marginBottom:'1rem' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:'1rem' }}>
          <TrendingUp className="w-4 h-4" style={{ color:'var(--red)' }}/>
          <span style={{ fontSize:'.85rem', fontWeight:500 }}>攻略状況</span>
          <span style={{ marginLeft:'auto', fontSize:11, color:'var(--dim)' }}>合計 {state.women.length}人</span>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8, textAlign:'center' }}>
          {(['アポ前','アポ済み','セフレ','疎遠'] as Phase[]).map(p => (
            <div key={p}>
              <div style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'1.5rem', color:PHASE_COLOR[p] }}>{phaseCount(p)}</div>
              <div style={{ fontSize:10, color:'var(--dim)', marginTop:2 }}>{p}</div>
            </div>
          ))}
        </div>
      </div>

      {/* quick access */}
      <p style={{ fontSize:10, color:'var(--dim)', textTransform:'uppercase', letterSpacing:'.1em', marginBottom:10 }} className="fu2">クイックアクセス</p>
      <div className="fu2" style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:'1.5rem' }}>
        {actions.map(a => (
          <button key={a.id} onClick={() => setScreen(a.id)}
            className="card" style={{ display:'flex', alignItems:'center', gap:14, padding:'1rem', border:'none', cursor:'pointer', textAlign:'left', width:'100%', transition:'opacity .15s' }}>
            <div style={{ width:44, height:44, borderRadius:14, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, background:`${a.color}20`, color:a.color }}>{a.icon}</div>
            <div style={{ flex:1, minWidth:0 }}>
              <p style={{ fontWeight:600, fontSize:'.9rem', color:'var(--fg)' }}>{a.label}</p>
              <p style={{ fontSize:'.75rem', color:'var(--muted)', marginTop:2 }}>{a.sub}</p>
            </div>
            {a.id==='routine' && <span style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'1.1rem', color: pct===100?'var(--green)':'var(--red)', marginRight:4 }}>{pct}%</span>}
            <ChevronRight className="w-4 h-4" style={{ color:'var(--dim)', flexShrink:0 }}/>
          </button>
        ))}
      </div>

      {/* recent women */}
      {state.women.length > 0 ? (
        <div className="fu3">
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
            <p style={{ fontSize:10, color:'var(--dim)', textTransform:'uppercase', letterSpacing:'.1em' }}>最近の追加</p>
            <button onClick={() => setScreen('crm')} style={{ fontSize:11, color:'var(--red)', background:'none', border:'none', cursor:'pointer' }}>全て見る</button>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {state.women.slice(0,3).map(w => (
              <div key={w.id} className="card" style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 14px' }}>
                <div style={{ width:34, height:34, borderRadius:'50%', background:'linear-gradient(135deg,rgba(244,63,94,.4),rgba(190,18,60,.4))', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1rem', fontWeight:700, color:'#fda4af', flexShrink:0 }}>
                  {w.name[0]}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ fontWeight:500, fontSize:'.85rem', color:'var(--fg)' }}>{w.name}</p>
                  <p style={{ fontSize:11, color:'var(--dim)' }}>{w.appName}</p>
                </div>
                <span className={`badge-${w.phase}`} style={{ fontSize:10, padding:'2px 8px', borderRadius:20, whiteSpace:'nowrap' }}>{w.phase}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="card fu3" style={{ padding:'2.5rem 1rem', textAlign:'center' }}>
          <Star className="w-10 h-10" style={{ color:'var(--dim)', margin:'0 auto 12px' }}/>
          <p style={{ color:'var(--muted)', fontSize:'.85rem' }}>まだ女性が登録されていません</p>
          <button className="btn btn-red" onClick={() => setScreen('crm')} style={{ marginTop:14 }}>最初の女性を追加</button>
        </div>
      )}
    </div>
  )
}

// ─── Screen: CRM ─────────────────────────────────────────────────────────────

const EMPTY_W = (): Omit<Woman,'id'> => ({
  name:'', metDate: todayStr(), appName:'', phase:'アポ前',
  favoriteFood:'', ngTopics:'', notes:'',
})

function CRMScreen({ state, setState }: { state:AppState; setState:(s:AppState)=>void }) {
  const [q, setQ] = useState('')
  const [filterPhase, setFilterPhase] = useState<Phase|'all'>('all')
  const [modal, setModal] = useState(false)
  const [editId, setEditId] = useState<string|null>(null)
  const [form, setForm] = useState(EMPTY_W())
  const [expanded, setExpanded] = useState<string|null>(null)

  const filtered = state.women.filter(w =>
    (w.name.toLowerCase().includes(q.toLowerCase()) || w.appName.toLowerCase().includes(q.toLowerCase())) &&
    (filterPhase==='all' || w.phase===filterPhase)
  )

  const openAdd  = () => { setForm(EMPTY_W()); setEditId(null); setModal(true) }
  const openEdit = (w:Woman) => { setForm({ name:w.name, metDate:w.metDate, appName:w.appName, phase:w.phase, favoriteFood:w.favoriteFood, ngTopics:w.ngTopics, notes:w.notes }); setEditId(w.id); setModal(true) }

  const save = () => {
    if (!form.name.trim()) return
    const next = { ...state }
    if (editId) {
      next.women = next.women.map(w => w.id===editId ? { ...w, ...form } : w)
    } else {
      next.women = [{ id:uid(), ...form }, ...next.women]
    }
    setState(next); setModal(false)
  }

  const del = (id:string) => setState({ ...state, women: state.women.filter(w=>w.id!==id) })

  return (
    <div style={{ minHeight:'100vh', paddingBottom:88, maxWidth:480, margin:'0 auto' }}>
      {/* header */}
      <div style={{ position:'sticky', top:0, zIndex:40, background:'rgba(10,10,15,.95)', backdropFilter:'blur(12px)', padding:'1.5rem 1rem 1rem', borderBottom:'1px solid #1a1a24' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1rem' }}>
          <div>
            <h1 style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'1.9rem', letterSpacing:'.06em', lineHeight:1 }}>女性管理 CRM</h1>
            <p style={{ fontSize:11, color:'var(--dim)' }}>{state.women.length}人を管理中</p>
          </div>
          <button className="btn btn-red" onClick={openAdd} style={{ width:40, height:40, padding:0, borderRadius:12 }}>
            <Plus className="w-5 h-5"/>
          </button>
        </div>

        <div style={{ position:'relative', marginBottom:10 }}>
          <Search style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', width:16, height:16, color:'var(--dim)' }}/>
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="名前・アプリで検索..." style={{ paddingLeft:40 }}/>
        </div>

        <div style={{ display:'flex', gap:8, overflowX:'auto', paddingBottom:4, scrollbarWidth:'none' }}>
          {(['all',...PHASES] as const).map(p => (
            <button key={p} onClick={() => setFilterPhase(p)}
              style={{
                flexShrink:0, padding:'4px 12px', borderRadius:8, fontSize:12, fontWeight:500,
                border:'none', cursor:'pointer', transition:'all .2s',
                background: filterPhase===p ? (p==='all'?'var(--red)':PHASE_COLOR[p]) : 'var(--card)',
                color: filterPhase===p ? '#fff' : 'var(--dim)',
                boxShadow: filterPhase===p ? `0 0 10px ${p==='all'?'rgba(244,63,94,.4)':PHASE_COLOR[p]+'60'}` : 'none',
              }}>
              {p==='all'?'すべて':p}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding:'1rem', display:'flex', flexDirection:'column', gap:10 }}>
        {filtered.length===0 ? (
          <div className="card" style={{ padding:'2.5rem 1rem', textAlign:'center', marginTop:16 }}>
            <Users className="w-10 h-10" style={{ color:'var(--dim)', margin:'0 auto 12px' }}/>
            <p style={{ color:'var(--muted)', fontSize:'.85rem' }}>{q||filterPhase!=='all'?'該当する女性が見つかりません':'最初の女性を追加しましょう'}</p>
            {!q && filterPhase==='all' && <button className="btn btn-red" onClick={openAdd} style={{ marginTop:14 }}>追加する</button>}
          </div>
        ) : filtered.map(w => (
          <div key={w.id} className="card" style={{ overflow:'hidden' }}>
            <div onClick={() => setExpanded(expanded===w.id?null:w.id)}
              style={{ display:'flex', alignItems:'center', gap:12, padding:'1rem', cursor:'pointer' }}>
              <div style={{ width:42, height:42, borderRadius:14, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.2rem', fontWeight:700, flexShrink:0, background:`${PHASE_COLOR[w.phase]}20`, color:PHASE_COLOR[w.phase] }}>
                {w.name[0]}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <p style={{ fontWeight:600, color:'var(--fg)' }}>{w.name}</p>
                <p style={{ fontSize:11, color:'var(--dim)', display:'flex', alignItems:'center', gap:8, marginTop:2 }}>
                  <span style={{ display:'flex', alignItems:'center', gap:3 }}><Smartphone className="w-3 h-3"/>{w.appName||'未設定'}</span>
                  <span>·</span>
                  <span style={{ display:'flex', alignItems:'center', gap:3 }}><Calendar className="w-3 h-3"/>{w.metDate}</span>
                </p>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                <span className={`badge-${w.phase}`} style={{ fontSize:10, padding:'2px 8px', borderRadius:20 }}>{w.phase}</span>
                <ChevronDown className="w-4 h-4" style={{ color:'var(--dim)', transform:expanded===w.id?'rotate(180deg)':'none', transition:'transform .2s' }}/>
              </div>
            </div>

            {expanded===w.id && (
              <div style={{ padding:'0 1rem 1rem', borderTop:'1px solid var(--border)', paddingTop:'0.75rem', display:'flex', flexDirection:'column', gap:10 }}>
                {w.favoriteFood && <Row icon={<UtensilsCrossed className="w-3.5 h-3.5" style={{color:'var(--green)'}}/>} label="好きな食べ物" val={w.favoriteFood}/>}
                {w.ngTopics     && <Row icon={<AlertTriangle   className="w-3.5 h-3.5" style={{color:'var(--amber)'}}/>} label="NGな話題"     val={w.ngTopics}/>}
                {w.notes        && <Row icon={<FileText        className="w-3.5 h-3.5" style={{color:'var(--muted)'}}/>} label="メモ"         val={w.notes}/>}
                <div style={{ display:'flex', gap:8, marginTop:4 }}>
                  <button className="btn btn-ghost" onClick={() => openEdit(w)} style={{ flex:1 }}><Edit2 className="w-3.5 h-3.5"/>編集</button>
                  <button className="btn btn-ghost" onClick={() => del(w.id)} style={{ width:44, padding:0 }}><Trash2 className="w-3.5 h-3.5" style={{color:'#f87171'}}/></button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* modal */}
      {modal && (
        <div style={{ position:'fixed', inset:0, zIndex:50, display:'flex', alignItems:'flex-end', justifyContent:'center' }}>
          <div onClick={() => setModal(false)} style={{ position:'absolute', inset:0, background:'rgba(0,0,0,.7)', backdropFilter:'blur(4px)' }}/>
          <div style={{ position:'relative', width:'100%', maxWidth:480, background:'#111118', borderRadius:'24px 24px 0 0', border:'1px solid var(--border)', borderBottom:'none', maxHeight:'90vh', overflowY:'auto' }}>
            <div style={{ padding:'1.5rem' }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1.5rem' }}>
                <h2 style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'1.4rem' }}>{editId?'女性を編集':'新しい女性を追加'}</h2>
                <button onClick={() => setModal(false)} style={{ width:32, height:32, borderRadius:8, background:'var(--raised)', border:'1px solid var(--border)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--dim)' }}><X className="w-4 h-4"/></button>
              </div>

              <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
                <Field label="名前 *"><input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="例：さゆり"/></Field>
                <Field label="出会ったアプリ">
                  <select value={form.appName} onChange={e=>setForm({...form,appName:e.target.value})}>
                    <option value="">選択してください</option>
                    {APPS.map(a=><option key={a} value={a}>{a}</option>)}
                  </select>
                </Field>
                <Field label="出会った日"><input type="date" value={form.metDate} onChange={e=>setForm({...form,metDate:e.target.value})}/></Field>
                <Field label="フェーズ">
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:6 }}>
                    {PHASES.map(p => (
                      <button key={p} onClick={() => setForm({...form,phase:p})}
                        style={{
                          padding:'8px 4px', borderRadius:10, border:'none', cursor:'pointer', fontSize:11, fontWeight:600,
                          background: form.phase===p ? PHASE_COLOR[p] : 'var(--raised)',
                          color: form.phase===p ? '#fff' : 'var(--dim)',
                          boxShadow: form.phase===p ? `0 0 12px ${PHASE_COLOR[p]}60` : 'none',
                          transition:'all .2s',
                        }}>
                        {p}
                      </button>
                    ))}
                  </div>
                </Field>
                <Field label="好きな食べ物"><input value={form.favoriteFood} onChange={e=>setForm({...form,favoriteFood:e.target.value})} placeholder="例：イタリアン、スイーツ全般"/></Field>
                <Field label="NGな話題"><input value={form.ngTopics} onChange={e=>setForm({...form,ngTopics:e.target.value})} placeholder="例：元カレの話"/></Field>
                <Field label="メモ"><textarea value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} placeholder="その他メモを自由に..." rows={3} style={{ resize:'none' }}/></Field>
                <button className="btn btn-red" onClick={save} disabled={!form.name.trim()} style={{ width:'100%', marginTop:4 }}>
                  <Check className="w-4 h-4"/>{editId?'変更を保存':'追加する'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Row({ icon, label, val }: { icon:React.ReactNode; label:string; val:string }) {
  return (
    <div style={{ display:'flex', alignItems:'flex-start', gap:8 }}>
      <div style={{ marginTop:2, flexShrink:0 }}>{icon}</div>
      <div>
        <p style={{ fontSize:10, color:'var(--dim)', textTransform:'uppercase', letterSpacing:'.06em' }}>{label}</p>
        <p style={{ fontSize:'.85rem', color:'var(--fg)', marginTop:1 }}>{val}</p>
      </div>
    </div>
  )
}

function Field({ label, children }: { label:string; children:React.ReactNode }) {
  return (
    <div>
      <label style={{ display:'block', fontSize:11, color:'var(--muted)', marginBottom:6, textTransform:'uppercase', letterSpacing:'.08em' }}>{label}</label>
      {children}
    </div>
  )
}

// ─── Screen: Phrases ─────────────────────────────────────────────────────────

function PhrasesScreen() {
  const [sit, setSit] = useState<Sit>('カフェ')
  const [copied, setCopied] = useState<number|null>(null)
  const copy = (txt:string, i:number) => {
    navigator.clipboard.writeText(txt)
    setCopied(i)
    setTimeout(() => setCopied(null), 2000)
  }
  const meta = SIT_META[sit]

  return (
    <div style={{ minHeight:'100vh', paddingBottom:88, maxWidth:480, margin:'0 auto' }}>
      <div style={{ position:'sticky', top:0, zIndex:40, background:'rgba(10,10,15,.95)', backdropFilter:'blur(12px)', padding:'1.5rem 1rem 1rem', borderBottom:'1px solid #1a1a24' }}>
        <h1 style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'1.9rem', letterSpacing:'.06em', lineHeight:1, marginBottom:4 }}>実戦フレーズ集</h1>
        <p style={{ fontSize:11, color:'var(--dim)', marginBottom:'1rem' }}>シチュエーション別の即戦力フレーズ</p>
        <div style={{ display:'flex', gap:8, overflowX:'auto', paddingBottom:4, scrollbarWidth:'none' }}>
          {(Object.keys(PHRASES) as Sit[]).map(s => (
            <button key={s} onClick={() => setSit(s)}
              style={{
                flexShrink:0, display:'flex', alignItems:'center', gap:6,
                padding:'6px 12px', borderRadius:10, border:'none', cursor:'pointer', fontSize:13, fontWeight:500,
                background: sit===s ? SIT_META[s].color : 'var(--card)',
                color: sit===s ? '#fff' : 'var(--dim)',
                boxShadow: sit===s ? `0 0 14px ${SIT_META[s].color}50` : 'none',
                transition:'all .2s',
              }}>
              {SIT_META[s].icon}{s}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding:'1rem', display:'flex', flexDirection:'column', gap:10 }}>
        <div className="card" style={{ padding:'1rem', border:`1px solid ${meta.color}30`, background:`${meta.color}08` }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
            <span style={{ color:meta.color }}>{meta.icon}</span>
            <span style={{ fontSize:'.85rem', fontWeight:600, color:meta.color }}>{sit}シーン</span>
            <span style={{ marginLeft:'auto', fontSize:11, color:'var(--dim)' }}>{PHRASES[sit].length}フレーズ</span>
          </div>
          <p style={{ fontSize:11, color:'var(--muted)' }}>{meta.desc}</p>
        </div>

        {PHRASES[sit].map((p,i) => (
          <div key={i} className="card" style={{ padding:'1.25rem' }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
              <span style={{
                fontSize:10, padding:'2px 8px', borderRadius:20, fontWeight:600, flexShrink:0,
                background: p.level==='advanced'?'rgba(244,63,94,.15)':'rgba(61,61,82,.6)',
                color: p.level==='advanced'?'#fda4af':'var(--muted)',
                border: p.level==='advanced'?'1px solid rgba(244,63,94,.3)':'1px solid rgba(85,85,112,.4)',
              }}>
                {p.level==='advanced'?'上級':'基本'}
              </span>
              <span style={{ fontWeight:600, fontSize:'.9rem', flex:1, color:'var(--fg)' }}>{p.title}</span>
              <button onClick={() => copy(p.content,i)}
                style={{ width:32, height:32, borderRadius:8, border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, background: copied===i?'rgba(16,185,129,.2)':'var(--raised)', color: copied===i?'var(--green)':'var(--dim)' }}>
                {copied===i?<Check className="w-4 h-4"/>:<Copy className="w-4 h-4"/>}
              </button>
            </div>
            <div style={{ background:'var(--raised)', borderRadius:10, padding:'10px 12px', borderLeft:`3px solid ${meta.color}`, marginBottom:10 }}>
              <p style={{ fontSize:'.85rem', color:'var(--fg)', lineHeight:1.6 }}>{p.content}</p>
            </div>
            <div style={{ display:'flex', alignItems:'flex-start', gap:6 }}>
              <MessageSquare className="w-3.5 h-3.5" style={{ color:'var(--dim)', marginTop:2, flexShrink:0 }}/>
              <p style={{ fontSize:11, color:'var(--muted)', lineHeight:1.6 }}>{p.tip}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Screen: Routine ─────────────────────────────────────────────────────────

function RoutineScreen({ state, setState }: { state:AppState; setState:(s:AppState)=>void }) {
  const [modal, setModal] = useState(false)
  const [label, setLabel] = useState('')
  const [cat, setCat] = useState('一般')

  const today = todayStr()
  const logs: string[] = state.routineLogs[today] || []

  const isChecked = (id:string) => logs.includes(id)

  const toggle = (id:string) => {
    const next = { ...state, routineLogs: { ...state.routineLogs } }
    const cur = [...(next.routineLogs[today] || [])]
    if (cur.includes(id)) {
      next.routineLogs[today] = cur.filter(x=>x!==id)
    } else {
      next.routineLogs[today] = [...cur, id]
    }
    setState(next)
  }

  const addItem = () => {
    if (!label.trim()) return
    const next = { ...state, routineItems: [...state.routineItems, { id:uid(), label:label.trim(), category:cat }] }
    setState(next); setLabel(''); setCat('一般'); setModal(false)
  }

  const delItem = (id:string) => {
    const next = {
      ...state,
      routineItems: state.routineItems.filter(i=>i.id!==id),
      routineLogs: { ...state.routineLogs, [today]: (state.routineLogs[today]||[]).filter(x=>x!==id) },
    }
    setState(next)
  }

  const total = state.routineItems.length
  const done  = logs.length
  const pct   = total>0 ? Math.round((done/total)*100) : 0
  const dateLabel = new Date().toLocaleDateString('ja-JP',{month:'long',day:'numeric',weekday:'long'})

  const grouped = CATS.reduce<Record<string,RoutineItem[]>>((acc,c) => {
    const ci = state.routineItems.filter(i=>i.category===c)
    if (ci.length) acc[c] = ci
    return acc
  }, {})

  return (
    <div style={{ minHeight:'100vh', paddingBottom:88, maxWidth:480, margin:'0 auto' }}>
      <div style={{ position:'sticky', top:0, zIndex:40, background:'rgba(10,10,15,.95)', backdropFilter:'blur(12px)', padding:'1.5rem 1rem 1rem', borderBottom:'1px solid #1a1a24' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:4 }}>
          <h1 style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'1.9rem', letterSpacing:'.06em', lineHeight:1 }}>デイリールーティン</h1>
          <button className="btn btn-green" onClick={() => setModal(true)} style={{ width:38, height:38, padding:0, borderRadius:12 }}>
            <Plus className="w-5 h-5"/>
          </button>
        </div>
        <p style={{ fontSize:11, color:'var(--dim)', marginBottom:12 }}>{dateLabel}</p>

        <div className="card" style={{ padding:'12px 16px', display:'flex', alignItems:'center', gap:16 }}>
          <div style={{ flex:1 }}>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, marginBottom:6 }}>
              <span style={{ color:'var(--muted)' }}>{done} / {total} 完了</span>
              <span style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'1rem', color: pct===100?'var(--green)':pct>=50?'var(--amber)':'var(--red)' }}>{pct}%</span>
            </div>
            <div style={{ height:8, borderRadius:4, background:'var(--raised)', overflow:'hidden' }}>
              <div style={{
                height:'100%', borderRadius:4, width:`${pct}%`,
                background: pct===100?'linear-gradient(90deg,#10b981,#059669)':pct>=50?'linear-gradient(90deg,#f59e0b,#d97706)':'linear-gradient(90deg,#f43f5e,#be123c)',
                transition:'width .5s ease',
              }}/>
            </div>
          </div>
          <span style={{ fontSize:'1.5rem' }}>{pct===100?'🏆':pct>=50?'🔥':'💪'}</span>
        </div>
      </div>

      <div style={{ padding:'1rem', display:'flex', flexDirection:'column', gap:'1.25rem' }}>
        {Object.keys(grouped).length===0 ? (
          <div className="card" style={{ padding:'2.5rem 1rem', textAlign:'center' }}>
            <Target className="w-10 h-10" style={{ color:'var(--dim)', margin:'0 auto 12px' }}/>
            <p style={{ color:'var(--muted)', fontSize:'.85rem' }}>ルーティンが設定されていません</p>
            <button className="btn btn-green" onClick={() => setModal(true)} style={{ marginTop:14 }}>追加する</button>
          </div>
        ) : Object.entries(grouped).map(([c, items]) => (
          <div key={c}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8, paddingLeft:4 }}>
              <div style={{ width:8, height:8, borderRadius:'50%', background:CAT_COLOR[c]||'#6b7280' }}/>
              <p style={{ fontSize:11, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'.08em' }}>{c}</p>
              <span style={{ fontSize:11, color:'var(--dim)' }}>{items.filter(i=>isChecked(i.id)).length}/{items.length}</span>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {items.map(item => {
                const ck = isChecked(item.id)
                const cc = CAT_COLOR[item.category]||'#6b7280'
                return (
                  <div key={item.id} className="card" style={{
                    display:'flex', alignItems:'center', gap:12, padding:'10px 14px',
                    borderColor: ck?`${cc}40`:'var(--border)',
                    background: ck?`${cc}08`:'var(--card)',
                    transition:'all .2s',
                  }}>
                    <button onClick={() => toggle(item.id)}
                      style={{
                        width:24, height:24, borderRadius:7, border:`2px solid ${ck?'transparent':cc+'60'}`,
                        display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, cursor:'pointer',
                        background: ck ? cc : 'transparent',
                        boxShadow: ck ? `0 0 8px ${cc}60` : 'none',
                        transition:'all .2s',
                      }}>
                      {ck && <Check className="w-3 h-3" style={{ color:'#fff', strokeWidth:3 }}/>}
                    </button>
                    <span style={{ flex:1, fontSize:'.85rem', color:ck?'var(--dim)':'var(--fg)', textDecoration:ck?'line-through':'none', transition:'all .2s' }}>{item.label}</span>
                    <button onClick={() => delItem(item.id)} style={{ width:24, height:24, borderRadius:6, border:'none', background:'transparent', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--dim)' }}>
                      <Trash2 className="w-3.5 h-3.5"/>
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        ))}

        {pct===100 && total>0 && (
          <div className="card" style={{ padding:'1.5rem', textAlign:'center', borderColor:'rgba(16,185,129,.3)', background:'rgba(16,185,129,.05)' }}>
            <Trophy className="w-8 h-8" style={{ color:'var(--green)', margin:'0 auto 8px' }}/>
            <p style={{ color:'var(--green)', fontWeight:600 }}>今日のルーティン完了！</p>
            <p style={{ fontSize:11, color:'var(--muted)', marginTop:4 }}>素晴らしい継続力です</p>
          </div>
        )}
      </div>

      {modal && (
        <div style={{ position:'fixed', inset:0, zIndex:50, display:'flex', alignItems:'flex-end', justifyContent:'center' }}>
          <div onClick={() => setModal(false)} style={{ position:'absolute', inset:0, background:'rgba(0,0,0,.7)', backdropFilter:'blur(4px)' }}/>
          <div style={{ position:'relative', width:'100%', maxWidth:480, background:'#111118', borderRadius:'24px 24px 0 0', border:'1px solid var(--border)', borderBottom:'none', padding:'1.5rem' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1.5rem' }}>
              <h2 style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'1.4rem' }}>ルーティンを追加</h2>
              <button onClick={() => setModal(false)} style={{ width:32, height:32, borderRadius:8, background:'var(--raised)', border:'1px solid var(--border)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--dim)' }}><X className="w-4 h-4"/></button>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
              <Field label="項目名 *">
                <input value={label} onChange={e=>setLabel(e.target.value)} onKeyDown={e=>e.key==='Enter'&&addItem()} placeholder="例：スキンケア" autoFocus/>
              </Field>
              <Field label="カテゴリ">
                <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                  {CATS.map(c => (
                    <button key={c} onClick={() => setCat(c)}
                      style={{
                        padding:'5px 12px', borderRadius:8, border:'none', cursor:'pointer', fontSize:12, fontWeight:500,
                        background: cat===c ? CAT_COLOR[c] : 'var(--raised)',
                        color: cat===c ? '#fff' : 'var(--dim)',
                        boxShadow: cat===c ? `0 0 10px ${CAT_COLOR[c]}50` : 'none',
                        transition:'all .2s',
                      }}>
                      {c}
                    </button>
                  ))}
                </div>
              </Field>
              <button className="btn btn-green" onClick={addItem} disabled={!label.trim()} style={{ width:'100%', marginTop:4 }}>
                <Plus className="w-4 h-4"/>追加する
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Root App ─────────────────────────────────────────────────────────────────

export default function App() {
  const [screen, setScreen] = useState<Screen>('auth')
  const [state, setStateRaw] = useState<AppState>(defaultState)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    const s = loadState()
    setStateRaw(s)
    if (s.loggedIn) setScreen('dashboard')
    setHydrated(true)
  }, [])

  const setState = useCallback((next: AppState) => {
    setStateRaw(next)
    saveState(next)
  }, [])

  const handleLogin = () => {
    const next: AppState = { ...state, loggedIn: true }
    setState(next)
    setScreen('dashboard')
  }

  const handleLogout = () => {
    const next: AppState = { ...state, loggedIn: false }
    setState(next)
    setScreen('auth')
  }

  if (!hydrated) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <Spinner/>
    </div>
  )

  const showNav = screen !== 'auth'

  return (
    <>
      {screen === 'auth'      && <AuthScreen      onLogin={handleLogin} />}
      {screen === 'dashboard' && <DashboardScreen state={state} setScreen={setScreen} onLogout={handleLogout}/>}
      {screen === 'crm'       && <CRMScreen       state={state} setState={setState}/>}
      {screen === 'phrases'   && <PhrasesScreen   />}
      {screen === 'routine'   && <RoutineScreen   state={state} setState={setState}/>}
      {showNav && <BottomNav screen={screen} setScreen={setScreen}/>}
    </>
  )
}
