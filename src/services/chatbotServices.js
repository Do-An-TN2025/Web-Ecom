import axios from "axios";

const API_BASE = (process.env.REACT_APP_API_URL || "").replace(/\/$/, "");
const CHAT_URL = `${API_BASE}/chat/search`;

export async function chatSearch(messages, options = {}) {
  const payload = {
    messages,
    page: options.page || 1,
    limit: options.limit || 20,
    sortBy: options.sortBy,
    sortOrder: options.sortOrder
  };
  const { data } = await axios.post(CHAT_URL, payload);
  return data;
}