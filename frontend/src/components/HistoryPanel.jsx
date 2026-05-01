import { ChevronDown, History } from 'lucide-react';
import { useState } from 'react';

function HistoryPanel({ history = [] }) {
  const [isOpen, setIsOpen] = useState(true);
  const historyCount = history.length;

  return (
    <aside className="history-column">
      <div className="history-column-header">
        <div>
          <p className="section-tag">History</p>
          <h3>Account activity</h3>
          <span className="history-summary">{historyCount} items</span>
        </div>
        <div className="history-actions">
          <History size={18} />
          <button
            className="history-toggle"
            type="button"
            aria-expanded={isOpen}
            onClick={() => setIsOpen((current) => !current)}
          >
            <ChevronDown size={16} />
          </button>
        </div>
      </div>

      <div className={`history-list ${isOpen ? 'open' : 'collapsed'}`}>
        {history.length > 0 ? (
          history.map((item) => (
            <article className="history-card" key={item.id}>
              <div className="history-meta">
                <span className={`pill ${item.type}`}>{item.type}</span>
                <time>{new Date(item.createdAt).toLocaleString()}</time>
              </div>
              <p className="history-prompt">{item.prompt}</p>
              {item.type === 'image' ? (
                <img alt={item.prompt} className="history-image" src={item.imageUrl} />
              ) : (
                <p className="history-response">{item.responseText}</p>
              )}
            </article>
          ))
        ) : (
          <div className="empty-state">
            <p>No history yet.</p>
            <span>Your chats and generated images will be stored here.</span>
          </div>
        )}
      </div>
    </aside>
  );
}

export default HistoryPanel;
