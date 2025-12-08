import { useState } from 'react';
import './App.css'; // Reusing main styles

const BACKEND_URL = "http://localhost:8000";

interface LoginProps {
    onLogin: (userId: string) => void;
}

const Login = ({ onLogin }: LoginProps) => {
    const [inputUserId, setInputUserId] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputUserId.trim()) return;

        setLoading(true);
        setError('');

        const formData = new FormData();
        formData.append('user_id', inputUserId);

        try {
            const response = await fetch(`${BACKEND_URL}/login`, {
                method: 'POST',
                body: formData,
            });

            if (response.ok) {
                // Pass the user ID back up to App.tsx
                onLogin(inputUserId);
            } else {
                setError("Login failed. Please try again.");
            }
        } catch (err) {
            console.error("Login error:", err);
            setError("Network error. Check backend connection.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <h2>Welcome to Document Summarizer</h2>
            <div className="login-card">
                <p>Please enter your User ID to continue.</p>
                <form onSubmit={handleSubmit}>
                    <input
                        type="text"
                        placeholder="Enter User ID (e.g., user_123)"
                        value={inputUserId}
                        onChange={(e) => setInputUserId(e.target.value)}
                        className="auth-input login-input"
                        disabled={loading}
                    />
                    <button type="submit" disabled={loading || !inputUserId}>
                        {loading ? "Verifying..." : "Login / Register"}
                    </button>
                </form>
                {error && <p className="status-text status-error">{error}</p>}
                <p className="login-note">
                    *If this ID doesn't exist, a new account will be created automatically.
                </p>
            </div>
        </div>
    );
};

export default Login;