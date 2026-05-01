import { Image as ImageIcon, Sparkles } from 'lucide-react';
import ImagePreview from './ImagePreview';

function ImagePanel({
  imagePrompt,
  imageResult,
  imageResultError,
  imageUsage,
  isImageLoading,
  isDownloading,
  onImagePromptChange,
  onSubmit,
  onImageLoadError,
  onDownloadJpg,
  onDownloadPdf
}) {
  return (
    <section className="tool-card">
      <div className="tool-heading">
        <div>
          <p className="section-tag">Image generation</p>
          <h3>Create visuals with account safeguards</h3>
        </div>
        <ImageIcon size={20} />
      </div>

      <form className="tool-form" onSubmit={onSubmit}>
        <label>
          <span>Image prompt</span>
          <textarea
            value={imagePrompt}
            onChange={(event) => onImagePromptChange(event.target.value)}
            placeholder="Describe a product shot, dashboard mockup, or concept art scene"
            rows={5}
            required
          />
        </label>

        <button
          className="primary-button"
          type="submit"
          disabled={isImageLoading || !imagePrompt.trim() || imageUsage.remaining <= 0}
        >
          <Sparkles size={16} />
          {isImageLoading ? 'Rendering...' : 'Generate image'}
        </button>
      </form>

      <ImagePreview
        imageResult={imageResult}
        imageResultError={imageResultError}
        imageUsage={imageUsage}
        isDownloading={isDownloading}
        onImageLoadError={onImageLoadError}
        onDownloadJpg={onDownloadJpg}
        onDownloadPdf={onDownloadPdf}
      />
    </section>
  );
}

export default ImagePanel;
