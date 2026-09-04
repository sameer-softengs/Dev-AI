export const defaultUsage = {
  used: 0,
  remaining: 4,
  limit: 4
};

const getConversationStorageKey = (userId) => `ai-platform-conversations-${userId}`;
const getUsageStorageKey = (userId) => `ai-platform-image-usage-${userId}`;

export const getTodayKey = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const loadConversationsForUser = (userId) => {
  if (!userId) {
    return [];
  }

  try {
    const raw = localStorage.getItem(getConversationStorageKey(userId));
    const parsed = JSON.parse(raw || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
};

export const saveConversationsForUser = (userId, items) => {
  if (!userId) {
    return;
  }

  localStorage.setItem(
    getConversationStorageKey(userId),
    JSON.stringify(items.slice(0, 100))
  );
};

export const loadUsageForUser = (userId) => {
  if (!userId) {
    return defaultUsage;
  }

  const today = getTodayKey();

  try {
    const raw = localStorage.getItem(getUsageStorageKey(userId));
    const parsed = JSON.parse(raw || '{}');
    const used = parsed.date === today ? Number(parsed.used || 0) : 0;

    return {
      date: today,
      used,
      remaining: Math.max(defaultUsage.limit - used, 0),
      limit: defaultUsage.limit
    };
  } catch (error) {
    return {
      ...defaultUsage,
      date: today
    };
  }
};

export const saveUsageForUser = (userId, used) => {
  if (!userId) {
    return defaultUsage;
  }

  const nextUsage = {
    date: getTodayKey(),
    used,
    remaining: Math.max(defaultUsage.limit - used, 0),
    limit: defaultUsage.limit
  };

  localStorage.setItem(
    getUsageStorageKey(userId),
    JSON.stringify({ date: nextUsage.date, used: nextUsage.used })
  );

  return nextUsage;
};
