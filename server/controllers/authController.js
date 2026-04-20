const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");
const Owner = require("../models/Owner");
const Customer = require("../models/Customer");

exports.login = async (req, res) => {
    try {
        const { email, password, role: requestedRole } = req.body;

        // Perform lookups in parallel
        const [admin, owner, customer] = await Promise.all([
            Admin.findOne({ email }),
            Owner.findOne({ email }),
            Customer.findOne({ email })
        ]);

        let user = admin || owner || customer;
        let role = admin ? "admin" : (owner ? "owner" : (customer ? "customer" : null));

        if (!user) {
            return res.status(401).json({ message: "Account not found with this email." });
        }

        // Verify if the found user matches the requested role if provided
        if (requestedRole && role !== requestedRole) {
            return res.status(401).json({ message: `Access denied. This account is registered as a ${role}.` });
        }

        if (!user) return res.status(401).json({ message: "Invalid username or password." });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ message: "Invalid username or password." });

        const token = jwt.sign(
            { id: user._id, role, name: user.name, email: user.email },
            process.env.JWT_SECRET || "elabada_secret_key",
            { expiresIn: "7d" }
        );

        res.json({
            token,
            user: { id: user._id, role, name: user.name, email: user.email },
        });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

exports.signup = async (req, res) => {
    try {
        const { name, email, password, role, phone } = req.body;

        if (!name || !email || !password || !role) {
            return res.status(400).json({ message: "All fields are required." });
        }

        // Prevent admin signup
        if (role === 'admin') {
            return res.status(403).json({ message: "Cannot register as admin." });
        }

        // Filter password complexity
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,128}$/;
        if (!passwordRegex.test(password)) {
            return res.status(400).json({
                message: "Password must be 8-128 characters long and include at least one uppercase letter, one lowercase letter, one numeric digit, and one special character."
            });
        }

        // Check if user exists already in any collection in parallel
        const [existingAdmin, existingOwner, existingCust] = await Promise.all([
            Admin.findOne({ email }),
            Owner.findOne({ email }),
            Customer.findOne({ email })
        ]);

        if (existingAdmin || existingOwner || existingCust) {
            return res.status(400).json({ message: "Username already registered." });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        let newUser;
        if (role === 'owner') {
            newUser = await Owner.create({ name, email, password: hashedPassword, phone });
        } else {
            newUser = await Customer.create({ name, email, password: hashedPassword });
        }

        const token = jwt.sign(
            { id: newUser._id, role, name: newUser.name, email: newUser.email },
            process.env.JWT_SECRET || "elabada_secret_key",
            { expiresIn: "7d" }
        );

        res.status(201).json({
            token,
            user: { id: newUser._id, role, name: newUser.name, email: newUser.email },
        });

    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
};
