import {
  ChevronDown,
  EllipsisVertical,
  LogOut,
  MessageSquarePlus,
  PanelLeft,
  Search,
  Trash2,
  UserCircle2
} from 'lucide-react';
import { useState } from 'react';

function ChatSidebar({
  activeConversationId,
  conversations,
  onCreateConversation,
  onDeleteConversation,
  onLogout,
  onSelectConversation,
  onToggleSidebar,
  isSidebarOpen,
  user
}) {
  const [openMenuId, setOpenMenuId] = useState('');
  const [isHistoryOpen, setIsHistoryOpen] = useState(() => {
    const stored = localStorage.getItem('ai-platform-history-open');
    return stored ? stored === 'true' : true;
  });

  const handleToggleHistory = () => {
    setIsHistoryOpen((current) => {
      const next = !current;
      localStorage.setItem('ai-platform-history-open', String(next));
      return next;
    });
  };

  return (
    <aside className={`chat-sidebar ${isSidebarOpen ? '' : 'collapsed'}`}>
      <div className="sidebar-header">
        <div className="brand-lockup">
          <div className="brand-badge">AI</div>
          <div>
            <strong>AI Service Console</strong>
            <span>Conversational workspace</span>
          </div>
        </div>

        <button
          className="secondary-icon-button"
          type="button"
          aria-pressed={!isSidebarOpen}
          onClick={onToggleSidebar}
        >
          <PanelLeft size={16} />
        </button>
      </div>

      <button className="primary-button full-width" type="button" onClick={onCreateConversation}>
        <MessageSquarePlus size={16} />
        <span className="button-text">New chat</span>
      </button>

      <div className="sidebar-search">
        <div className="sidebar-search-title">
          <Search size={16} />
          <span>Recent chats</span>
        </div>
        <button
          className="history-toggle"
          type="button"
          aria-expanded={isHistoryOpen}
          onClick={handleToggleHistory}
        >
          <ChevronDown size={16} />
        </button>
      </div>

      <div className={`conversation-list ${isHistoryOpen ? 'open' : 'collapsed'}`}>
        {conversations.map((conversation) => (
          <div
            key={conversation.id}
            className={`conversation-item ${
              conversation.id === activeConversationId ? 'active' : ''
            }`}
          >
            <button
              className="conversation-main-button"
              type="button"
              onClick={() => {
                setOpenMenuId('');
                onSelectConversation(conversation.id);
              }}
            >
              <strong>{conversation.title}</strong>
              <span>{conversation.preview}</span>
            </button>

            <div className="conversation-actions">
              <button
                className="conversation-menu-button"
                type="button"
                aria-label={`More options for ${conversation.title}`}
                onClick={() =>
                  setOpenMenuId((current) =>
                    current === conversation.id ? '' : conversation.id
                  )
                }
              >
                <EllipsisVertical size={16} />
              </button>

              {openMenuId === conversation.id ? (
                <div className="conversation-menu">
                  <button
                    className="conversation-menu-item danger"
                    type="button"
                    onClick={() => {
                      setOpenMenuId('');
                      onDeleteConversation(conversation.id);
                    }}
                  >
                    <Trash2 size={14} />
                    Delete
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        ))}
      </div>

      <div className="sidebar-footer">
        <div className="user-chip sidebar-user">
          <UserCircle2 size={18} />
          <span>{user?.name || user?.email}</span>
        </div>
        <button className="logout-button full-width" type="button" onClick={onLogout}>
          <LogOut size={16} />
          <span className="button-text">Logout</span>
        </button>
      </div>
    </aside>
  );
}

export default ChatSidebar;
