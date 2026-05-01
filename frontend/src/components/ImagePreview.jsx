import { Download, FileText } from 'lucide-react';

function ImagePreview({
  imageResult,
  imageResultError,
  imageUsage,
  isDownloading,
  onImageLoadError,
  onDownloadJpg,
  onDownloadPdf
}) {
  return (
    <div className="result-panel image-result-panel">
      <div className="result-header">
        <strong>Latest image</strong>
        <span>
          {imageUsage.remaining} of {imageUsage.limit} remaining today
        </span>
      </div>
      {imageResult ? (
        <div className="image-preview-shell">
          <img
            alt="Generated result"
            className="generated-image"
            src={imageResult}
            onError={onImageLoadError}
          />

          <div className="download-row">
            <button
              className="secondary-button"
              type="button"
              disabled={isDownloading}
              onClick={onDownloadJpg}
            >
              <Download size={16} />
              {isDownloading === 'jpg' ? 'Preparing JPG...' : 'Download JPG'}
            </button>
            <button
              className="secondary-button"
              type="button"
              disabled={isDownloading}
              onClick={onDownloadPdf}
            >
              <FileText size={16} />
              {isDownloading === 'pdf' ? 'Preparing PDF...' : 'Download PDF'}
            </button>
          </div>

          {imageResultError ? <p className="message error">{imageResultError}</p> : null}
        </div>
      ) : (
        <p>Your rendered image will appear here.</p>
      )}
    </div>
  );
}

export default ImagePreview;
