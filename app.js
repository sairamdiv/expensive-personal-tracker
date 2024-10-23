const express = require('express');
const bodyParser = require('body-parser');
const db = require('./db'); // Database connection

const app = express();
app.use(bodyParser.json());

// Add a new transaction (income or expense)
app.post('/transactions', (req, res) => {
    const { type, category, amount, date, description } = req.body;

    if (!type || !category || !amount || !date) {
        return res.status(400).json({ error: 'All fields (type, category, amount, date) are required.' });
    }

    const query = `INSERT INTO transactions (type, category, amount, date, description) VALUES (?, ?, ?, ?, ?)`;
    db.run(query, [type, category, amount, date, description], function (err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.status(201).json({ id: this.lastID });
    });
});

// Retrieve all transactions
app.get('/transactions', (req, res) => {
    const query = `SELECT * FROM transactions`;
    db.all(query, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

// Retrieve a specific transaction by ID
app.get('/transactions/:id', (req, res) => {
    const { id } = req.params;

    const query = `SELECT * FROM transactions WHERE id = ?`;
    db.get(query, [id], (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (!row) {
            return res.status(404).json({ error: 'Transaction not found.' });
        }
        res.json(row);
    });
});

// Update a transaction by ID
app.put('/transactions/:id', (req, res) => {
    const { id } = req.params;
    const { type, category, amount, date, description } = req.body;

    const query = `UPDATE transactions SET type = ?, category = ?, amount = ?, date = ?, description = ? WHERE id = ?`;
    db.run(query, [type, category, amount, date, description, id], function (err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Transaction not found.' });
        }
        res.json({ message: 'Transaction updated successfully.' });
    });
});

// Delete a transaction by ID
app.delete('/transactions/:id', (req, res) => {
    const { id } = req.params;

    const query = `DELETE FROM transactions WHERE id = ?`;
    db.run(query, [id], function (err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Transaction not found.' });
        }
        res.json({ message: 'Transaction deleted successfully.' });
    });
});

// Retrieve a summary of transactions (total income, total expenses, and balance)
app.get('/summary', (req, res) => {
    const incomeQuery = `SELECT SUM(amount) AS totalIncome FROM transactions WHERE type = 'income'`;
    const expenseQuery = `SELECT SUM(amount) AS totalExpenses FROM transactions WHERE type = 'expense'`;

    db.get(incomeQuery, [], (err, incomeRow) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        db.get(expenseQuery, [], (err, expenseRow) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }

            const totalIncome = incomeRow.totalIncome || 0;
            const totalExpenses = expenseRow.totalExpenses || 0;
            const balance = totalIncome - totalExpenses;

            res.json({
                totalIncome,
                totalExpenses,
                balance
            });
        });
    });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

