import { MessageSquareText, Send } from 'lucide-react';

function ChatPanel({
  chatPrompt,
  chatReply,
  isChatLoading,
  isPending,
  onChatPromptChange,
  onSubmit
}) {
  return (
    <section className="tool-card">
      <div className="tool-heading">
        <div>
          <p className="section-tag">Chat generation</p>
          <h3>Generate assistant responses</h3>
        </div>
        <MessageSquareText size={20} />
      </div>

      <form className="tool-form" onSubmit={onSubmit}>
        <label>
          <span>Prompt</span>
          <textarea
            value={chatPrompt}
            onChange={(event) => onChatPromptChange(event.target.value)}
            placeholder="Ask for a feature brief, response draft, or workflow help"
            rows={6}
            required
          />
        </label>

        <button
          className="primary-button"
          type="submit"
          disabled={isChatLoading || !chatPrompt.trim()}
        >
          <Send size={16} />
          {isChatLoading ? 'Generating...' : 'Send to AI'}
        </button>
      </form>

      <div className="result-panel">
        <div className="result-header">
          <strong>Latest response</strong>
          <span>{isPending ? 'Refreshing history...' : 'Stored in history'}</span>
        </div>
        <p>{chatReply || 'Your generated response will appear here.'}</p>
      </div>
    </section>
  );
}

export default ChatPanel;
