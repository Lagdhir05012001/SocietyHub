import { useState } from 'react'
import {
  Bell, Building2, CalendarCheck, ChevronDown, CircleDollarSign,
  ClipboardList, FileText, HelpCircle, LayoutDashboard,
  Menu, MoreHorizontal, Plus, Search, Settings, Users, Wallet, X,
} from 'lucide-react'
import './App.css'
import { isSupabaseConfigured } from './lib/supabaseClient'

const navItems = [
  { label: 'Overview', icon: LayoutDashboard },
  { label: 'Members', icon: Users, count: '248' },
  { label: 'Workers', icon: Building2 },
  { label: 'Maintenance', icon: ClipboardList, count: '6' },
  { label: 'Expenses', icon: Wallet },
  { label: 'Attendance', icon: CalendarCheck },
]

const activities = [
  { title: 'Maintenance payment received', detail: 'Flat A-204 · Ananya Sharma', amount: '+₹4,500', time: '12 min ago', color: 'mint' },
  { title: 'New member registered', detail: 'Flat B-110 · Rohan Mehta', amount: 'Member', time: '42 min ago', color: 'peach' },
  { title: 'Plumbing work order closed', detail: 'Tower 2 · Common bathroom', amount: 'Resolved', time: '2 hrs ago', color: 'blue' },
  { title: 'Electricity bill recorded', detail: 'MSEDCL · July 2024', amount: '₹28,640', time: 'Yesterday', color: 'lavender' },
]

const attendance = [
  { name: 'Ramesh Patil', role: 'Security · Morning shift', status: 'Present', initials: 'RP', tone: 'orange' },
  { name: 'Sunita Yadav', role: 'Housekeeping · Full day', status: 'Present', initials: 'SY', tone: 'pink' },
  { name: 'Imran Khan', role: 'Gardener · Morning shift', status: 'Late', initials: 'IK', tone: 'blue' },
]

function App() {
  const [activePage, setActivePage] = useState('Overview')
  const [mobileMenu, setMobileMenu] = useState(false)
  const [query, setQuery] = useState('')
  const [notice, setNotice] = useState('')

  const showNotice = (message) => {
    setNotice(message)
    window.setTimeout(() => setNotice(''), 2600)
  }

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileMenu ? 'is-open' : ''}`}>
        <div className="brand"><span className="brand-mark"><Building2 size={19} /></span><span>Society<span className="brand-dot">.</span>hub</span></div>
        <div className="society-switcher"><span className="society-avatar">M</span><span><strong>Maple Heights</strong><small>Administrator</small></span><ChevronDown size={15} /></div>
        <p className="nav-label">Workspace</p>
        <nav>{navItems.map(({ label, icon: Icon, count }) => <button key={label} className={activePage === label ? 'nav-item active' : 'nav-item'} onClick={() => { setActivePage(label); setMobileMenu(false) }}><Icon size={18} /><span>{label}</span>{count && <em>{count}</em>}</button>)}</nav>
        <div className="sidebar-bottom"><button className="nav-item"><Settings size={18} /><span>Settings</span></button><button className="nav-item"><HelpCircle size={18} /><span>Help center</span></button><div className="profile"><span className="profile-avatar">AK</span><span><strong>Arjun Kapoor</strong><small>Admin</small></span><MoreHorizontal size={18} /></div></div>
      </aside>
      {mobileMenu && <button className="scrim" aria-label="Close menu" onClick={() => setMobileMenu(false)} />}
      <main className="main-content">
        <header className="topbar"><button className="icon-button menu-button" onClick={() => setMobileMenu(!mobileMenu)} aria-label="Toggle navigation">{mobileMenu ? <X size={20} /> : <Menu size={20} />}</button><div className="crumb"><span>Workspace</span><strong>/</strong><b>{activePage}</b></div><div className="top-actions"><div className="search"><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search anything..." /></div><button className="icon-button has-dot" onClick={() => showNotice('You are all caught up')} aria-label="Notifications"><Bell size={19} /></button><div className="top-avatar">AK</div></div></header>
        <div className="page-content">
          <div className="page-heading"><div><p className="eyebrow">Thursday, 18 July 2024</p><h1>Good morning, Arjun <span>✦</span></h1><p className="subtitle">Here is what is happening in your society today.</p></div><button className="primary-button" onClick={() => showNotice('New collection form opened')}><Plus size={17} /> New collection</button></div>
          <section className="metric-grid"><Metric icon={Users} label="Total members" value="248" trend="12 new this month" tone="violet" /><Metric icon={CircleDollarSign} label="Collected this month" value="₹8,42,600" trend="8.4% vs last month" tone="green" /><Metric icon={ClipboardList} label="Open maintenance" value="06" trend="2 urgent requests" tone="orange" /><Metric icon={Wallet} label="Total expenses" value="₹3,18,240" trend="This financial year" tone="blue" /></section>
          <div className="section-grid"><section className="panel activity-panel"><div className="panel-header"><div><h2>Recent activity</h2><p>Latest updates across your society</p></div><button className="text-button" onClick={() => showNotice('Activity history is ready')}>View all <span>→</span></button></div><div className="activity-list">{activities.filter((item) => item.title.toLowerCase().includes(query.toLowerCase()) || item.detail.toLowerCase().includes(query.toLowerCase())).map((item) => <div className="activity-row" key={item.title}><span className={`activity-icon ${item.color}`}><FileText size={17} /></span><span className="activity-copy"><strong>{item.title}</strong><small>{item.detail}</small></span><span className="activity-value"><strong className={item.amount.startsWith('+') ? 'positive' : ''}>{item.amount}</strong><small>{item.time}</small></span></div>)}</div></section><section className="panel attendance-panel"><div className="panel-header"><div><h2>Worker attendance</h2><p>Today, 18 July</p></div><button className="icon-button"><MoreHorizontal size={19} /></button></div><div className="attendance-summary"><strong>18 <small>/ 21 workers</small></strong><span>86% <small>present today</small></span></div><div className="progress"><span /></div><div className="worker-list">{attendance.map((worker) => <div className="worker" key={worker.name}><span className={`worker-avatar ${worker.tone}`}>{worker.initials}</span><span><strong>{worker.name}</strong><small>{worker.role}</small></span><em className={worker.status === 'Late' ? 'late' : ''}>{worker.status}</em></div>)}</div><button className="outline-button" onClick={() => setActivePage('Attendance')}>View attendance</button></section></div>
          <section className="lower-grid"><section className="notice-band"><div className="notice-graphic"><Building2 size={28} /></div><div><p className="eyebrow">Society notice</p><h2>Annual general meeting</h2><p>Saturday, 27 July · Community hall · 6:00 PM</p></div><button className="outline-button" onClick={() => showNotice('Notice editor opened')}><FileText size={15} /> Manage notice</button></section><section className="quick-panel"><div><p className="eyebrow">Quick start</p><h2>Keep things moving</h2></div><div className="quick-actions"><button onClick={() => showNotice('Member registration opened')}><Users size={18} /><span>Add member</span></button><button onClick={() => showNotice('Maintenance request opened')}><ClipboardList size={18} /><span>New request</span></button><button onClick={() => showNotice('Expense form opened')}><Wallet size={18} /><span>Record expense</span></button></div></section></section>
          <footer><span><span className={`status-dot ${isSupabaseConfigured ? 'connected' : ''}`} /> {isSupabaseConfigured ? 'Supabase connected' : 'Demo mode · connect Supabase to enable live data'}</span><span>SocietyHub <b>v1.0</b></span></footer>
        </div>
      </main>
      {notice && <div className="toast"><span>✓</span>{notice}</div>}
    </div>
  )
}

function Metric({ icon: Icon, label, value, trend, tone }) {
  return <article className="metric"><span className={`metric-icon ${tone}`}><Icon size={19} /></span><div><p>{label}</p><strong>{value}</strong><small><span>↗</span> {trend}</small></div><button className="metric-more" aria-label={`More about ${label}`}><MoreHorizontal size={18} /></button></article>
}

export default App
