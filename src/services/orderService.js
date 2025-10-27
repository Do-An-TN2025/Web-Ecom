const API_URL = (process.env.REACT_APP_API_URL || "http://localhost:8686/api").replace(/\/$/, "");

async function handleResponse(res) {
  const text = await res.text().catch(() => "");
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!res.ok) {
    const err = new Error((data && data.message) || res.statusText || "Request failed");
    err.status = res.status;
    err.payload = data;
    throw err;
  }
  return data;
}

function authHeader(token) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * API functions
 */
export async function createOrder(payload, token = null, signal = null) {
  const res = await fetch(`${API_URL}/orders/create-orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeader(token),
    },
    body: JSON.stringify(payload),
    signal,
  });
  return handleResponse(res);
}

export async function checkPaymentStatus(orderCode, token = null) {
  const res = await fetch(`${API_URL}/orders/payment-status/${encodeURIComponent(orderCode)}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...authHeader(token),
    },
  });
  return handleResponse(res);
}

export async function getMyOrders(token) {
  if (!token) throw new Error("Token required");
  const res = await fetch(`${API_URL}/orders`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...authHeader(token),
    },
  });
  return handleResponse(res);
}

export async function getOrderById(id, token) {
  if (!token) throw new Error("Token required");
  const res = await fetch(`${API_URL}/orders/${encodeURIComponent(id)}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...authHeader(token),
    },
  });
  return handleResponse(res);
}

export async function cancelOrder(id, token) {
  if (!token) throw new Error("Token required");
  const res = await fetch(`${API_URL}/orders/${encodeURIComponent(id)}/cancel`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeader(token),
    },
  });
  return handleResponse(res);
}

export function pollPaymentStatus(orderCode, { interval = 5000, timeout = 120000, token = null, onUpdate = () => {} } = {}) {
  if (!orderCode) throw new Error("orderCode required");
  let stopped = false;
  let timer = null;
  const start = Date.now();

  async function tick() {
    if (stopped) return;
    try {
      const data = await checkPaymentStatus(orderCode, token);
      onUpdate(null, data);
      const status =
        data?.paymentStatus ||
        data?.orderStatus ||
        data?.order?.paymentMethod?.status ||
        data?.payment?.status;
      if (String(status).toLowerCase() === "paid") {
        stop();
        return;
      }
    } catch (err) {
      onUpdate(err, null);
    }
    if (Date.now() - start >= timeout) {
      stop();
      return;
    }
    timer = setTimeout(tick, interval);
  }

  function stop() {
    stopped = true;
    if (timer) clearTimeout(timer);
  }
  tick();

  return { stop };
}

export async function getOrdersAdmin(query = {}, token) {
  if (!token) throw new Error("Token required");
  const params = new URLSearchParams();
  Object.keys(query || {}).forEach((k) => {
    const v = query[k];
    if (v !== undefined && v !== null && v !== "") params.set(k, String(v));
  });
  const url = `${API_URL}/orders/admin${params.toString() ? `?${params.toString()}` : ""}`;
  const res = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...authHeader(token),
    },
  });
  return handleResponse(res);
}

export async function updateOrderStatusAdmin(id, body = {}, token) {
  if (!token) throw new Error("Token required");
  const res = await fetch(`${API_URL}/orders/admin/${encodeURIComponent(id)}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...authHeader(token),
    },
    body: JSON.stringify(body),
  });
  return handleResponse(res);
}

export default {
  createOrder,
  checkPaymentStatus,
  getMyOrders,
  getOrderById,
  cancelOrder,
  pollPaymentStatus,
  getOrdersAdmin,
  updateOrderStatusAdmin,
};