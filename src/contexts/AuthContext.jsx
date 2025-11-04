// src/contexts/AuthContext.jsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { account } from '../services/appwrite';

const AuthContext = createContext();

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkUser();
    }, []);

    async function checkUser() {
        try {
            const currentUser = await account.get();
            setUser(currentUser);
        } catch (error) {
            console.log('No authenticated user');
        } finally {
            setLoading(false);
        }
    }

    async function login(email, password) {
        await account.createEmailPasswordSession(email, password);
        const currentUser = await account.get();
        setUser(currentUser);
    }

    async function logout() {
        await account.deleteSession('current');
        setUser(null);
    }

    async function signup(email, password, name) {
        await account.createEmailPasswordAccount(email, password, name);
        await login(email, password);
    }

    const value = {
        user,
        login,
        logout,
        signup
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}