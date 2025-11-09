import React, { useState, useEffect } from 'react';

interface ApiResponse {
  success: boolean;
  data?: {
    jobId: string;
    summary: string;
    exports: {
      md: string;
      txt: string;
      pdf: string;
      docx: string;
    };
  };
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export default function Home() {
  const [examFiles, setExamFiles] = useState<FileList | null>(null);
  const [textbookFile, setTextbookFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<string>('');
  const [summary, setSummary] = useState<string | null>(null);
  const [exports, setExports] = useState<ApiResponse['data']['exports'] | null>(null);
  const [error, setError] = useState('');
  const [result, setResult] = useState<any>(null);
  const [isOnline, setIsOnline] = useState(true);

  // Feedback form state
  const [feedbackData, setFeedbackData] = useState({
    name: '',
    email: '',
    rating: 5,
    comment: '',
  });
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);

  // Track page view on mount
  useEffect(() => {
    // Track page view
    fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'pageview' }),
    }).catch(() => {
      // Silent fail - analytics shouldn't break the app
    });
  }, []);

  // Check online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Validate files before upload
  const validateFiles = (): string | null => {
    if (!examFiles || examFiles.length === 0) {
      return 'Please upload at least one exam paper';
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/jpg', 'image/png'];

    // Check exam files
    for (let i = 0; i < examFiles.length; i++) {
      const file = examFiles[i];
      if (file.size > maxSize) {
        return `File "${file.name}" is too large. Maximum size is 10MB.`;
      }
      if (!allowedTypes.includes(file.type) && !file.name.match(/\.(pdf|docx|jpg|jpeg|png)$/i)) {
        return `File "${file.name}" has an unsupported format. Please use PDF, DOCX, JPG, or PNG.`;
      }
    }

    // Check textbook file
    if (textbookFile) {
      if (textbookFile.size > maxSize) {
        return `Textbook file is too large. Maximum size is 10MB.`;
      }
      if (!textbookFile.type.includes('pdf') && !textbookFile.name.endsWith('.pdf')) {
        return 'Textbook must be a PDF file.';
      }
    }

    return null;
  };

  const handleUpload = async () => {
    // Reset states
    setError(null);
    setSummary(null);
    setExports(null);
    setCopySuccess(false);

    // Check online status
    if (!isOnline) {
      setError('You are currently offline. Please check your internet connection.');
      return;
    }

    // Validate files
    const validationError = validateFiles();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setProgress('Uploading files...');

    try {
      const formData = new FormData();
      
      if (examFiles) {
        for (let i = 0; i < examFiles.length; i++) {
          formData.append('examFiles', examFiles[i]);
        }
      }
      
      if (textbookFile) {
        formData.append('textbook', textbookFile);
      }

      setProgress('Processing your files...');
      
      const res = await fetch('/api/process', { 
        method: 'POST', 
        body: formData,
      });

      const data: ApiResponse = await res.json();

      if (!data.success) {
        throw new Error(data.error?.message || 'Failed to process files');
      }

      setProgress('Generating summary...');
      setSummary(data.data?.summary || '');
      setExports(data.data?.exports || null);
      setProgress('Complete!');
      
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message || 'An error occurred while processing your files. Please try again.');
    } finally {
      setLoading(false);
      setProgress('');
    }
  };

  const handleCopy = async () => {
    if (!summary) return;
    
    try {
      await navigator.clipboard.writeText(summary);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 3000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleDownload = (url: string) => {
    window.open(url, '_blank');
  };

  const handleReset = () => {
    setExamFiles(null);
    setTextbookFile(null);
    setSummary(null);
    setExports(null);
    setError(null);
    setCopySuccess(false);
    // Reset file inputs
    const examInput = document.getElementById('examFiles') as HTMLInputElement;
    const textbookInput = document.getElementById('textbook') as HTMLInputElement;
    if (examInput) examInput.value = '';
    if (textbookInput) textbookInput.value = '';
  };

  const handleFeedbackSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFeedbackSubmitting(true);
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(feedbackData),
      });
      const data = await res.json();
      if (data.success) {
        setFeedbackMessage('✅ Thank you for your feedback!');
        setTimeout(() => setFeedbackMessage(''), 3000);
        setFeedbackData({
          name: '',
          email: '',
          rating: 5,
          comment: '',
        });
      } else {
        setFeedbackMessage('Error sending feedback. Please try again.');
      }
    } catch (err) {
      console.error('Error sending feedback:', err);
      setFeedbackMessage('Error sending feedback. Please try again.');
    } finally {
      setFeedbackSubmitting(false);
    }
  };

  return (
    <div className="container py-4 py-md-5">
      {/* Online/Offline indicator */}
      {!isOnline && (
        <div className="glass-alert glass-alert-warning mb-4">
          <i className="bi bi-wifi-off me-2"></i>
          <strong>No Internet Connection</strong> - Please check your connection to upload files.
        </div>
      )}

      <header className="text-center mb-4 mb-md-5">
        <h1 className="fw-bold display-5 mb-3 neon-header">🎓 MANEB Exam Prep AI</h1>
        <p className="lead mb-2" style={{color: '#d1d5db'}}>Transform past papers into powerful revision notes</p>
        <p className="small" style={{color: '#9ca3af'}}>Upload exam papers and textbooks • Get AI-powered summaries • Download in multiple formats</p>
      </header>

      {/* Error Alert */}
      {error && (
        <div className="glass-alert glass-alert-danger mb-4">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          <strong>Error:</strong> {error}
          <button type="button" className="btn btn-sm float-end" style={{background: 'transparent', border: 'none', color: '#9ca3af'}} onClick={() => setError(null)}>✕</button>
        </div>
      )}

      {/* File Upload Section */}
      {!summary && (
        <div className="row g-3 g-md-4 mb-4">
          <div className="col-12 col-lg-6">
            <div className="glass-card h-100">
              <div className="p-4">
                <div className="d-flex align-items-center mb-3">
                  <i className="bi bi-file-earmark-pdf text-primary fs-3 me-3"></i>
                  <div>
                    <h5 className="card-title mb-1">Exam Papers</h5>
                    <p className="card-text text-muted small mb-0">Upload up to 10 files (PDF, DOCX, or images)</p>
                  </div>
                </div>
                <input 
                  id="examFiles"
                  type="file" 
                  className="neon-input"
                  multiple 
                  accept=".pdf,.docx,.jpg,.jpeg,.png"
                  onChange={(e) => setExamFiles(e.target.files)}
                  disabled={loading}
                />
                {examFiles && examFiles.length > 0 && (
                  <div className="mt-2">
                    <small className="text-neon-cyan">
                      <i className="bi bi-check-circle me-1"></i>
                      {examFiles.length} file{examFiles.length > 1 ? 's' : ''} selected
                    </small>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="col-12 col-lg-6">
            <div className="glass-card h-100">
              <div className="p-4">
                <div className="d-flex align-items-center mb-3">
                  <i className="bi bi-book text-success fs-3 me-3"></i>
                  <div>
                    <h5 className="card-title mb-1">Textbook / Syllabus <span className="badge bg-secondary">Optional</span></h5>
                    <p className="card-text text-muted small mb-0">Upload your subject textbook (PDF only)</p>
                  </div>
                </div>
                <input 
                  id="textbook"
                  type="file" 
                  className="neon-input"
                  accept=".pdf" 
                  onChange={(e) => setTextbookFile(e.target.files?.[0] || null)}
                  disabled={loading}
                />
                {textbookFile && (
                  <div className="mt-2">
                    <small className="text-neon-cyan">
                      <i className="bi bi-check-circle me-1"></i>
                      {textbookFile.name}
                    </small>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {!summary && (
        <div className="text-center mb-5">
          <button 
            className="btn-neon pulse-glow"
            onClick={handleUpload} 
            disabled={loading || !isOnline || !examFiles || examFiles.length === 0}
            style={{opacity: (loading || !isOnline || !examFiles || examFiles.length === 0) ? 0.5 : 1}}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                {progress || 'Processing...'}
              </>
            ) : (
              <>
                <i className="bi bi-magic me-2"></i>
                Generate Exam Prep Notes
              </>
            )}
          </button>
          {loading && (
            <div className="mt-3">
              <div className="neon-progress">
                <div className="neon-progress-bar" style={{ width: '100%' }}></div>
              </div>
              <p className="small mt-2" style={{color: '#9ca3af'}}>This may take 30-60 seconds depending on file size...</p>
            </div>
          )}
        </div>
      )}

      {/* Results Section */}
      {summary && (
        <div className="glass-card mb-4">
          <div className="p-3" style={{background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(6, 182, 212, 0.2))', borderRadius: '20px 20px 0 0'}}>
            <div className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">
                <i className="bi bi-check-circle-fill me-2"></i>
                Your Exam Prep Summary
              </h5>
              <button className="btn btn-sm neon-download" onClick={handleReset}>
                <i className="bi bi-arrow-left me-1"></i> New Summary
              </button>
            </div>
          </div>
          <div className="p-4">
            <div className="summary-content mb-4" style={{ 
              maxHeight: '400px', 
              overflowY: 'auto',
              background: 'rgba(0, 0, 0, 0.2)',
              padding: '1.5rem',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <pre style={{ 
                whiteSpace: 'pre-wrap', 
                fontFamily: 'inherit',
                fontSize: '0.95rem',
                lineHeight: '1.6',
                margin: 0
              }}>{summary}</pre>
            </div>

            {/* Action Buttons */}
            <div className="row g-2 mb-3">
              <div className="col-6 col-md-3">
                <button 
                  className="neon-download w-100"
                  onClick={handleCopy}
                >
                  <i className="bi bi-clipboard me-2"></i>
                  {copySuccess ? 'Copied!' : 'Copy'}
                </button>
              </div>
              {exports && (
                <>
                  <div className="col-6 col-md-3">
                    <button 
                      className="neon-download pdf w-100"
                      onClick={() => handleDownload(exports.pdf)}
                    >
                      <i className="bi bi-file-pdf me-2"></i>
                      PDF
                    </button>
                  </div>
                  <div className="col-6 col-md-3">
                    <button 
                      className="neon-download word w-100"
                      onClick={() => handleDownload(exports.docx)}
                    >
                      <i className="bi bi-file-word me-2"></i>
                      Word
                    </button>
                  </div>
                  <div className="col-6 col-md-3">
                    <button 
                      className="neon-download text w-100"
                      onClick={() => handleDownload(exports.txt)}
                    >
                      <i className="bi bi-file-text me-2"></i>
                      Text
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Share tip */}
            <div className="glass-alert d-flex align-items-start mb-0">
              <i className="bi bi-info-circle-fill me-2 mt-1"></i>
              <small>
                <strong>Tip:</strong> Download and share these notes with your classmates to study together!
              </small>
            </div>
          </div>
        </div>
      )}

      {/* Feedback Section */}
      {summary && (
        <section className="glass-card mb-4">
          <div className="p-3" style={{background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.2), rgba(236, 72, 153, 0.2))', borderRadius: '20px 20px 0 0'}}>
            <h5 className="mb-0">
              <i className="bi bi-chat-left-text me-2"></i>
              📝 Share Your Feedback
            </h5>
          </div>
          <div className="p-4">
            <p className="mb-4" style={{color: '#9ca3af'}}>Help us improve! Tell us about your experience with these revision notes.</p>
            <form onSubmit={handleFeedbackSubmit}>
              <div className="row g-3">
                <div className="col-md-6">
                  <input
                    type="text"
                    className="neon-input"
                    placeholder="Your Name *"
                    value={feedbackData.name}
                    onChange={(e) => setFeedbackData({ ...feedbackData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="col-md-6">
                  <input
                    type="email"
                    className="neon-input"
                    placeholder="Your Email (optional)"
                    value={feedbackData.email}
                    onChange={(e) => setFeedbackData({ ...feedbackData, email: e.target.value })}
                  />
                </div>
                <div className="col-12">
                  <label className="form-label fw-bold">⭐ Rate your experience:</label>
                  <div className="neon-rating btn-group w-100" role="group">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        className={`btn ${feedbackData.rating === star ? 'active' : ''}`}
                        onClick={() => setFeedbackData({ ...feedbackData, rating: star })}
                      >
                        {'⭐'.repeat(star)}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="col-12">
                  <textarea
                    className="neon-input"
                    rows={4}
                    placeholder="Tell us about your experience... What did you like? What can we improve? *"
                    value={feedbackData.comment}
                    onChange={(e) => setFeedbackData({ ...feedbackData, comment: e.target.value })}
                    required
                    minLength={10}
                    style={{width: '100%'}}
                  />
                </div>
                <div className="col-12">
                  <button
                    type="submit"
                    className="btn-neon w-100"
                    disabled={feedbackSubmitting}
                    style={{opacity: feedbackSubmitting ? 0.5 : 1}}
                  >
                    {feedbackSubmitting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" />
                        Sending feedback...
                      </>
                    ) : (
                      <>📤 Send Feedback</>
                    )}
                  </button>
                </div>
                {feedbackMessage && (
                  <div className={`col-12 glass-alert ${feedbackMessage.includes('✅') ? 'glass-alert-success' : 'glass-alert-danger'}`}>
                    {feedbackMessage}
                  </div>
                )}
              </div>
            </form>
            
            <div className="mt-4 p-3 glass-alert">
              <h6 className="mb-3">
                <i className="bi bi-chat-dots-fill me-2"></i>
                Or reach us directly:
              </h6>
              <div className="d-flex flex-wrap gap-2">
                <a
                  href="mailto:ylikagwa@gmail.com"
                  className="neon-download"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <i className="bi bi-envelope-fill me-2"></i>
                  ylikagwa@gmail.com
                </a>
                <a
                  href="https://wa.me/265880646248?text=Hi!%20I%20have%20feedback%20about%20MANEB%20Exam%20Prep%20AI"
                  className="neon-download"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{textDecoration: 'none'}}
                >
                  <i className="bi bi-whatsapp me-2"></i>
                  WhatsApp: +265 88 064 6248
                </a>
                <a
                  href="tel:+265880646248"
                  className="neon-download"
                  style={{textDecoration: 'none'}}
                >
                  <i className="bi bi-telephone-fill me-2"></i>
                  Call Us
                </a>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Features Section */}
      {!summary && !loading && (
        <div className="row g-4 text-center mt-5">
          <div className="col-md-4">
            <div className="glass-card p-4">
              <i className="bi bi-lightning-charge icon-neon fs-1 mb-3" style={{color: '#fbbf24'}}></i>
              <h5>Fast Processing</h5>
              <p className="small" style={{color: '#9ca3af'}}>Get your revision notes in under a minute</p>
            </div>
          </div>
          <div className="col-md-4">
            <div className="glass-card p-4">
              <i className="bi bi-shield-check icon-neon fs-1 mb-3" style={{color: '#10b981'}}></i>
              <h5>Secure & Private</h5>
              <p className="small" style={{color: '#9ca3af'}}>Your files are automatically deleted after 24 hours</p>
            </div>
          </div>
          <div className="col-md-4">
            <div className="glass-card p-4">
              <i className="bi bi-phone icon-neon fs-1 mb-3" style={{color: '#3b82f6'}}></i>
              <h5>Mobile Friendly</h5>
              <p className="small" style={{color: '#9ca3af'}}>Works perfectly on your phone or tablet</p>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="text-center small mt-5 pt-4" style={{color: '#6b7280', borderTop: '1px solid rgba(255, 255, 255, 0.1)'}}>
        <p className="mb-1">Made for MANEB students across Malawi 🇲🇼</p>
        <p className="mb-2 fw-bold" style={{color: '#a855f7', textShadow: '0 0 10px rgba(168, 85, 247, 0.5)'}}>
          Powered by Fatty AI Ed-Tech
        </p>
        <div className="mt-3 d-flex justify-content-center gap-4 flex-wrap">
          <a href="mailto:ylikagwa@gmail.com" className="text-neon-cyan text-decoration-none">
            <i className="bi bi-envelope-fill me-2"></i>
            ylikagwa@gmail.com
          </a>
          <a href="https://wa.me/265880646248" target="_blank" rel="noopener noreferrer" className="text-neon-green text-decoration-none">
            <i className="bi bi-whatsapp me-2"></i>
            +265 88 064 6248
          </a>
          <a href="tel:+265880646248" className="text-neon-pink text-decoration-none">
            <i className="bi bi-telephone-fill me-2"></i>
            Call Us
          </a>
        </div>
      </footer>
    </div>
  );
}
