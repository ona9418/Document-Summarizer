import { useState } from 'react'
import './App.css'; // Import the external CSS file

// --- Global variables provided by the environment ---
// Set to your expected backend API endpoint (e.g., Cloud Run URL).
const BACKEND_URL = "http://localhost:8000"; 
// ---

const App = () => {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploadStatus, setUploadStatus] = useState('1. Select a document (PDF, DOCX, JPG, PNG, TXT).');
    const [summarizeStatus, setSummarizeStatus] = useState('');
    const [finalSummary, setFinalSummary] = useState('');
    const [uploadedDocumentPath, setUploadedDocumentPath] = useState<string | null>(null);
    
    const supportedFileTypes = "application/pdf, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document, image/png, image/jpeg, text/plain";

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (files && files.length > 0) {
            setSelectedFile(files[0]);
            setFinalSummary('');
            setUploadStatus(`File selected: ${files[0].name}. Click 'Upload File'.`);
            setSummarizeStatus('');
            setUploadedDocumentPath(null); 
        }
    };

    // 1. Handles uploading to GCS
    const handleUpload = async () => {
        if (!selectedFile) return;

        setUploadStatus('Uploading...');
        setSummarizeStatus('');
        setUploadedDocumentPath(null);

        const formData = new FormData();
        formData.append('document', selectedFile);
        
        try {
            const response = await fetch(`${BACKEND_URL}/upload-document`, {
                method: 'POST',
                body: formData,
            });

            if (response.ok) {
                const data = await response.json();
                setUploadedDocumentPath(data.documentId); 
                setUploadStatus(`Upload complete. Document ID: ${data.documentId}. Click 'Summarize'.`);
            } else {
                const errorData = await response.json();
                setUploadStatus(`Upload FAILED: ${errorData.detail || errorData.message}`);
            }
        } catch (error) {
            let errorMessage = "Unknown network error.";
            if (error instanceof Error) {
                errorMessage = error.message;
            } 
            setUploadStatus(`Network FAILED: ${errorMessage}. Check backend connection at ${BACKEND_URL}`);
        }
    };

    // 2. Handles summarization
    const handleSummarize = async () => {
        if (!uploadedDocumentPath) {
             setSummarizeStatus('Error: Please upload a file first.');
             return; 
        }

        setSummarizeStatus('Running OCR and generating summary...');
        setFinalSummary('');
        
        const formData = new FormData();
        formData.append('document_id', uploadedDocumentPath); 

        try {
            const response = await fetch(`${BACKEND_URL}/summarize`, {
                method: 'POST',
                body: formData, 
            });

            if (response.ok) {
                const data = await response.json();
                setFinalSummary(data.summary);
                setSummarizeStatus(`Summarization successful for "${data.documentName}".`);
                setUploadedDocumentPath(null); 
                setSelectedFile(null); 
            } else {
                const errorData = await response.json();
                setSummarizeStatus(`Summarization FAILED: ${errorData.detail || errorData.message}`);
            }
        } catch (error) {
            let errorMessage = "Network error or internal process failed.";
            if (error instanceof Error) {
                errorMessage = error.message;
            }
            setSummarizeStatus(`Error: ${errorMessage}.`);
        }
    };
    
    // Determine if an error class should be applied to the status text
    const statusClass = (uploadStatus.includes('FAILED') || summarizeStatus.includes('FAILED')) 
        ? "status-text status-error" 
        : "status-text";

    return (
        <div className="prototype-container">
            <h2>GCP OCR Summarization Prototype</h2>
            <hr />

            {/* 1. File Selection */}
            <div className="step-group">
                <label htmlFor="document-file">Document Input</label>
                <input
                    type="file"
                    id="document-file"
                    accept={supportedFileTypes}
                    onChange={handleFileChange}
                />
            </div>

            {/* 2. Upload Button */}
            <div className="step-group">
                <button 
                    onClick={handleUpload} 
                    disabled={!selectedFile || uploadedDocumentPath !== null || uploadStatus.includes('Uploading') || uploadStatus.includes('FAILED')}
                    id="upload-button"
                >
                    {uploadStatus.includes('Uploading') ? 'Uploading...' : 'Upload File to GCS'}
                </button>
            </div>

            {/* 3. Summarize Button */}
            <div className="step-group">
                <button 
                    onClick={handleSummarize} 
                    disabled={!uploadedDocumentPath || summarizeStatus.includes('Running OCR') || summarizeStatus.includes('FAILED')}
                    id="summarize-button"
                >
                    {summarizeStatus.includes('Running OCR') ? 'Generating Summary...' : 'Summarize Document (OCR + AI)'}
                </button>
            </div>
            
            <p className={statusClass}>
                **Status:** {uploadStatus || summarizeStatus || 'Awaiting action...'}
            </p>

            {/* Summary Output */}
            {finalSummary && (
                <div className="summary-output">
                    <h3>Generated Summary</h3>
                    <pre className="summary-text-area">{finalSummary}</pre>
                </div>
            )}
        </div>
    );
};

export default App;