import { createContext, useContext, useState } from "react";

const AuthContext = createContext(null);

/* ── Demo credentials ──────────────────────────────────────
   Admin:    admin@elabada.com    / admin123
   Owner:    owner@elabada.com    / owner123   (or owner2@…)
   Customer: customer@elabada.com / cust123
────────────────────────────────────────────────────────────*/
const DEMO_USERS = [
    { id: "admin1", role: "admin", name: "System Admin", email: "admin@elabada.com", password: "admin123" },
    { id: "owner1", role: "owner", name: "Maria Santos", email: "owner@elabada.com", password: "owner123" },
    { id: "owner2", role: "owner", name: "Juan Dela Cruz", email: "owner2@elabada.com", password: "owner123" },
    { id: "cust1", role: "customer", name: "Sarah Johnson", email: "customer@elabada.com", password: "cust123" },
];

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null); // null = not logged in

    const login = (email, password) => {
        const found = DEMO_USERS.find(u => u.email === email && u.password === password);
        if (!found) return { ok: false, message: "Invalid email or password." };
        setUser(found);
        return { ok: true, role: found.role };
    };

    const logout = () => setUser(null);

    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
