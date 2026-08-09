'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { supabase } from '@/lib/supabase'
import { useProfile } from '@/lib/hooks/useProfile'
import LeadDetailModal, { LeadRow } from '@/components/LeadDetailModal'

const card = (style?: React.CSSProperties): React.CSSProperties => ({
  background: '#fff', borderRadius: 22,
  boxShadow: '0 10px 30px rgba(30,70,66,.08)', ...style,
})

const formatarTelefone = (phone: string | null) => {
  if (!phone) return '—'
  return phone
    .replace('@s.whatsapp.net', '')
    .replace(/^55/, '')
    .replace(/(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3')
}

function BadgeOrigem({ origem }: { origem: string | null }) {
  const outbound = origem === 'outbound'
  return (
    <span style={{
      background: outbound ? '#EDE4FC' : '#E7F2F0',
      color: outbound ? '#6A3BC0' : '#227069',
      fontSize: 11, fontWeight: 700, borderRadius: 8, padding: '3px 10px', whiteSpace: 'nowrap',
    }}>
      {outbound ? '🎯 Prospecção' : '💬 WhatsApp'}
    </span>
  )
}

function CardLead({ lead, onAbrir }: { lead: LeadRow; onAbrir: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: lead.id })

  const style: React.CSSProperties = {
    ...card({ padding: '11px 13px', cursor: isDragging ? 'grabbing' : 'grab' }),
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 10 : undefined,
    touchAction: 'none',
  }

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes} onClick={() => onAbrir(lead.id)}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 32, height: 32, borderRadius: '50%', background: '#E7F2F0', color: '#227069',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, flexShrink: 0,
        }}>
          {(lead.name || '?').charAt(0).toUpperCase()}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <b style={{ fontSize: 12.5, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {lead.name || 'Sem nome'}
          </b>
          <span style={{ fontSize: 11, color: '#6E807D' }}>{formatarTelefone(lead.phone)}</span>
        </div>
      </div>
      <div style={{ marginTop: 8 }}>
        <BadgeOrigem origem={lead.origem} />
      </div>
    </div>
  )
}

function Coluna({ categoria, leads, onAbrir }: { categoria: string; leads: LeadRow[]; onAbrir: (id: string) => void }) {
  const { setNodeRef, isOver } = useDroppable({ id: categoria })
  return (
    <div style={{ width: 264, flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 6px 10px' }}>
        <b style={{ fontSize: 13, color: '#227069', textTransform: 'capitalize' }}>{categoria}</b>
        <span style={{ background: '#E7F2F0', color: '#227069', fontSize: 11, fontWeight: 700, borderRadius: 8, padding: '2px 8px' }}>
          {leads.length}
        </span>
      </div>
      <div
        ref={setNodeRef}
        style={{
          flex: 1, minHeight: 120, background: isOver ? '#EAF4F2' : '#F2F7F6',
          border: isOver ? '1.5px dashed #2E8F87' : '1.5px dashed transparent',
          borderRadius: 16, padding: 8, display: 'flex', flexDirection: 'column', gap: 8,
          maxHeight: 620, overflowY: 'auto', transition: 'background .12s',
        }}
      >
        {leads.length === 0 && (
          <p style={{ color: '#9BB0AD', fontSize: 12, textAlign: 'center', padding: '20px 4px' }}>Nenhum lead aqui.</p>
        )}
        {leads.map((l) => <CardLead key={l.id} lead={l} onAbrir={onAbrir} />)}
      </div>
    </div>
  )
}

export default function KanbanLeads() {
  const { categoriasKanban, loading: perfilCarregando } = useProfile()

  const [leads, setLeads] = useState<LeadRow[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [atualizandoId, setAtualizandoId] = useState<string | null>(null)
  const [busca, setBusca] = useState('')
  const [detalheId, setDetalheId] = useState<string | null>(null)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  const carregarLeads = useCallback(async () => {
    setCarregando(true)
    setErro(null)
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('id, name, phone, status, origem, created_at, nicho, score, score_motivo, dores, gancho')
        .order('created_at', { ascending: false })
      if (error) throw error
      setLeads((data ?? []) as LeadRow[])
    } catch (err) {
      console.error('Erro ao buscar leads:', err)
      setErro('Não foi possível carregar os leads. Tente recarregar.')
      setLeads([])
    } finally {
      setCarregando(false)
    }
  }, [])

  useEffect(() => { carregarLeads() }, [carregarLeads])

  const moverLead = useCallback(async (id: string, novoStatus: string) => {
    const anterior = leads.find((l) => l.id === id)?.status ?? null
    if (anterior === novoStatus) return
    setErro(null)
    setAtualizandoId(id)
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, status: novoStatus } : l)))
    try {
      const { error } = await supabase.from('leads').update({ status: novoStatus }).eq('id', id)
      if (error) throw error
    } catch (err) {
      console.error('Erro ao mover lead:', err)
      setErro('Não foi possível mover o lead. Tente de novo.')
      setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, status: anterior } : l)))
    } finally {
      setAtualizandoId(null)
    }
  }, [leads])

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over) return
    moverLead(String(active.id), String(over.id))
  }

  const leadsFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    if (!termo) return leads
    return leads.filter((l) =>
      (l.name ?? '').toLowerCase().includes(termo) || (l.phone ?? '').toLowerCase().includes(termo)
    )
  }, [leads, busca])

  const categorias = categoriasKanban ?? []

  const leadsPorCategoria = useMemo(() => {
    const mapa = new Map<string, LeadRow[]>()
    for (const cat of categorias) mapa.set(cat, [])
    for (const l of leadsFiltrados) {
      if (l.status && mapa.has(l.status)) mapa.get(l.status)!.push(l)
    }
    return mapa
  }, [leadsFiltrados, categorias])

  const detalhe = leads.find((l) => l.id === detalheId) ?? null

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 22, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontFamily: "'Baloo 2',sans-serif", fontSize: 30, color: '#227069', marginBottom: 8 }}>📋 Kanban de Leads</h2>
          <p style={{ color: '#6E807D', fontSize: 13 }}>Arraste os cards entre as colunas para mudar o status do lead.</p>
        </div>
        <input
          type="text"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por nome ou telefone…"
          style={{
            border: '1.5px solid #DFE9E7', borderRadius: 12, padding: '10px 16px',
            fontFamily: 'inherit', fontSize: 13, outline: 'none', minWidth: 240, background: '#fff',
          }}
        />
      </div>

      {erro && <p style={{ background: '#FDECEF', color: '#8C2340', borderRadius: 12, padding: '10px 14px', fontSize: 13, marginBottom: 16 }}>{erro}</p>}

      {perfilCarregando || carregando ? (
        <p style={{ color: '#6E807D', fontSize: 13 }}>Carregando leads…</p>
      ) : categorias.length === 0 ? (
        <p style={{ color: '#9BB0AD', fontSize: 13 }}>Nenhuma categoria de kanban configurada para esta conta.</p>
      ) : (
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          <div style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 8 }}>
            {categorias.map((cat) => (
              <Coluna key={cat} categoria={cat} leads={leadsPorCategoria.get(cat) ?? []} onAbrir={setDetalheId} />
            ))}
          </div>
        </DndContext>
      )}

      <LeadDetailModal
        lead={detalhe}
        categorias={categorias}
        atualizando={detalhe ? atualizandoId === detalhe.id : false}
        onFechar={() => setDetalheId(null)}
        onMudarStatus={moverLead}
      />
    </div>
  )
}
