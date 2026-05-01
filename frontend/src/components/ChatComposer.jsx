import { ArrowUp, Square, Sparkles } from 'lucide-react';

function ChatComposer({
  imageUsage,
  isSubmitting,
  isStreaming,
  prompt,
  onPromptChange,
  onSubmit,
  onStopStreaming
}) {
  return (
    <form className="chat-composer" onSubmit={onSubmit}>
      <div className="composer-meta">
        <span className="section-tag">Ask anything</span>
        <small>{imageUsage.remaining} image generations left today</small>
      </div>

      <textarea
        value={prompt}
        onChange={(event) => onPromptChange(event.target.value)}
        placeholder="Message the assistant. Ask for chat replies, image generation, or a PDF/document and it will respond in this same conversation."
        rows={4}
      />

      <div className="composer-actions">
        <p className="composer-hint">
          Try: "Create an image of a modern office lobby" or "Make a PDF summary of cloud computing"
        </p>
        <div className="composer-buttons">
          {isStreaming ? (
            <button className="secondary-button" type="button" onClick={onStopStreaming}>
              <Square size={14} />
              Stop
            </button>
          ) : null}
          <button
            className="primary-button"
            type="submit"
            disabled={isSubmitting || isStreaming || !prompt.trim()}
          >
            {isSubmitting || isStreaming ? <Sparkles size={16} /> : <ArrowUp size={16} />}
            {isSubmitting || isStreaming ? 'Working...' : 'Send'}
          </button>
        </div>
      </div>
    </form>
  );
}

export default ChatComposer;
