// ...existing code...
import React, { useEffect, useState, useRef } from 'react'
import voucherApi from '../../services/voucherService'

const currency = (v) => new Intl.NumberFormat('vi-VN').format(v)

const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.35)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1400,
    padding: 16
  },
  modal: {
    width: 480,
    maxWidth: '100%',
    background: '#fff',
    borderRadius: 8,
    boxShadow: '0 6px 18px rgba(0,0,0,0.12)',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    maxHeight: '86vh',
    fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial'
  },
  header: {
    padding: '12px 16px',
    borderBottom: '1px solid #eee',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  title: { margin: 0, fontSize: 16, fontWeight: 600, color: '#111' },
  closeBtn: { background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 18, color: '#666' },

  content: { padding: 14, overflow: 'auto', flex: 1 },
  row: { display: 'flex', gap: 8, marginBottom: 12, alignItems: 'center' },
  input: {
    flex: 1,
    padding: '10px 12px',
    borderRadius: 6,
    border: '1px solid #ddd',
    fontSize: 14,
    outline: 'none'
  },
  searchBtn: {
    padding: '9px 12px',
    borderRadius: 6,
    border: '1px solid #ddd',
    background: '#f3f4f6',
    cursor: 'pointer',
    fontWeight: 600,
    color: '#111'
  },

  list: { display: 'flex', flexDirection: 'column', gap: 8 },
  item: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 6,
    border: '1px solid #f0f0f0',
    background: '#fff',
    cursor: 'pointer'
  },
  itemLeft: { display: 'flex', flexDirection: 'column' },
  code: { fontWeight: 700, fontSize: 14, color: '#111' },
  desc: { fontSize: 13, color: '#6b7280', marginTop: 4 },
  applySmall: {
    padding: '6px 10px',
    borderRadius: 6,
    border: '1px solid #d1d5db',
    background: '#eef2ff',
    color: '#111',
    cursor: 'pointer',
    fontWeight: 600
  },

  footer: {
    padding: 12,
    borderTop: '1px solid #eee',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  confirm: {
    padding: '10px 14px',
    borderRadius: 6,
    border: 'none',
    background: '#0f172a',
    color: '#fff',
    cursor: 'pointer',
    fontWeight: 700
  },
  cancel: {
    padding: '8px 12px',
    borderRadius: 6,
    border: '1px solid #ddd',
    background: '#fff',
    cursor: 'pointer'
  },

  infoLine: { fontSize: 13, color: '#374151' },
  smallMuted: { fontSize: 12, color: '#6b7280' },

  toast: {
    position: 'fixed',
    left: '50%',
    transform: 'translateX(-50%)',
    bottom: 22,
    padding: '8px 12px',
    borderRadius: 6,
    color: '#fff',
    fontWeight: 600
  }
}

export default function CouponModal({ open, onClose, onApply, subtotal = 0 }) {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [available, setAvailable] = useState([])
  const [selected, setSelected] = useState(null)
  const [toast, setToast] = useState(null) // { text, type }
  const inputRef = useRef(null)

  useEffect(() => {
    if (!open) return
    setSelected(null)
    setQuery('')
    // focus
    setTimeout(() => inputRef.current?.focus(), 80)
    fetchAvailable()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

    const fetchAvailable = async (q = '') => {
    setLoading(true)
    try {
      const params = { active: true }
      const safeQ = String(q || '').trim()
      if (safeQ) params.q = safeQ
      const data = await voucherApi.getVouchers(params)
      setAvailable((data || []).map(v => ({
        code: String(v.code || ''),
        title: v.type === 'percent' ? `${v.value}%` : `${currency(v.value)} đ`,
        min: Number(v.minOrderValue || 0),
        raw: v
      })))
    } catch (err) {
      setAvailable([])
    } finally {
      setLoading(false)
    }
  }
const safeTrim = (v) => {
    if (v === null || v === undefined) return ''
    if (typeof v === 'object') return String(v.code ?? v.value ?? '').trim()
    return String(v).trim()
  }
  const handleSearch = async () => {
    // safe trim: convert to string first
    await fetchAvailable(safeTrim(query))
  }

  const handleSelect = (item) => {
    if (selected && selected.code === item.code) setSelected(null)
    else setSelected(item)
  }

  const showToast = (text, type = 'info') => {
    setToast({ text, type })
    setTimeout(() => setToast(null), 2800)
  }

const handleConfirm = async () => {
    const codeToUseRaw = selected?.code ?? query ?? ''
    const codeToUse = safeTrim(codeToUseRaw).toUpperCase()
    if (!codeToUse) { showToast('Vui lòng chọn hoặc nhập mã', 'error'); return }
    setLoading(true)
    try {
      // debug log tạm để xác định nguyên nhân nếu vẫn lỗi
      console.debug('Applying voucher - selected:', selected, 'query:', query, 'normalizedCode:', codeToUse)

      const payload = { code: String(codeToUse), orderTotal: Number(subtotal || 0) }
      const res = await voucherApi.applyVoucher(payload)
      showToast(`Tiết kiệm ${currency(res.discount)} đ`, 'success')
      onApply && onApply({ code: String(codeToUse), discount: res.discount, newTotal: res.newTotal })
      onClose && onClose()
    } catch (err) {
      const text = err?.response?.data?.message || err?.message || 'Áp dụng thất bại'
      showToast(text, 'error')
    } finally {
      setLoading(false)
    }
  }
  if (!open) return null

  return (
    <div style={styles.overlay} role="dialog" aria-modal="true">
      <div style={styles.modal}>
        <div style={styles.header}>
          <h3 style={styles.title}>Chọn khuyến mãi</h3>
          <button aria-label="Đóng" onClick={onClose} style={styles.closeBtn}>✕</button>
        </div>

        <div style={styles.content}>
          <div style={styles.row}>
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm mã, ví dụ: WELCOME10"
              style={styles.input}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              aria-label="Tìm mã khuyến mãi"
            />
            <button onClick={handleSearch} style={styles.searchBtn} aria-label="Tìm kiếm">Tìm</button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <div style={styles.infoLine}>Tổng: <strong>{currency(subtotal)} đ</strong></div>
            <div style={styles.smallMuted}>{available.length} kết quả</div>
          </div>

          {loading ? (
            <div style={{ padding: 18, color: '#6b7280' }}>Đang tải...</div>
          ) : available.length === 0 ? (
            <div style={{ padding: 28, textAlign: 'center', color: '#6b7280' }}>
              Không tìm thấy mã phù hợp.
            </div>
          ) : (
            <div style={styles.list}>
              {available.map(item => {
                const disabled = subtotal < (item.min || 0)
                const isSelected = selected?.code === item.code
                return (
                  <div
                    key={item.code}
                    onClick={() => !disabled && handleSelect(item)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && !disabled && handleSelect(item)}
                    style={{
                      ...styles.item,
                      background: isSelected ? '#f8fafc' : '#fff',
                      opacity: disabled ? 0.7 : 1
                    }}
                  >
                    <div style={styles.itemLeft}>
                      <div style={styles.code}>{item.code}</div>
                      <div style={styles.desc}>{item.title}</div>
                      <div style={styles.smallMuted}>Yêu cầu tối thiểu: {currency(item.min)} đ</div>
                    </div>

                    <div>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleSelect(item) }}
                        style={styles.applySmall}
                        disabled={disabled}
                        aria-pressed={isSelected}
                      >
                        {isSelected ? 'Đã chọn' : (disabled ? 'Không hợp lệ' : 'Chọn')}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div style={styles.footer}>
          <div style={styles.smallMuted}>Mã đã chọn: <strong style={{ color: '#111' }}>{selected?.code || (query ? query.toUpperCase() : '—')}</strong></div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={onClose} style={styles.cancel}>Hủy</button>
            <button onClick={handleConfirm} style={styles.confirm} disabled={loading}>
              {loading ? 'Đang...' : 'Xác nhận'}
            </button>
          </div>
        </div>
      </div>

      {toast && (
        <div style={{
          ...styles.toast,
          background: toast.type === 'success' ? '#16a34a' : toast.type === 'error' ? '#ef4444' : '#374151'
        }}>
          {toast.text}
        </div>
      )}
    </div>
  )
}