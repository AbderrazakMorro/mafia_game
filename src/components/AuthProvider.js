'use client';

import { useState, useEffect, createContext, useContext } from 'react';
import AuthModal from './AuthModal';
import Toast from './Toast';

const AuthContext = createContext(null);

export function useAuth() {
    return useContext(AuthContext);
}

export default function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [isInitializing, setIsInitializing] = useState(true);

    useEffect(() => {
        const storedUser = localStorage.getItem('mafia_user');
        if (storedUser) {
            try {
                const parsed = JSON.parse(storedUser);
                setUser(parsed);
                setToastMessage(`Bon retour ${parsed.pseudo} !`);
            } catch {
                setShowAuthModal(true);
            }
        }
        // Don't auto-show modal anymore — let the page handle it
        setIsInitializing(false);
    }, []);

    const handleAuthSuccess = (userData, msg) => {
        setUser(userData);
        setShowAuthModal(false);
        setToastMessage(msg);
    };

    const openAuthModal = () => {
        setShowAuthModal(true);
    };

    const logout = () => {
        localStorage.removeItem('mafia_user');
        setUser(null);
        setToastMessage('');
    };

    const deleteAccount = async () => {
        if (!user || user.is_guest) return;
        try {
            const res = await fetch('/api/auth/delete-account', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id, email: user.email }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Erreur lors de la suppression');
            localStorage.removeItem('mafia_user');
            setUser(null);
            setToastMessage('Votre compte a été supprimé.');
            return { success: true };
        } catch (err) {
            return { success: false, error: err.message };
        }
    };

    const updateUser = (updatedUser) => {
        setUser(updatedUser);
        localStorage.setItem('mafia_user', JSON.stringify(updatedUser));
    };

    return (
        <AuthContext.Provider value={{ user, isInitializing, openAuthModal, logout, deleteAccount, updateUser }}>
            {toastMessage && (
                <Toast
                    message={toastMessage}
                    onClose={() => setToastMessage('')}
                />
            )}

            {showAuthModal && (
                <AuthModal
                    onAuthSuccess={handleAuthSuccess}
                    onClose={() => setShowAuthModal(false)}
                />
            )}

            {children}
        </AuthContext.Provider>
    );
}
