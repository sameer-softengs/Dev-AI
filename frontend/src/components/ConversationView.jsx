import { Bot, Sparkles } from 'lucide-react';
import { useEffect, useRef } from 'react';
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
  const threadRef = useRef(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [activeConversation?.messages?.length, isStreaming]);

  const messages = activeConversation?.messages || [];
  const visibleMessages = messages.filter(
    (message) => !(message.role === 'assistant' && !message.content)
  );

  const showWelcome = visibleMessages.length === 0 && !isStreaming;

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

      <div className="conversation-thread" ref={threadRef}>
        {showWelcome ? (
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
        ) : null}

        {visibleMessages.map((message, index) => {
          const isLastAssistant = message.role === 'assistant' && index === visibleMessages.length - 1;
          return (
            <ConversationMessage
              key={message.id}
              message={message}
              isStreaming={isStreaming && isLastAssistant}
              onDownloadDocument={onDownloadDocument}
              onDownloadImageJpg={onDownloadImageJpg}
              onDownloadImagePdf={onDownloadImagePdf}
            />
          );
        })}

        {isStreaming ? (
          <div className="message-row assistant streaming-entry">
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

        <div ref={bottomRef} />
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
