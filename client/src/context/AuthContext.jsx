import { createContext, useContext, useState, useEffect } from "react";
import api from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [successMsg, setSuccessMsg] = useState("");

    // Restore session from localStorage on app start
    useEffect(() => {
        const stored = localStorage.getItem("elabada_user");
        const token = localStorage.getItem("elabada_token");
        if (stored && token) {
            setUser(JSON.parse(stored));
        }
        setLoading(false);
    }, []);

    // Auto-clear success message
    useEffect(() => {
        if (successMsg) {
            const timer = setTimeout(() => setSuccessMsg(""), 3000);
            return () => clearTimeout(timer);
        }
    }, [successMsg]);

    const login = async (email, password, role) => {
        try {
            const { data } = await api.post("/auth/login", { email, password, role });
            localStorage.setItem("elabada_token", data.token);
            localStorage.setItem("elabada_user", JSON.stringify(data.user));
            setUser(data.user);
            setSuccessMsg(`Logged in successfully`);
            return { ok: true, role: data.user.role };
        } catch (err) {
            const msg = err.response?.data?.message || "Invalid username or password.";
            return { ok: false, message: msg };
        }
    };

    const signup = async (payload) => {
        try {
            const { data } = await api.post("/auth/signup", payload);
            localStorage.setItem("elabada_token", data.token);
            localStorage.setItem("elabada_user", JSON.stringify(data.user));
            setUser(data.user);
            setSuccessMsg(`Logged in successfully`);
            return { ok: true, role: data.user.role };
        } catch (err) {
            const msg = err.response?.data?.message || "Username already registered.";
            return { ok: false, message: msg };
        }
    };

    const logout = () => {
        localStorage.removeItem("elabada_token");
        localStorage.removeItem("elabada_user");
        setUser(null);
        setSuccessMsg("Logged out successfully");
    };

    return (
        <AuthContext.Provider value={{ user, login, signup, logout, loading, successMsg, setSuccessMsg }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
