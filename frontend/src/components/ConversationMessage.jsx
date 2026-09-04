import { Download, FileText, UserCircle2 } from 'lucide-react';
import RichTextContent from './RichTextContent';

function ConversationMessage({
  message,
  isStreaming,
  onDownloadDocument,
  onDownloadImageJpg,
  onDownloadImagePdf
}) {
  const isUser = message.role === 'user';
  const timestamp = message.createdAt
    ? new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';

  return (
    <article className={`message-row ${isUser ? 'user' : 'assistant'}`}>
      <div className={`message-avatar ${isUser ? 'user' : 'assistant'}`}>
        {isUser ? <UserCircle2 size={18} /> : <span>AI</span>}
      </div>

      <div className={`message-bubble ${isUser ? 'user' : 'assistant'}`}>
        {!isUser ? (
          <div className="message-meta">
            <div className="assistant-label">AI Output</div>
            {timestamp ? <time>{timestamp}</time> : null}
          </div>
        ) : null}

        {message.type === 'text' ? (
          <div className="rich-text">
            <RichTextContent content={message.content} />
            {isStreaming ? <span className="streaming-cursor" /> : null}
          </div>
        ) : null}

        {message.type === 'image' ? (
          <div className="message-asset">
            <RichTextContent content={message.content} />
            <img alt={message.title} className="generated-image" src={message.imageUrl} />
            <div className="download-row">
              <button
                className="secondary-button"
                type="button"
                onClick={() => onDownloadImageJpg(message)}
              >
                <Download size={16} />
                Download JPG
              </button>
              <button
                className="secondary-button"
                type="button"
                onClick={() => onDownloadImagePdf(message)}
              >
                <FileText size={16} />
                Download PDF
              </button>
            </div>
          </div>
        ) : null}

        {message.type === 'document' ? (
          <div className="message-asset">
            <RichTextContent content={message.content} />
            <div className="document-card">
              <div className="document-meta">
                <FileText size={16} />
                <div>
                  <strong>{message.title}</strong>
                  <span>{message.format.toUpperCase()} ready to download</span>
                </div>
              </div>
              <button
                className="secondary-button"
                type="button"
                onClick={() => onDownloadDocument(message)}
              >
                <Download size={16} />
                Download {message.format.toUpperCase()}
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </article>
  );
}

export default ConversationMessage;
