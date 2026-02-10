const express = require('express');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const cors = require('cors');
const path = require('path'); 
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

// 2. Serve static files from the 'public' folder
app.use(express.static(path.join(__dirname, 'public')));

const PORT = process.env.PORT || 3000;
const OFFICIAL_EMAIL = "ashu0052.be23@chitkara.edu.in"; 

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// --- Math Helpers ---
const getFibonacci = (n) => {
    if (n === 0) return [];
    if (n === 1) return [0];
    let res = [0, 1];
    for (let i = 2; i < n; i++) res.push(res[i - 1] + res[i - 2]);
    return res.slice(0, n);
};

const isPrime = (num) => {
    if (!Number.isInteger(num) || num <= 1) return false;
    for (let i = 2; i <= Math.sqrt(num); i++) if (num % i === 0) return false;
    return true;
};

const getGCD = (a, b) => (!b ? Math.abs(a) : getGCD(b, a % b));
const getLCM = (a, b) => (a === 0 || b === 0) ? 0 : Math.abs(a * b) / getGCD(a, b);

// --- Routes ---

// 3. Root Route to serve index.html (Fixes the 404 on home page)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// GET /health
app.get('/health', (req, res) => {
    res.status(200).json({ 
        is_success: true, 
        official_email: OFFICIAL_EMAIL 
    });
});

// POST /bfhl
app.post('/bfhl', async (req, res) => {
    try {
        const keys = Object.keys(req.body);
        if (keys.length !== 1) throw new Error("Request must contain exactly one valid key");

        const key = keys[0];
        const value = req.body[key];
        let resultData;

        switch (key) {
            case 'fibonacci':
                if (!Number.isInteger(value) || value < 0 || value > 50) 
                    throw new Error("Input must be an integer between 0 and 50");
                resultData = getFibonacci(value);
                break;
            case 'prime':
                if (!Array.isArray(value)) throw new Error("Input must be an array");
                resultData = value.filter(n => typeof n === 'number' && isPrime(n));
                break;
            case 'lcm':
                if (!Array.isArray(value) || value.length < 1) throw new Error("Array cannot be empty");
                if (value.some(n => typeof n !== 'number')) throw new Error("Array must contain numbers only");
                resultData = value.reduce((a, b) => getLCM(a, b));
                break;
            case 'hcf':
                if (!Array.isArray(value) || value.length < 1) throw new Error("Array cannot be empty");
                if (value.some(n => typeof n !== 'number')) throw new Error("Array must contain numbers only");
                resultData = value.reduce((a, b) => getGCD(a, b));
                break;
            case 'AI':
                if (typeof value !== 'string' || value.trim() === "") throw new Error("AI query must be a string");
                try {
                    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
                    const prompt = `${value}. Respond with strictly only one word. No punctuation.`;
                    const result = await model.generateContent(prompt);
                    resultData = result.response.text().trim().split(/\s+/)[0].replace(/[^\w]/g, '');
                } catch (aiError) {
                    throw new Error("AI Service temporary failure");
                }
                break;
            default:
                return res.status(400).json({ is_success: false, message: "Invalid key provided" });
        }

        res.status(200).json({ 
            is_success: true, 
            official_email: OFFICIAL_EMAIL, 
            data: resultData 
        });

    } catch (error) {
        res.status(400).json({ is_success: false, message: error.message });
    }
});

// Handle 404 for other routes
app.use((req, res) => res.status(404).json({ is_success: false, message: "Route not found" }));

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));