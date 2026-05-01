import { Bot, Sparkles } from 'lucide-react';
import ChatComposer from './ChatComposer';
import ConversationMessage from './ConversationMessage';

function ConversationView({
  activeConversation,
  appError,
  imageUsage,
  isSubmitting,
  isStreaming,
  prompt,
  onDownloadDocument,
  onDownloadImageJpg,
  onDownloadImagePdf,
  onPromptChange,
  onSubmit,
  onStopStreaming
}) {
  return (
    <section className="conversation-shell">
      <header className="conversation-topbar">
        <div className="conversation-title">
          <h2>{activeConversation?.title || 'New chat'}</h2>
          <span>{imageUsage.remaining} images left today</span>
        </div>
        <button className="ghost-button" type="button">
          <Sparkles size={16} />
          Share
        </button>
      </header>

      <div className="conversation-thread">
        {activeConversation?.messages?.length ? (
          activeConversation.messages.map((message) => (
            <ConversationMessage
              key={message.id}
              message={message}
              onDownloadDocument={onDownloadDocument}
              onDownloadImageJpg={onDownloadImageJpg}
              onDownloadImagePdf={onDownloadImagePdf}
            />
          ))
        ) : (
          <div className="empty-conversation">
            <div className="message-avatar assistant">
              <Bot size={18} />
            </div>
            <div className="message-bubble assistant welcome-bubble">
              <p>Start a conversation and I&apos;ll respond here.</p>
              <p>
                Ask normal questions, request an image, or ask for a PDF/document on any topic and I&apos;ll keep it in this chat.
              </p>
            </div>
          </div>
        )}

        {isStreaming ? (
          <div className="message-row assistant">
            <div className="message-avatar assistant">
              <Bot size={18} />
            </div>
            <div className="message-bubble assistant typing-indicator">
              <span />
              <span />
              <span />
            </div>
          </div>
        ) : null}
      </div>

      {appError ? <p className="message error">{appError}</p> : null}

      <ChatComposer
        imageUsage={imageUsage}
        isSubmitting={isSubmitting}
        isStreaming={isStreaming}
        prompt={prompt}
        onPromptChange={onPromptChange}
        onSubmit={onSubmit}
        onStopStreaming={onStopStreaming}
      />
    </section>
  );
}

export default ConversationView;
