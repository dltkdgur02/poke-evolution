import { useState } from 'react';
import { auth } from '../firebase';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    GoogleAuthProvider,
    signInWithPopup
} from 'firebase/auth';
import './Auth.css';

function AuthPage() {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            if (isLogin) {
                await signInWithEmailAndPassword(auth, email, password);
            } else {
                await createUserWithEmailAndPassword(auth, email, password);
            }
        } catch (err: any) {
            setError(err.message);
        }
    };

    const handleGoogleSignIn = async () => {
        const provider = new GoogleAuthProvider();
        try {
            await signInWithPopup(auth, provider);
        } catch (err: any) {
            setError(err.message);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-box">
                <h2>{isLogin ? '로그인' : '회원가입'}</h2>
                <form onSubmit={handleSubmit} className="auth-form">
                    <input
                        type="email"
                        className="auth-input"
                        placeholder="이메일"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                    <input
                        type="password"
                        className="auth-input"
                        placeholder="비밀번호"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={6}
                    />
                    <button type="submit" className="auth-button">
                        {isLogin ? '로그인' : '회원가입'}
                    </button>
                </form>
                <button onClick={handleGoogleSignIn} className="auth-button google-btn" style={{ marginTop: '10px' }}>
                    Google 계정으로 로그인
                </button>
                {error && <p style={{ color: 'red' }}>{error}</p>}
                <p className="toggle-auth" onClick={() => setIsLogin(!isLogin)}>
                    {isLogin ? "계정이 없으신가요? " : "이미 계정이 있으신가요? "}
                    <span>{isLogin ? "회원가입" : "로그인"}</span>
                </p>
            </div>
        </div>
    );
}

export default AuthPage;