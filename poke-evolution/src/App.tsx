import { useState, useEffect } from 'react';
import { auth } from './firebase';
import { onAuthStateChanged, type User } from 'firebase/auth'; // 수정된 부분
import AuthPage from './components/AuthPage';
import MainApp from './MainApp';

function App() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    if (loading) {
        return <div>인증 상태를 확인하는 중...</div>;
    }

    return user ? <MainApp /> : <AuthPage />;
}

export default App;