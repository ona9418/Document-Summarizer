import { useState, useEffect, useCallback, type ChangeEvent } from 'react'
import Login from './Login'
import './App.css'

const BACKEND_URL = "http://localhost:8000"; 

interface HistoryItem {
    filename: string;
    summary: string | null;
    status: string;
    upload_time: string;
    download_url?: string;
}

const App = () => {
    // --- AUTH STATE ---
    const [userId, setUserId] = useState<string | null>(null); 
    
    // --- APP STATE ---
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [lengthMode, setLengthMode] = useState('medium');
    const [uploadStatus, setUploadStatus] = useState('1. Select a document.');
    const [summarizeStatus, setSummarizeStatus] = useState('');
    const [finalSummary, setFinalSummary] = useState('');
    const [uploadedDocumentPath, setUploadedDocumentPath] = useState<string | null>(null);
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [activeTab, setActiveTab] = useState<'new' | 'history'>('new');
    
    const supportedFileTypes = "application/pdf, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document, image/png, image/jpeg, text/plain";

    const fetchHistory = useCallback(async () => {
        if (!userId) return;
        try {
            const res = await fetch(`${BACKEND_URL}/history/${userId}`);
            if (res.ok) {
                const data = await res.json();
                setHistory(data.history);
            }
        } catch (error) {
            console.error("Failed to fetch history", error);
        }
    }, [userId]);

    useEffect(() => {
        if (userId && activeTab === 'history') fetchHistory();
    }, [activeTab, fetchHistory, userId]);

    const handleLogout = () => {
        setUserId(null);
        setHistory([]);
        setFinalSummary('');
        setUploadStatus('1. Select a document.');
    };

    if (!userId) {
        return <Login onLogin={(id) => setUserId(id)} />;
    }

    const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (files && files.length > 0) {
            setSelectedFile(files[0]);
            setFinalSummary('');
            setUploadStatus(`File selected: ${files[0].name}. Click 'Upload to Cloud Storage'.`);
            setSummarizeStatus('');
            setUploadedDocumentPath(null); 
        }
    };

    const handleUpload = async () => {
        if (!selectedFile) return;
        setUploadStatus('Uploading file...');
        
        const formData = new FormData();
        formData.append('document', selectedFile);
        formData.append('user_id', userId);
        
        try {
            const response = await fetch(`${BACKEND_URL}/upload-document`, {
                method: 'POST',
                body: formData,
            });

            if (response.ok) {
                const data = await response.json();
                setUploadedDocumentPath(data.documentId); 
                setUploadStatus(`Upload complete. Select Length & click 'Generate Summary'.`);
            } else {
                const errorData = await response.json();
                setUploadStatus(`Upload FAILED: ${errorData.detail || errorData.message}`);
            }
        } catch (error) {
            let errorMessage = "Unknown network error.";
            if (error instanceof Error) errorMessage = error.message;
            setUploadStatus(`Network FAILED: ${errorMessage}.`);
        }
    };

    const handleSummarize = async () => {
        if (!uploadedDocumentPath) {
             setSummarizeStatus('Error: Please upload a file first.');
             return; 
        }

        setSummarizeStatus('Running OCR and generating summary...');
        setFinalSummary('');
        
        const formData = new FormData();
        formData.append('document_id', uploadedDocumentPath); 
        formData.append('length_mode', lengthMode);

        try {
            const response = await fetch(`${BACKEND_URL}/summarize`, {
                method: 'POST',
                body: formData, 
            });

            if (response.ok) {
                const data = await response.json();
                setFinalSummary(data.summary);
                setSummarizeStatus(`Success! Summary generated for "${data.documentName}".`);
                setUploadedDocumentPath(null); 
                setSelectedFile(null); 
            } else {
                const errorData = await response.json();
                setSummarizeStatus(`Summarization FAILED: ${errorData.detail || errorData.message}`);
            }
        } catch (error) {
            let errorMessage = "Network error";
            if (error instanceof Error) errorMessage = error.message;
            setSummarizeStatus(`Error: ${errorMessage}.`);
        }
    };
    
    const statusClass = (uploadStatus.includes('FAILED') || summarizeStatus.includes('FAILED')) 
        ? "status-text status-error" 
        : "status-text";

    return (
        <div className="prototype-container">
            <div className="header-row">
                <h2>Cloud Document Summarizer</h2>
                <button onClick={handleLogout} className="logout-button">Logout</button>
            </div>
            
            <div className="nav-container">
                <button 
                    className={`nav-button ${activeTab === 'new' ? 'active' : ''}`}
                    onClick={() => setActiveTab('new')}
                    title="Switch to New Summary tab"
                >
                    New Summary
                </button>
                <button 
                    className={`nav-button ${activeTab === 'history' ? 'active' : ''}`}
                    onClick={() => setActiveTab('history')}
                    title="Switch to History tab"
                >
                    History
                </button>
            </div>

            <div className="auth-container">
                <span>Logged in as: <strong>{userId}</strong></span>
            </div>

            {activeTab === 'new' && (
                <>
                    <div className="step-group">
                        <label htmlFor="document-file">1. Select Document</label>
                        <input type="file" id="document-file" accept={supportedFileTypes} onChange={handleFileChange} title="Choose a file to upload"/>
                    </div>

                    <div className="step-group">
                        <button 
                            onClick={handleUpload} 
                            disabled={!selectedFile || uploadedDocumentPath !== null || uploadStatus.includes('Uploading')}
                            id="upload-button"
                            title="Upload selected file to the cloud"
                        >
                            {uploadStatus.includes('Uploading') ? 'Uploading...' : 'Upload to Cloud Storage'}
                        </button>
                    </div>
                    <p className={statusClass}>{uploadStatus}</p>

                    <hr className="divider"/>

                    <div className="step-group">
                        <label htmlFor="length-mode">2. Summary Length</label>
                        <select 
                            id="length-mode"
                            className="length-select"
                            value={lengthMode} 
                            onChange={(e) => setLengthMode(e.target.value)}
                            title="Select the desired length of the summary"
                        >
                            <option value="short">Short (Executive Summary)</option>
                            <option value="medium">Medium (Standard)</option>
                            <option value="long">Long (Detailed)</option>
                        </select>
                        
                        <button 
                            onClick={handleSummarize} 
                            disabled={!uploadedDocumentPath || summarizeStatus.includes('Running')}
                            id="summarize-button"
                            title="Generate a summary for the uploaded document"
                        >
                            {summarizeStatus.includes('Running') ? 'Generating...' : 'Generate Summary (OCR + AI)'}
                        </button>
                    </div>
                    
                    <p className={statusClass}>{summarizeStatus}</p>

                    {finalSummary && (
                        <div className="summary-output">
                            <h3>Generated Summary</h3>
                            <pre className="summary-text-area">{finalSummary}</pre>
                        </div>
                    )}
                </>
            )}

            {activeTab === 'history' && (
                <div className="history-container">
                    <h3>Previous Summaries</h3>
                    {history.length === 0 ? <p>No history found for this user.</p> : (
                        <ul className="history-list">
                            {history.map((item, idx) => (
                                <li key={idx} className="history-item">
                                    <div className="history-header">
                                        <div className="filename-container">
                                            <strong>{item.filename}</strong>
                                            {item.download_url && (
                                                <a 
                                                    href={item.download_url} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="download-link"
                                                    title="Download Original File"
                                                >
                                                    ⬇ Download
                                                </a>
                                            )}
                                        </div>
                                        <span className="history-date">{new Date(item.upload_time).toLocaleString()}</span>
                                    </div>
                                    <div className="history-summary">
                                        {item.summary || "Processing or Failed..."}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}
        </div>
    );
};

export default App;