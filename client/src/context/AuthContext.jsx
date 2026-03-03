import { createContext, useContext, useState, useEffect } from "react";
import api from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Restore session from localStorage on app start
    useEffect(() => {
        const stored = localStorage.getItem("elabada_user");
        const token = localStorage.getItem("elabada_token");
        if (stored && token) {
            setUser(JSON.parse(stored));
        }
        setLoading(false);
    }, []);

    const login = async (email, password) => {
        try {
            const { data } = await api.post("/auth/login", { email, password });
            localStorage.setItem("elabada_token", data.token);
            localStorage.setItem("elabada_user", JSON.stringify(data.user));
            setUser(data.user);
            return { ok: true, role: data.user.role };
        } catch (err) {
            const msg = err.response?.data?.message || "Invalid email or password.";
            return { ok: false, message: msg };
        }
    };

    const signup = async (payload) => {
        try {
            const { data } = await api.post("/auth/signup", payload);
            localStorage.setItem("elabada_token", data.token);
            localStorage.setItem("elabada_user", JSON.stringify(data.user));
            setUser(data.user);
            return { ok: true, role: data.user.role };
        } catch (err) {
            const msg = err.response?.data?.message || "Email already registered.";
            return { ok: false, message: msg };
        }
    };

    const logout = () => {
        localStorage.removeItem("elabada_token");
        localStorage.removeItem("elabada_user");
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, signup, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
