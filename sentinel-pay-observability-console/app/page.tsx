'use client'

import { useState } from 'react'
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Bot,
  Check,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  Command,
  Cpu,
  Fingerprint,
  Gauge,
  LockKeyhole,
  MessageSquareText,
  Play,
  Plus,
  Radio,
  Search,
  Send,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Terminal,
  Timer,
  TriangleAlert,
  X,
  Zap,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

const events = [
  { time: '14:32:08.412', label: 'INTENT_RECEIVED', tone: 'blue', icon: MessageSquareText, text: 'Pay $4,280.00 to Apex Logistics for invoice #APL-8472', meta: 'source: slack / finance-ops' },
  { time: '14:32:08.416', label: 'POLICY_EVALUATION', tone: 'purple', icon: ShieldCheck, text: 'Policy set `production-v3` matched 12 of 12 constraints', meta: 'scope: vendor_payment · confidence: 0.98' },
  { time: '14:32:08.420', label: 'RISK_SCORING', tone: 'amber', icon: TriangleAlert, text: 'Anomaly detected: velocity threshold approaching', meta: 'risk: 0.64 · delta: +0.18 vs baseline' },
  { time: '14:32:08.421', label: 'HITL_REQUIRED', tone: 'orange', icon: Fingerprint, text: 'Transaction paused pending operator approval', meta: 'reason: rolling cap · reviewer group: treasury' },
]

const ledger = [
  { id: 'TX-9F31A2', merchant: 'Apex Logistics', amount: '$4,280.00', status: 'Review', time: '14:32:08' },
  { id: 'TX-9F31A1', merchant: 'CloudNative Inc.', amount: '$892.40', status: 'Settled', time: '14:29:55' },
  { id: 'TX-9F319C', merchant: 'Notion Labs', amount: '$240.00', status: 'Settled', time: '14:21:44' },
  { id: 'TX-9F3195', merchant: 'Lattice', amount: '$1,850.00', status: 'Blocked', time: '14:03:11' },
]

export default function Page() {
  const [decision, setDecision] = useState<'pending' | 'approved' | 'rejected'>('pending')
  const [command, setCommand] = useState('')
  const [stream, setStream] = useState(events)

  function sendCommand() {
    if (!command.trim()) return
    setStream((current) => [...current, { time: new Date().toLocaleTimeString('en-US', { hour12: false }), label: 'OPERATOR_COMMAND', tone: 'green', icon: Terminal, text: command.trim(), meta: 'source: console · operator: you' }])
    setCommand('')
  }

  return (
    <main className="min-h-screen bg-[#09090b] text-zinc-100 selection:bg-cyan-400/20">
      <header className="flex h-16 items-center justify-between border-b border-white/[0.07] bg-zinc-950/95 px-5 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="flex size-8 items-center justify-center rounded-lg bg-cyan-400 text-zinc-950 shadow-[0_0_24px_rgba(34,211,238,0.28)]"><Zap className="size-4 fill-current" /></div>
          <div><p className="text-sm font-semibold tracking-tight">SENTINEL<span className="text-cyan-400">/</span>PAY</p><p className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">Agentic payment proxy</p></div>
        </div>
        <div className="hidden items-center gap-5 md:flex">
          <div className="flex items-center gap-2 font-mono text-[11px] text-zinc-400"><span className="size-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" /> ALL SYSTEMS NOMINAL</div>
          <Separator orientation="vertical" className="h-5 bg-white/10" />
          <div className="flex items-center gap-2 font-mono text-[11px] text-zinc-500"><Radio className="size-3.5 text-cyan-400" /> LIVE <span className="text-zinc-300">14:32:08 UTC</span></div>
          <Button variant="outline" size="sm" className="h-8 border-white/10 bg-white/[0.03] text-xs text-zinc-300 hover:bg-white/[0.08]"><SlidersHorizontal data-icon="inline-start" /> Configure</Button>
        </div>
      </header>

      <div className="grid min-h-[calc(100vh-4rem)] grid-cols-1 xl:grid-cols-[3fr_2fr]">
        <section className="flex min-h-[calc(100vh-4rem)] min-w-0 flex-col border-r border-white/[0.07]">
          <div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-4"><div className="flex items-center gap-3"><div className="flex size-7 items-center justify-center rounded-md border border-cyan-400/20 bg-cyan-400/10 text-cyan-400"><Terminal className="size-3.5" /></div><div><h1 className="text-sm font-semibold">Agent execution stream</h1><p className="font-mono text-[10px] text-zinc-500">RUN_ID: <span className="text-zinc-400">run_01JBCQ7V6N8C</span></p></div></div><Badge variant="outline" className="gap-1.5 border-emerald-400/20 bg-emerald-400/5 font-mono text-[10px] font-normal text-emerald-400"><span className="size-1.5 rounded-full bg-emerald-400" /> STREAMING</Badge></div>
          <div className="flex-1 overflow-auto px-5 py-6"><div className="mx-auto flex max-w-3xl flex-col gap-3">
            <div className="mb-2 flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-600"><span>Today, Sep 30</span><div className="h-px flex-1 bg-white/[0.06]" /></div>
            {stream.map((event, index) => { const Icon = event.icon; return <div key={`${event.time}-${index}`} className="group relative flex gap-3"><div className="flex w-20 shrink-0 flex-col items-end pt-3 font-mono text-[10px] text-zinc-600">{event.time}</div><div className={`relative flex-1 rounded-lg border p-3.5 ${event.tone === 'orange' ? 'border-orange-400/30 bg-orange-400/[0.06]' : 'border-white/[0.08] bg-white/[0.025]'}`}><div className="mb-2 flex items-center gap-2"><Icon className={`size-3.5 ${event.tone === 'blue' ? 'text-cyan-400' : event.tone === 'purple' ? 'text-violet-400' : event.tone === 'amber' ? 'text-amber-400' : event.tone === 'orange' ? 'text-orange-400' : 'text-emerald-400'}`} /><span className="font-mono text-[10px] font-medium tracking-[0.14em] text-zinc-400">{event.label}</span>{event.tone === 'orange' && <Badge className="ml-auto h-5 bg-orange-400/15 px-1.5 font-mono text-[9px] text-orange-300 hover:bg-orange-400/15">ACTION REQUIRED</Badge>}</div><p className="text-sm text-zinc-200">{event.text}</p><p className="mt-2 font-mono text-[10px] text-zinc-600">{event.meta}</p></div></div> })}
            <div className="flex items-center gap-3 pt-3"><div className="w-20" /><div className="flex items-center gap-2 font-mono text-[10px] text-zinc-600"><span className="size-1.5 animate-pulse rounded-full bg-cyan-400" /> waiting for input...</div></div>
          </div></div>
          <div className="border-t border-white/[0.07] bg-zinc-950/80 p-4"><div className="mx-auto flex max-w-3xl items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 shadow-inner focus-within:border-cyan-400/40"><Command className="size-4 shrink-0 text-cyan-400" /><Input value={command} onChange={(e) => setCommand(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.nativeEvent.isComposing && e.keyCode !== 229) sendCommand() }} placeholder="Send a command to the agent..." className="h-11 border-0 bg-transparent px-2 font-mono text-xs shadow-none focus-visible:ring-0" /><kbd className="hidden rounded border border-white/10 px-1.5 py-0.5 font-mono text-[9px] text-zinc-600 sm:block">ENTER</kbd><Button onClick={sendCommand} size="icon" className="size-8 bg-cyan-400 text-zinc-950 hover:bg-cyan-300" aria-label="Send command"><Send className="size-3.5" /></Button></div></div>
        </section>

        <aside className="min-w-0 bg-[#0c0c0f] p-5"><div className="flex flex-col gap-5">
          <div className="grid grid-cols-2 gap-3"><Card className="border-white/[0.08] bg-white/[0.025] shadow-none"><CardHeader className="p-4 pb-0"><CardTitle className="flex items-center justify-between text-[10px] font-medium uppercase tracking-[0.14em] text-zinc-500">Burst velocity <Gauge className="size-3.5 text-cyan-400" /></CardTitle></CardHeader><CardContent className="flex items-center gap-4 p-4"><div className="relative flex size-[76px] shrink-0 items-center justify-center rounded-full" style={{ background: 'conic-gradient(#22d3ee 0deg 238deg, rgba(255,255,255,.08) 238deg 360deg)' }}><div className="flex size-[60px] flex-col items-center justify-center rounded-full bg-[#111116]"><span className="font-mono text-lg font-semibold">66</span><span className="font-mono text-[9px] text-zinc-600">/ 100</span></div></div><div><p className="font-mono text-xs text-zinc-300">HIGH</p><p className="mt-1 text-[10px] leading-relaxed text-zinc-500">12 txns in<br />the last 60s</p></div></CardContent></Card><Card className="border-white/[0.08] bg-white/[0.025] shadow-none"><CardHeader className="p-4 pb-0"><CardTitle className="flex items-center justify-between text-[10px] font-medium uppercase tracking-[0.14em] text-zinc-500">Rolling cap <LockKeyhole className="size-3.5 text-violet-400" /></CardTitle></CardHeader><CardContent className="p-4"><div className="mb-3 flex items-end justify-between"><span className="font-mono text-lg font-semibold">$8,742</span><span className="font-mono text-[10px] text-zinc-500">of $10,000</span></div><Progress value={87} className="h-1.5 bg-white/10 [&>div]:bg-violet-400" /><p className="mt-3 flex items-center gap-1.5 font-mono text-[10px] text-amber-400"><TriangleAlert className="size-3" /> 87.4% utilized</p></CardContent></Card></div>

          <Card className="border-orange-400/25 bg-orange-400/[0.045] shadow-none"><CardHeader className="flex flex-row items-start justify-between space-y-0 p-4 pb-2"><div><CardTitle className="flex items-center gap-2 text-sm"><span className="flex size-6 items-center justify-center rounded-md bg-orange-400/15 text-orange-400"><Fingerprint className="size-3.5" /></span>Human review required</CardTitle><p className="mt-1 pl-8 font-mono text-[10px] text-zinc-500">TX-9F31A2 · just now</p></div><Badge className="bg-orange-400/15 font-mono text-[9px] text-orange-300 hover:bg-orange-400/15">PENDING</Badge></CardHeader><CardContent className="p-4 pt-3"><div className="rounded-md border border-white/[0.07] bg-black/20 p-3"><div className="flex items-center justify-between"><span className="text-xs text-zinc-400">Apex Logistics</span><span className="font-mono text-sm font-semibold text-zinc-100">$4,280.00</span></div><p className="mt-1 font-mono text-[10px] text-zinc-600">Invoice #APL-8472 · ACH transfer</p></div><div className="mt-3 flex gap-2"><Button onClick={() => setDecision('approved')} disabled={decision !== 'pending'} className="h-9 flex-1 bg-emerald-400 text-xs text-zinc-950 hover:bg-emerald-300 disabled:opacity-40"><Check data-icon="inline-start" /> {decision === 'approved' ? 'Approved' : 'Approve'}</Button><Button onClick={() => setDecision('rejected')} disabled={decision !== 'pending'} variant="outline" className="h-9 flex-1 border-red-400/20 bg-red-400/5 text-xs text-red-300 hover:bg-red-400/10 disabled:opacity-40"><X data-icon="inline-start" /> {decision === 'rejected' ? 'Rejected' : 'Reject'}</Button></div></CardContent></Card>

          <Card className="border-white/[0.08] bg-white/[0.025] shadow-none"><CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-3"><CardTitle className="flex items-center gap-2 text-sm"><Activity className="size-4 text-cyan-400" />Transaction ledger</CardTitle><Button variant="ghost" size="icon" className="size-7 text-zinc-500 hover:bg-white/5 hover:text-zinc-300" aria-label="Search ledger"><Search className="size-3.5" /></Button></CardHeader><CardContent className="p-0"><Table><TableHeader><TableRow className="border-white/[0.06] hover:bg-transparent"><TableHead className="h-8 pl-4 font-mono text-[9px] uppercase tracking-wider text-zinc-600">Transaction</TableHead><TableHead className="h-8 font-mono text-[9px] uppercase tracking-wider text-zinc-600">Amount</TableHead><TableHead className="h-8 pr-4 font-mono text-[9px] uppercase tracking-wider text-zinc-600">Status</TableHead></TableRow></TableHeader><TableBody>{ledger.map((row) => <TableRow key={row.id} className="border-white/[0.06] hover:bg-white/[0.025]"><TableCell className="py-3 pl-4"><p className="font-mono text-[10px] text-zinc-300">{row.id}</p><p className="mt-0.5 text-[11px] text-zinc-500">{row.merchant}</p></TableCell><TableCell className="py-3"><p className="font-mono text-[11px] text-zinc-300">{row.amount}</p><p className="mt-0.5 font-mono text-[9px] text-zinc-600">{row.time}</p></TableCell><TableCell className="py-3 pr-4"><Badge variant="outline" className={`font-mono text-[9px] ${row.status === 'Review' ? 'border-orange-400/30 text-orange-300' : row.status === 'Blocked' ? 'border-red-400/30 text-red-300' : 'border-emerald-400/30 text-emerald-300'}`}>{row.status}</Badge></TableCell></TableRow>)}</TableBody></Table><div className="flex items-center justify-between border-t border-white/[0.06] px-4 py-3"><span className="font-mono text-[10px] text-zinc-600">Showing 4 of 128 transactions</span><Button variant="ghost" size="sm" className="h-7 gap-1 px-2 text-[10px] text-cyan-400 hover:bg-white/5">View all <ChevronRight className="size-3" /></Button></div></CardContent></Card>
          <div className="grid grid-cols-3 gap-2"><div className="rounded-md border border-white/[0.06] bg-white/[0.02] p-2.5"><p className="font-mono text-[9px] uppercase text-zinc-600">Success rate</p><p className="mt-1 flex items-center gap-1 font-mono text-sm text-emerald-400">99.2% <ArrowUpRight className="size-3" /></p></div><div className="rounded-md border border-white/[0.06] bg-white/[0.02] p-2.5"><p className="font-mono text-[9px] uppercase text-zinc-600">Avg. latency</p><p className="mt-1 flex items-center gap-1 font-mono text-sm text-zinc-300">184ms <Timer className="size-3 text-zinc-600" /></p></div><div className="rounded-md border border-white/[0.06] bg-white/[0.02] p-2.5"><p className="font-mono text-[9px] uppercase text-zinc-600">Blocked today</p><p className="mt-1 flex items-center gap-1 font-mono text-sm text-red-300">07 <ArrowDownRight className="size-3" /></p></div></div>
        </div></aside>
      </div>
    </main>
  )
}
