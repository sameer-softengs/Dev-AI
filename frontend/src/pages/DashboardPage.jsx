import { useState } from 'react';
import ChatSidebar from '../components/ChatSidebar';
import ConversationView from '../components/ConversationView';

function DashboardPage({
  activeConversation,
  activeConversationId,
  appError,
  conversations,
  imageUsage,
  isSubmitting,
  isStreaming,
  messageInput,
  onCreateConversation,
  onDeleteConversation,
  onDownloadDocument,
  onDownloadImageJpg,
  onDownloadImagePdf,
  onLogout,
  onMessageInputChange,
  onSelectConversation,
  onSubmitMessage,
  onStopStreaming,
  user
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className={`chat-layout ${isSidebarOpen ? '' : 'sidebar-collapsed'}`}>
      <ChatSidebar
        activeConversationId={activeConversationId}
        conversations={conversations}
        onCreateConversation={onCreateConversation}
        onDeleteConversation={onDeleteConversation}
        onLogout={onLogout}
        onSelectConversation={onSelectConversation}
        onToggleSidebar={() => setIsSidebarOpen((current) => !current)}
        isSidebarOpen={isSidebarOpen}
        user={user}
      />

      <main className="conversation-main">
        <ConversationView
          activeConversation={activeConversation}
          appError={appError}
          imageUsage={imageUsage}
          isSubmitting={isSubmitting}
          isStreaming={isStreaming}
          prompt={messageInput}
          onDownloadDocument={onDownloadDocument}
          onDownloadImageJpg={onDownloadImageJpg}
          onDownloadImagePdf={onDownloadImagePdf}
          onPromptChange={onMessageInputChange}
          onSubmit={onSubmitMessage}
          onStopStreaming={onStopStreaming}
        />
      </main>
    </div>
  );
}

export default DashboardPage;
