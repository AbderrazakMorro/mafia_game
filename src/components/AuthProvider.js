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

    const updateUser = (updatedUser) => {
        setUser(updatedUser);
        localStorage.setItem('mafia_user', JSON.stringify(updatedUser));
    };

    return (
        <AuthContext.Provider value={{ user, isInitializing, openAuthModal, logout, updateUser }}>
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
