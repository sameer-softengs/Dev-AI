import {
  Image as ImageIcon,
  LogOut,
  MessageSquareText,
  UserCircle2
} from 'lucide-react';

function AppNavbar({ activeView, onChangeView, onLogout, user }) {
  return (
    <nav className="topbar">
      <div className="brand-lockup">
        <div className="brand-badge">AI</div>
        <div>
          <strong>AI Service Console</strong>
          <span>Chat, images, and project history</span>
        </div>
      </div>

      <div className="topbar-actions">
        <button
          className={`nav-chip ${activeView === 'chat' ? 'active' : ''}`}
          type="button"
          onClick={() => onChangeView('chat')}
        >
          <MessageSquareText size={16} />
          Chat
        </button>
        <button
          className={`nav-chip ${activeView === 'image' ? 'active' : ''}`}
          type="button"
          onClick={() => onChangeView('image')}
        >
          <ImageIcon size={16} />
          Image generation
        </button>
        <div className="user-chip">
          <UserCircle2 size={18} />
          <span>{user?.name || user?.email}</span>
        </div>
        <button className="logout-button" type="button" onClick={onLogout}>
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </nav>
  );
}

export default AppNavbar;
