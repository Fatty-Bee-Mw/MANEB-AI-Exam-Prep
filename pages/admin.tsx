/**
 * Admin Dashboard
 * View analytics, feedback, and usage statistics
 */

import React, { useState, useEffect } from 'react';
import Head from 'next/head';

interface AnalyticsData {
  summary: {
    totalPageViews: number;
    totalUploads: number;
    totalDownloads: number;
    totalFeedback: number;
    uniqueUsers: number;
    feedbackStats: {
      total: number;
      average: number;
      percentages: { [key: number]: number };
    };
    downloadsByFormat: {
      pdf: number;
      docx: number;
      txt: number;
      md: number;
    };
  };
  feedback: {
    all: any[];
    today: number;
  };
  today: {
    uploads: number;
    downloads: number;
    feedback: number;
  };
}

export default function AdminDashboard() {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshInterval, setRefreshInterval] = useState<ReturnType<typeof setInterval> | null>(null);

  const fetchAnalytics = async (pass: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const res = await fetch('/api/admin/analytics', {
        headers: {
          'Authorization': `Bearer ${pass}`,
          'Content-Type': 'application/json',
        },
      });
      
      // Check if response is OK
      if (!res.ok) {
        if (res.status === 401) {
          throw new Error('Invalid password. Please try again.');
        }
        throw new Error(`Server error: ${res.status}`);
      }
      
      // Check if response is JSON
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('API route not found. Please check deployment.');
      }
      
      const result = await res.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to fetch analytics');
      }
      
      setData(result.data);
      setIsAuthenticated(true);
    } catch (err: any) {
      console.error('Admin fetch error:', err);
      setError(err.message || 'Failed to connect to admin API');
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    fetchAnalytics(password);
  };

  const handleRefresh = () => {
    if (isAuthenticated) {
      fetchAnalytics(password);
    }
  };

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (isAuthenticated) {
      const interval = setInterval(() => {
        fetchAnalytics(password);
      }, 30000);
      setRefreshInterval(interval);
      
      return () => {
        if (interval) clearInterval(interval);
      };
    }
  }, [isAuthenticated, password]);

  if (!isAuthenticated) {
    return (
      <div className="container">
        <Head>
          <title>Admin Login - MANEB Exam Prep AI</title>
        </Head>
        
        <div className="row justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
          <div className="col-md-4">
            <div className="glass-card">
              <div className="p-4">
                <h3 className="text-center mb-4 neon-header">🔐 Admin Login</h3>
                
                {error && (
                  <div className="glass-alert glass-alert-danger">
                    {error}
                  </div>
                )}
                
                <form onSubmit={handleLogin}>
                  <div className="mb-3">
                    <label className="form-label">Admin Password</label>
                    <input
                      type="password"
                      className="neon-input"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter admin password"
                      required
                    />
                  </div>
                  
                  <button
                    type="submit"
                    className="btn-neon w-100"
                    disabled={loading}
                    style={{opacity: loading ? 0.5 : 1}}
                  >
                    {loading ? 'Authenticating...' : 'Login'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <Head>
        <title>Admin Dashboard - MANEB Exam Prep AI</title>
      </Head>
      
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="neon-header">📊 Admin Dashboard</h2>
        <button className="neon-download" onClick={handleRefresh}>
          <i className="bi bi-arrow-clockwise me-1"></i>
          Refresh
        </button>
      </div>
      
      {loading && !data && (
        <div className="text-center py-5">
          <div className="spinner-neon" />
        </div>
      )}
      
      {data && (
        <>
          {/* Overview Stats */}
          <div className="row g-3 mb-4">
            <div className="col-md-3">
              <div className="stat-card">
                <div className="d-flex align-items-center">
                  <div className="flex-grow-1">
                    <h6 className="mb-1" style={{color: '#9ca3af'}}>Total Users</h6>
                    <h3 className="mb-0">{data.summary.uniqueUsers}</h3>
                  </div>
                  <div className="fs-1" style={{color: 'var(--neon-purple)'}}>
                    <i className="bi bi-people icon-neon"></i>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="col-md-3">
              <div className="stat-card">
                <div className="d-flex align-items-center">
                  <div className="flex-grow-1">
                    <h6 className="mb-1" style={{color: '#9ca3af'}}>Total Uploads</h6>
                    <h3 className="mb-0">{data.summary.totalUploads}</h3>
                    <small className="text-neon-cyan">+{data.today.uploads} today</small>
                  </div>
                  <div className="fs-1" style={{color: 'var(--neon-cyan)'}}>
                    <i className="bi bi-cloud-upload icon-neon"></i>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="col-md-3">
              <div className="stat-card">
                <div className="d-flex align-items-center">
                  <div className="flex-grow-1">
                    <h6 className="mb-1" style={{color: '#9ca3af'}}>Total Downloads</h6>
                    <h3 className="mb-0">{data.summary.totalDownloads}</h3>
                    <small className="text-neon-pink">+{data.today.downloads} today</small>
                  </div>
                  <div className="fs-1" style={{color: 'var(--neon-pink)'}}>
                    <i className="bi bi-download icon-neon"></i>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="col-md-3">
              <div className="stat-card">
                <div className="d-flex align-items-center">
                  <div className="flex-grow-1">
                    <h6 className="mb-1" style={{color: '#9ca3af'}}>Page Views</h6>
                    <h3 className="mb-0">{data.summary.totalPageViews}</h3>
                  </div>
                  <div className="fs-1" style={{color: '#fbbf24'}}>
                    <i className="bi bi-eye icon-neon"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Feedback Stats */}
          <div className="row g-3 mb-4">
            <div className="col-md-6">
              <div className="glass-card">
                <div className="p-3" style={{background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.2), rgba(245, 158, 11, 0.2))', borderRadius: '20px 20px 0 0'}}>
                  <h5 className="mb-0">⭐ Feedback Statistics</h5>
                </div>
                <div className="p-4">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <div>
                      <h6 className="mb-1" style={{color: '#9ca3af'}}>Total Feedback</h6>
                      <h2 className="mb-0">{data.summary.feedbackStats.total}</h2>
                    </div>
                    <div className="text-end">
                      <h6 className="mb-1" style={{color: '#9ca3af'}}>Average Rating</h6>
                      <h2 className="mb-0" style={{color: '#fbbf24'}}>
                        {data.summary.feedbackStats.average} ⭐
                      </h2>
                    </div>
                  </div>
                  
                  <hr style={{borderColor: 'rgba(255, 255, 255, 0.1)'}} />
                  
                  <h6 className="mb-3">Rating Distribution</h6>
                  {[5, 4, 3, 2, 1].map((rating) => {
                    const percentage = data.summary.feedbackStats.percentages[rating] || 0;
                    return (
                      <div key={rating} className="mb-2">
                        <div className="d-flex justify-content-between mb-1">
                          <span>{'⭐'.repeat(rating)}</span>
                          <span className="fw-bold">{percentage}%</span>
                        </div>
                        <div className="neon-progress">
                          <div
                            className="neon-progress-bar"
                            style={{ width: `${percentage}%`, background: rating >= 4 ? 'linear-gradient(90deg, var(--neon-green), var(--neon-cyan))' : rating === 3 ? 'linear-gradient(90deg, #f59e0b, #fbbf24)' : 'linear-gradient(90deg, var(--neon-pink), #ef4444)' }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            
            <div className="col-md-6">
              <div className="glass-card">
                <div className="p-3" style={{background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.2), rgba(6, 182, 212, 0.2))', borderRadius: '20px 20px 0 0'}}>
                  <h5 className="mb-0">📈 Today's Activity</h5>
                </div>
                <div className="p-4">
                  <div className="list-group list-group-flush" style={{background: 'transparent', border: 'none'}}>
                    <div className="list-group-item d-flex justify-content-between align-items-center" style={{background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '8px', marginBottom: '8px'}}>
                      <span><i className="bi bi-cloud-upload me-2" style={{color: 'var(--neon-green)'}}></i> Uploads</span>
                      <span className="badge-neon" style={{background: 'linear-gradient(135deg, var(--neon-green), var(--neon-cyan)'}}>{data.today.uploads}</span>
                    </div>
                    <div className="list-group-item d-flex justify-content-between align-items-center" style={{background: 'rgba(6, 182, 212, 0.1)', border: '1px solid rgba(6, 182, 212, 0.2)', borderRadius: '8px', marginBottom: '8px'}}>
                      <span><i className="bi bi-download me-2" style={{color: 'var(--neon-cyan)'}}></i> Downloads</span>
                      <span className="badge-neon" style={{background: 'linear-gradient(135deg, var(--neon-cyan), var(--neon-blue)'}}>{data.today.downloads}</span>
                    </div>
                    <div className="list-group-item d-flex justify-content-between align-items-center" style={{background: 'rgba(251, 191, 36, 0.1)', border: '1px solid rgba(251, 191, 36, 0.2)', borderRadius: '8px'}}>
                      <span><i className="bi bi-chat-left-text me-2" style={{color: '#fbbf24'}}></i> Feedback</span>
                      <span className="badge-neon" style={{background: 'linear-gradient(135deg, #f59e0b, #fbbf24)'}}>{data.today.feedback}</span>
                    </div>
                  </div>
                  
                  <div className="mt-3 p-3 glass-alert">
                    <small>
                      <i className="bi bi-info-circle me-1"></i>
                      Auto-refreshes every 30 seconds
                    </small>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Download Breakdown by Format */}
          <div className="glass-card mb-4">
            <div className="p-3" style={{background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(6, 182, 212, 0.2))', borderRadius: '20px 20px 0 0'}}>
              <h5 className="mb-0">
                <i className="bi bi-download me-2"></i>
                Downloads by Format
              </h5>
            </div>
            <div className="p-4">
              <div className="row g-3">
                <div className="col-6 col-md-3">
                  <div className="text-center p-3" style={{background: 'rgba(239, 68, 68, 0.1)', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.2)'}}>
                    <i className="bi bi-file-pdf fs-1 mb-2" style={{color: '#ef4444'}}></i>
                    <h3 className="mb-1">{data.summary.downloadsByFormat.pdf}</h3>
                    <small style={{color: '#9ca3af'}}>PDF Downloads</small>
                  </div>
                </div>
                <div className="col-6 col-md-3">
                  <div className="text-center p-3" style={{background: 'rgba(59, 130, 246, 0.1)', borderRadius: '12px', border: '1px solid rgba(59, 130, 246, 0.2)'}}>
                    <i className="bi bi-file-word fs-1 mb-2" style={{color: '#3b82f6'}}></i>
                    <h3 className="mb-1">{data.summary.downloadsByFormat.docx}</h3>
                    <small style={{color: '#9ca3af'}}>Word Downloads</small>
                  </div>
                </div>
                <div className="col-6 col-md-3">
                  <div className="text-center p-3" style={{background: 'rgba(16, 185, 129, 0.1)', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.2)'}}>
                    <i className="bi bi-file-text fs-1 mb-2" style={{color: '#10b981'}}></i>
                    <h3 className="mb-1">{data.summary.downloadsByFormat.txt}</h3>
                    <small style={{color: '#9ca3af'}}>Text Downloads</small>
                  </div>
                </div>
                <div className="col-6 col-md-3">
                  <div className="text-center p-3" style={{background: 'rgba(168, 85, 247, 0.1)', borderRadius: '12px', border: '1px solid rgba(168, 85, 247, 0.2)'}}>
                    <i className="bi bi-markdown fs-1 mb-2" style={{color: '#a855f7'}}></i>
                    <h3 className="mb-1">{data.summary.downloadsByFormat.md}</h3>
                    <small style={{color: '#9ca3af'}}>Markdown Downloads</small>
                  </div>
                </div>
              </div>
              
              <div className="mt-3 p-3 glass-alert">
                <small>
                  <i className="bi bi-info-circle me-1"></i>
                  Most popular format: <strong>
                    {Object.entries(data.summary.downloadsByFormat).sort((a, b) => b[1] - a[1])[0][0].toUpperCase()}
                  </strong> with {Object.entries(data.summary.downloadsByFormat).sort((a, b) => b[1] - a[1])[0][1]} downloads
                </small>
              </div>
            </div>
          </div>
          
          {/* Recent Feedback */}
          <div className="glass-card">
            <div className="p-3" style={{background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.2), rgba(168, 85, 247, 0.2))', borderRadius: '20px 20px 0 0'}}>
              <h5 className="mb-0">💬 Recent Feedback</h5>
            </div>
            <div className="p-4">
              {data.feedback.all.length === 0 ? (
                <p className="text-center py-3" style={{color: '#9ca3af'}}>No feedback received yet</p>
              ) : (
                <div className="table-responsive">
                  <table className="glass-table table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Name</th>
                        <th>Rating</th>
                        <th>Comment</th>
                        <th>Email</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.feedback.all.slice().reverse().map((feedback, index) => (
                        <tr key={index}>
                          <td className="text-nowrap">
                            <small>{new Date(feedback.timestamp || feedback.savedAt).toLocaleString()}</small>
                          </td>
                          <td>{feedback.name}</td>
                          <td>
                            <span className="badge bg-warning">
                              {feedback.rating} ⭐
                            </span>
                          </td>
                          <td>
                            <small>{feedback.comment.substring(0, 100)}
                              {feedback.comment.length > 100 && '...'}
                            </small>
                          </td>
                          <td>
                            <small className="text-muted">
                              {feedback.email || 'Not provided'}
                            </small>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
