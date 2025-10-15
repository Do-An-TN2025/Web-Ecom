// ...existing code...
const KEY = 'demo_vouchers_v1'

const sample = [
  {
    _id: 'v1',
    code: 'WELCOME10',
    type: 'percent',
    value: 10,
    maxDiscount: 100000,
    startAt: new Date().toISOString(),
    endAt: new Date(new Date().getTime() + 7*24*3600*1000).toISOString(),
    minOrderValue: 0,
    active: true,
    usageLimit: null,
    perUserLimit: 1,
    usedCount: 0
  },
  {
    _id: 'v2',
    code: 'FLAT50',
    type: 'fixed',
    value: 50000,
    maxDiscount: null,
    startAt: new Date().toISOString(),
    endAt: new Date(new Date().getTime() + 30*24*3600*1000).toISOString(),
    minOrderValue: 200000,
    active: true,
    usageLimit: 100,
    perUserLimit: null,
    usedCount: 0
  }
]

const read = () => {
  const raw = localStorage.getItem(KEY)
  if (!raw) {
    localStorage.setItem(KEY, JSON.stringify(sample))
    return [...sample]
  }
  try {
    return JSON.parse(raw)
  } catch {
    localStorage.setItem(KEY, JSON.stringify(sample))
    return [...sample]
  }
}

const write = (data) => {
  localStorage.setItem(KEY, JSON.stringify(data))
}

const uid = () => Math.random().toString(36).slice(2,9)

export default {
  getAll: async () => {
    await new Promise(r => setTimeout(r, 100))
    return read()
  },
  createVoucher: async (payload) => {
    const list = read()
    const item = { ...payload, _id: uid(), usedCount: 0 }
    list.unshift(item)
    write(list)
    return item
  },
  updateVoucher: async (id, payload) => {
    const list = read()
    const idx = list.findIndex(x => x._id === id)
    if (idx === -1) throw new Error('Not found')
    list[idx] = { ...list[idx], ...payload }
    write(list)
    return list[idx]
  },
  deleteVoucher: async (id) => {
    let list = read()
    list = list.filter(x => x._id !== id)
    write(list)
    return true
  }
}
// ...existing code...