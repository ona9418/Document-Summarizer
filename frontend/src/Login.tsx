import { useState } from 'react';
import './App.css'; 

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";

interface LoginProps {
    onLogin: (userId: string) => void;
}

const Login = ({ onLogin }: LoginProps) => {
    const [isRegistering, setIsRegistering] = useState(false);
    const [inputUserId, setInputUserId] = useState('');
    const [inputPassword, setInputPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputUserId.trim() || !inputPassword.trim()) return;

        setLoading(true);
        setError('');
        setSuccessMsg('');

        const formData = new FormData();
        formData.append('user_id', inputUserId);
        formData.append('password', inputPassword);

        const endpoint = isRegistering ? '/register' : '/login';

        try {
            const response = await fetch(`${BACKEND_URL}${endpoint}`, {
                method: 'POST',
                body: formData,
            });

            // 1. Check if the response is actually JSON before parsing
            const contentType = response.headers.get("content-type");
            let data;
            if (contentType && contentType.indexOf("application/json") !== -1) {
                data = await response.json();
            } else {
                // If not JSON (e.g. 500 Crash HTML), throw error manually
                throw new Error("Server error: Non-JSON response received.");
            }

            if (response.ok) {
                if (isRegistering) {
                    setSuccessMsg("Account created! Logging you in...");
                    setTimeout(() => onLogin(inputUserId), 1500);
                } else {
                    onLogin(inputUserId);
                }
            } else {
                setError(data.detail || "Authentication failed.");
            }
        } catch (err) {
            console.error("Auth error:", err);
            setError("Login failed. Have you registered your account?");
        } finally {
            // 2. Ensure this ALWAYS runs to stop the spinner
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <h2>Cloud Document Summarizer</h2>
            <div className="login-card">
                <h3>{isRegistering ? "Create Account" : "Login"}</h3>
                
                <form onSubmit={handleSubmit}>
                    <div style={{marginBottom: '10px', textAlign: 'left'}}>
                        <label style={{fontSize: '0.85em', color:'#666'}}>User ID</label>
                        <input
                            type="text"
                            placeholder="e.g. user_123"
                            value={inputUserId}
                            onChange={(e) => setInputUserId(e.target.value)}
                            className="auth-input login-input"
                            disabled={loading}
                        />
                    </div>

                    <div style={{marginBottom: '15px', textAlign: 'left'}}>
                        <label style={{fontSize: '0.85em', color:'#666'}}>Password</label>
                        <input
                            type="password"
                            placeholder="Enter password"
                            value={inputPassword}
                            onChange={(e) => setInputPassword(e.target.value)}
                            className="auth-input login-input"
                            disabled={loading}
                        />
                    </div>

                    <button type="submit" disabled={loading || !inputUserId || !inputPassword}>
                        {loading ? "Processing..." : (isRegistering ? "Sign Up" : "Login")}
                    </button>
                </form>

                {error && <p className="status-text status-error">{error}</p>}
                {successMsg && <p className="status-text" style={{color: 'green'}}>{successMsg}</p>}

                <div style={{marginTop: '15px', fontSize: '0.9em', borderTop: '1px solid #eee', paddingTop: '10px'}}>
                    {isRegistering ? "Already have an account? " : "Don't have an account? "}
                    <button 
                        type="button" 
                        onClick={() => {
                            setIsRegistering(!isRegistering);
                            setError('');
                            setSuccessMsg('');
                        }}
                        style={{
                            background: 'none', 
                            border: 'none', 
                            color: '#007BFF', 
                            textDecoration: 'underline', 
                            cursor: 'pointer',
                            padding: 0,
                            width: 'auto'
                        }}
                    >
                        {isRegistering ? "Login here" : "Register here"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Login;