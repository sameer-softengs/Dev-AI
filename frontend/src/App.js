import { useEffect, useMemo, useState } from 'react';
import './App.css';
import { apiClient, API_BASE_URL } from './lib/api';
import {
  defaultUsage,
  loadConversationsForUser,
  loadUsageForUser,
  saveConversationsForUser,
  saveUsageForUser
} from './lib/storage';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import { exportDocumentFile, downloadAsJpg, downloadAsPdf } from './utils/downloads';
import { detectIntent, inferDocumentFormat } from './utils/intent';

const emptyAuthForm = {
  name: '',
  email: '',
  password: ''
};

const createId = () =>
  window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const MAX_CONTEXT_MESSAGES = 10;
const MAX_CONTEXT_CHARS = 1200;
const SUMMARY_CONTEXT_MESSAGES = 12;
const SUMMARY_MIN_MESSAGES = 8;
const SUMMARY_UPDATE_STEP = 6;
const SUMMARY_PROMPT_LIMIT = 3200;

const buildConversationTitle = (message) =>
  String(message || 'New chat').trim().slice(0, 48) || 'New chat';

const extractDocumentTitle = (content, fallback = 'Generated Report') => {
  const lines = String(content || '')
    .split('\n')
    .map((line) =>
      String(line)
        .replace(/^#{1,4}\s+/, '')
        .replace(/\*\*/g, '')
        .replace(/\*/g, '')
        .replace(/^"+|"+$/g, '')
        .trim()
    )
    .filter(Boolean);

  const candidate = lines.find((line) => line.length > 5 && line.length < 90);
  return candidate || fallback;
};

const buildConversationPreview = (messages) => {
  const latestAssistantMessage = [...messages]
    .reverse()
    .find((message) => message.role === 'assistant');
  const fallbackMessage = messages[messages.length - 1];
  const source = latestAssistantMessage || fallbackMessage;

  if (!source) {
    return 'Start a new conversation';
  }

  return String(source.content || source.prompt || 'Conversation').slice(0, 80);
};


const createConversation = (seedMessage = '') => ({
  id: createId(),
  title: buildConversationTitle(seedMessage),
  preview: 'Start a new conversation',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  messages: [],
  summary: '',
  summaryMeta: {
    messageCount: 0,
    updatedAt: null
  }
});

const trimText = (value, limit) => {
  const text = String(value || '');
  if (text.length <= limit) {
    return text;
  }
  return `${text.slice(0, limit).trim()}...`;
};

const formatContextContent = (message) => {
  if (!message) {
    return '';
  }

  if (message.type === 'image' && !message.content) {
    return trimText(`Image generated: ${message.title || message.prompt || 'image'}`, MAX_CONTEXT_CHARS);
  }

  return trimText(message.content || message.prompt || '', MAX_CONTEXT_CHARS);
};

const buildContextMessages = (messages = [], pendingMessage = null) => {
  const combined = pendingMessage ? [...messages, pendingMessage] : [...messages];

  return combined
    .filter((message) => message && (message.role === 'user' || message.role === 'assistant'))
    .map((message) => ({
      role: message.role,
      content: formatContextContent(message)
    }))
    .filter((message) => message.content)
    .slice(-MAX_CONTEXT_MESSAGES);
};

const buildSummaryPrompt = (existingSummary, messages) => {
  const summaryBlock = existingSummary
    ? `Existing summary:\n${existingSummary.trim()}\n\n`
    : '';
  const transcript = messages
    .map((message) => {
      const label = message.role === 'user' ? 'User' : 'Assistant';
      return `${label}: ${formatContextContent(message)}`;
    })
    .join('\n');

  const prompt = `${summaryBlock}Summarize the conversation memory for future context. Keep it concise (max 8 bullet points, under 1200 characters).\n\nRecent messages:\n${transcript}`;
  return trimText(prompt, SUMMARY_PROMPT_LIMIT);
};

const shouldUpdateSummary = (messages, summaryMeta) => {
  if (messages.length < SUMMARY_MIN_MESSAGES) {
    return false;
  }

  const lastCount = summaryMeta?.messageCount || 0;
  return messages.length - lastCount >= SUMMARY_UPDATE_STEP;
};

const streamChatCompletion = async ({ token, payload, onDelta }) => {
  const response = await fetch(`${API_BASE_URL}/chat/stream`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Streaming request failed.');
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('Streaming not supported by the browser.');
  }

  const decoder = new TextDecoder('utf-8');
  let buffer = '';
  let fullText = '';

  while (true) {
    const { value, done } = await reader.read();
    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split('\n\n');
    buffer = parts.pop() || '';

    parts.forEach((part) => {
      const line = part
        .split('\n')
        .map((item) => item.trim())
        .find((item) => item.startsWith('data:'));

      if (!line) {
        return;
      }

      const data = line.replace(/^data:\s*/, '');
      if (data === '[DONE]') {
        return;
      }

      try {
        const parsed = JSON.parse(data);
        if (parsed.error) {
          throw new Error(parsed.error);
        }
        if (parsed.delta) {
          fullText += parsed.delta;
          onDelta(fullText);
        }
      } catch (error) {
        // Ignore malformed chunks
      }
    });
  }

  return fullText;
};

const mapRecentMessages = (messages) =>
  messages.slice(-4).map((message) => ({
    role: message.role,
    content: message.content
  }));

const detectIntentWithFallback = async ({ currentConversation, prompt, token }) => {
  try {
    const detectionResponse = await apiClient.post(
      '/detect-intent',
      {
        prompt,
        recentMessages: mapRecentMessages(currentConversation?.messages || [])
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    return {
      intent: detectionResponse.data.intent || 'chat',
      format: detectionResponse.data.format || null
    };
  } catch (error) {
    const fallbackIntent = detectIntent(prompt);
    return {
      intent: fallbackIntent,
      format: fallbackIntent === 'document' ? inferDocumentFormat(prompt) : null
    };
  }
};

function App() {
  const [mode, setMode] = useState('login');
  const [authForm, setAuthForm] = useState(emptyAuthForm);
  const [token, setToken] = useState(
    () => localStorage.getItem('ai-platform-token') || ''
  );
  const [user, setUser] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState('');
  const [messageInput, setMessageInput] = useState('');
  const [imageUsage, setImageUsage] = useState(defaultUsage);
  const [authError, setAuthError] = useState('');
  const [appError, setAppError] = useState('');
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activeConversation = useMemo(
    () =>
      conversations.find((conversation) => conversation.id === activeConversationId) ||
      conversations[0] ||
      null,
    [activeConversationId, conversations]
  );


  useEffect(() => {
    if (!token) {
      return;
    }

    const bootstrap = async () => {
      try {
        const meResponse = await apiClient.get('/auth/me', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const currentUser = meResponse.data.user;
        const localConversations = loadConversationsForUser(currentUser?.id);
        const localUsage = loadUsageForUser(currentUser?.id);
        const seededConversations =
          localConversations.length > 0 ? localConversations : [createConversation()];

        setUser(currentUser);
        setConversations(seededConversations);
        setActiveConversationId(seededConversations[0].id);
        setImageUsage(localUsage);
      } catch (error) {
        handleLogout();
      }
    };

    bootstrap();
  }, [token]);

  const persistConversations = (nextConversations) => {
    setConversations(nextConversations);
    if (user?.id) {
      saveConversationsForUser(user.id, nextConversations);
    }
  };

  const setConversationSummary = (conversationId, summary, messageCount) => {
    setConversations((current) => {
      const nextConversations = current.map((conversation) => {
        if (conversation.id !== conversationId) {
          return conversation;
        }

        return {
          ...conversation,
          summary,
          summaryMeta: {
            messageCount,
            updatedAt: new Date().toISOString()
          }
        };
      });

      if (user?.id) {
        saveConversationsForUser(user.id, nextConversations);
      }

      return nextConversations;
    });
  };

  const updateMessageContent = (conversationId, messageId, content) => {
    setConversations((current) => {
      const nextConversations = current.map((conversation) => {
        if (conversation.id !== conversationId) {
          return conversation;
        }

        const nextMessages = conversation.messages.map((message) =>
          message.id === messageId ? { ...message, content } : message
        );

        return {
          ...conversation,
          preview: buildConversationPreview(nextMessages),
          updatedAt: new Date().toISOString(),
          messages: nextMessages
        };
      });

      if (user?.id) {
        saveConversationsForUser(user.id, nextConversations);
      }

      return nextConversations;
    });
  };

  const upsertConversationMessages = (conversationId, updater) => {
    const nextConversations = conversations.map((conversation) => {
      if (conversation.id !== conversationId) {
        return conversation;
      }

      const nextMessages = updater(conversation.messages);
      return {
        ...conversation,
        title:
          conversation.messages.length === 0
            ? buildConversationTitle(nextMessages[0]?.content || conversation.title)
            : conversation.title,
        preview: buildConversationPreview(nextMessages),
        updatedAt: new Date().toISOString(),
        messages: nextMessages
      };
    });

    const sortedConversations = [...nextConversations].sort(
      (first, second) => new Date(second.updatedAt) - new Date(first.updatedAt)
    );

    persistConversations(sortedConversations);
  };

  const ensureConversation = (seedMessage = '') => {
    if (activeConversation) {
      return activeConversation.id;
    }

    const nextConversation = createConversation(seedMessage);
    const nextConversations = [nextConversation, ...conversations];
    persistConversations(nextConversations);
    setActiveConversationId(nextConversation.id);
    return nextConversation.id;
  };

  const createNewConversation = () => {
    const nextConversation = createConversation();
    const nextConversations = [nextConversation, ...conversations];
    persistConversations(nextConversations);
    setActiveConversationId(nextConversation.id);
    setMessageInput('');
    setAppError('');
  };

  const deleteConversation = (conversationId) => {
    const remainingConversations = conversations.filter(
      (conversation) => conversation.id !== conversationId
    );

    if (remainingConversations.length === 0) {
      const fallbackConversation = createConversation();
      persistConversations([fallbackConversation]);
      setActiveConversationId(fallbackConversation.id);
      setAppError('');
      return;
    }

    persistConversations(remainingConversations);

    if (activeConversationId === conversationId) {
      setActiveConversationId(remainingConversations[0].id);
    }

    setAppError('');
  };

  const handleAuthInputChange = (event) => {
    const { name, value } = event.target;
    setAuthForm((current) => ({ ...current, [name]: value }));
  };

  const handleAuthSubmit = async (event) => {
    event.preventDefault();
    setAuthError('');
    setIsAuthLoading(true);

    try {
      const endpoint = mode === 'register' ? '/auth/register' : '/auth/login';
      const payload =
        mode === 'register'
          ? authForm
          : { email: authForm.email, password: authForm.password };
      const response = await apiClient.post(endpoint, payload);
      const userConversations = loadConversationsForUser(response.data.user?.id);
      const seededConversations =
        userConversations.length > 0 ? userConversations : [createConversation()];

      localStorage.setItem('ai-platform-token', response.data.token);
      setToken(response.data.token);
      setUser(response.data.user);
      setConversations(seededConversations);
      setActiveConversationId(seededConversations[0].id);
      setImageUsage(loadUsageForUser(response.data.user?.id));
      setAuthForm(emptyAuthForm);
    } catch (error) {
      setAuthError(
        error.response?.data?.error || 'Unable to complete authentication.'
      );
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('ai-platform-token');
    setToken('');
    setUser(null);
    setConversations([]);
    setActiveConversationId('');
    setMessageInput('');
    setImageUsage(defaultUsage);
    setAuthError('');
    setAppError('');
    setIsSubmitting(false);
  };

  const requestSummaryUpdate = async ({ conversationId, messages, summary, summaryMeta }) => {
    if (!shouldUpdateSummary(messages, summaryMeta)) {
      return;
    }

    try {
      const summaryPrompt = buildSummaryPrompt(
        summary,
        messages.slice(-SUMMARY_CONTEXT_MESSAGES)
      );
      const response = await apiClient.post(
        '/chat',
        {
          prompt: summaryPrompt,
          systemPrompt:
            'You are a summarization engine. Return only the updated memory summary, concise and factual.'
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data?.data) {
        setConversationSummary(conversationId, response.data.data, messages.length);
      }
    } catch (error) {
      console.warn('Summary update failed', error.response?.data || error.message);
    }
  };

  const sendChatMessage = async ({ conversationId, userMessage, conversation }) => {
    const contextMessages = buildContextMessages(conversation?.messages || [], userMessage);
    const assistantId = createId();
    const assistantMessage = {
      id: assistantId,
      role: 'assistant',
      type: 'text',
      content: '',
      createdAt: new Date().toISOString()
    };

    let nextMessages = [];
    upsertConversationMessages(conversationId, (messages) => {
      nextMessages = [...messages, userMessage, assistantMessage];
      return nextMessages;
    });

    const fullText = await streamChatCompletion({
      token,
      payload: {
        messages: contextMessages,
        summary: conversation?.summary || ''
      },
      onDelta: (content) => updateMessageContent(conversationId, assistantId, content)
    });

    updateMessageContent(conversationId, assistantId, fullText);

    const finalizedMessages = nextMessages.map((message) =>
      message.id === assistantId ? { ...message, content: fullText } : message
    );

    await requestSummaryUpdate({
      conversationId,
      messages: finalizedMessages,
      summary: conversation?.summary || '',
      summaryMeta: conversation?.summaryMeta
    });
  };

  const sendImageMessage = async ({ conversationId, prompt, userMessage, conversation }) => {
    if (!user?.id) {
      throw new Error('Please log in again.');
    }

    const currentUsage = loadUsageForUser(user.id);
    if (currentUsage.remaining <= 0) {
      setImageUsage(currentUsage);
      throw new Error('Daily image generation limit reached for this browser on this account.');
    }

    const response = await apiClient.post(
      '/generate-image',
      { prompt },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    let nextMessages = [];
    const assistantMessage = {
      id: createId(),
      role: 'assistant',
      type: 'image',
      title: buildConversationTitle(prompt),
      content: `I generated an image based on: ${prompt}`,
      imageUrl: response.data.imageUrl,
      createdAt: new Date().toISOString()
    };

    upsertConversationMessages(conversationId, (messages) => {
      nextMessages = [...messages, userMessage, assistantMessage];
      return nextMessages;
    });

    await requestSummaryUpdate({
      conversationId,
      messages: nextMessages,
      summary: conversation?.summary || '',
      summaryMeta: conversation?.summaryMeta
    });

    setImageUsage(saveUsageForUser(user.id, currentUsage.used + 1));
  };

  const sendDocumentMessage = async ({ conversationId, prompt, userMessage, format = 'pdf', conversation }) => {
    const contextMessages = buildContextMessages(conversation?.messages || [], userMessage);
    const response = await apiClient.post(
      '/chat',
      {
        messages: contextMessages,
        summary: conversation?.summary || '',
        systemPrompt: `Create a polished ${format.toUpperCase()}-ready document about: ${prompt}. Structure it with a clear title, short introduction, meaningful section headings, concise paragraphs, and bullet lists where helpful. Do not use markdown tables, pipe-delimited tables, triple dashes, or decorative symbols. Write clean professional report text that can be exported directly to PDF or DOCX without losing formatting.`
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const documentTitle = extractDocumentTitle(response.data.data, 'Generated Report');

    let nextMessages = [];
    const assistantMessage = {
      id: createId(),
      role: 'assistant',
      type: 'document',
      title: documentTitle,
      format,
      content: response.data.data,
      documentContent: response.data.data,
      createdAt: new Date().toISOString()
    };

    upsertConversationMessages(conversationId, (messages) => {
      nextMessages = [...messages, userMessage, assistantMessage];
      return nextMessages;
    });

    await requestSummaryUpdate({
      conversationId,
      messages: nextMessages,
      summary: conversation?.summary || '',
      summaryMeta: conversation?.summaryMeta
    });
  };

  const handleSubmitMessage = async (event) => {
    event.preventDefault();
    const prompt = messageInput.trim();

    if (!prompt) {
      return;
    }

    setAppError('');
    setIsSubmitting(true);
    setMessageInput('');

    const conversationId = ensureConversation(prompt);
    const userMessage = {
      id: createId(),
      role: 'user',
      type: 'text',
      content: prompt,
      createdAt: new Date().toISOString()
    };

    try {
      const currentConversation = conversations.find(
        (conversation) => conversation.id === conversationId
      );
      const detection = await detectIntentWithFallback({
        currentConversation,
        prompt,
        token
      });
      const intent = detection.intent || 'chat';

      if (intent === 'image') {
        await sendImageMessage({
          conversationId,
          prompt,
          userMessage,
          conversation: currentConversation
        });
      } else if (intent === 'document') {
        await sendDocumentMessage({
          conversationId,
          prompt,
          userMessage,
          format: detection.format || 'pdf',
          conversation: currentConversation
        });
      } else {
        await sendChatMessage({
          conversationId,
          userMessage,
          conversation: currentConversation
        });
      }
    } catch (error) {
      setAppError(error.response?.data?.error || error.message || 'Request failed.');
      setMessageInput(prompt);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadDocument = async (message) => {
    try {
      await exportDocumentFile({
        content: message.documentContent,
        format: message.format,
        title: message.title,
        token
      });
    } catch (error) {
      setAppError(error.response?.data?.error || 'Unable to export document.');
    }
  };

  const handleDownloadImageJpg = async (message) => {
    try {
      await downloadAsJpg(message.imageUrl, message.title);
    } catch (error) {
      setAppError(error.message || 'Unable to download image.');
    }
  };

  const handleDownloadImagePdf = async (message) => {
    try {
      await downloadAsPdf(message.imageUrl, message.title, token);
    } catch (error) {
      setAppError(error.response?.data?.error || 'Unable to download image PDF.');
    }
  };

  return (
    <div className="app-root">
      {user ? (
        <DashboardPage
          activeConversation={activeConversation}
          activeConversationId={activeConversationId}
          appError={appError}
          conversations={conversations}
          imageUsage={imageUsage}
          isSubmitting={isSubmitting}
          messageInput={messageInput}
          onCreateConversation={createNewConversation}
          onDeleteConversation={deleteConversation}
          onDownloadDocument={handleDownloadDocument}
          onDownloadImageJpg={handleDownloadImageJpg}
          onDownloadImagePdf={handleDownloadImagePdf}
          onLogout={handleLogout}
          onMessageInputChange={setMessageInput}
          onSelectConversation={setActiveConversationId}
          onSubmitMessage={handleSubmitMessage}
          user={user}
        />
      ) : (
        <AuthPage
          mode={mode}
          authForm={authForm}
          authError={authError}
          isAuthLoading={isAuthLoading}
          onModeChange={setMode}
          onInputChange={handleAuthInputChange}
          onSubmit={handleAuthSubmit}
        />
      )}
    </div>
  );
}

export default App;
