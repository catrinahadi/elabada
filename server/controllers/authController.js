const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");
const Owner = require("../models/Owner");
const Customer = require("../models/Customer");

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Try each role model in order
        let user = null;
        let role = null;

        const admin = await Admin.findOne({ email });
        if (admin) { user = admin; role = "admin"; }

        if (!user) {
            const owner = await Owner.findOne({ email });
            if (owner) { user = owner; role = "owner"; }
        }

        if (!user) {
            const customer = await Customer.findOne({ email });
            if (customer) { user = customer; role = "customer"; }
        }

        if (!user) return res.status(401).json({ message: "Invalid email or password." });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ message: "Invalid email or password." });

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

        // Check if user exists already in any collection
        const existingAdmin = await Admin.findOne({ email });
        const existingOwner = await Owner.findOne({ email });
        const existingCust = await Customer.findOne({ email });

        if (existingAdmin || existingOwner || existingCust) {
            return res.status(400).json({ message: "Email already registered." });
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
