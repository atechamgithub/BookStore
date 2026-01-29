const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// --- Database (In-Memory) ---
const db = {
    authors: [
        { id: 1, name: "Priya Sharma", email: "priya@email.com", bankAccount: "1234567890", ifsc: "HDFC0001234" },
        { id: 2, name: "Rahul Verma", email: "rahul@email.com", bankAccount: "0987654321", ifsc: "ICIC0005678" },
        { id: 3, name: "Anita Desai", email: "anita@email.com", bankAccount: "5678901234", ifsc: "SBIN0009012" }
    ],
    books: [
        { id: 1, authorId: 1, title: "The Silent River", royaltyPerSale: 45 },
        { id: 2, authorId: 1, title: "Midnight in Mumbai", royaltyPerSale: 60 },
        { id: 3, authorId: 2, title: "Code & Coffee", royaltyPerSale: 75 },
        { id: 4, authorId: 2, title: "Startup Diaries", royaltyPerSale: 50 },
        { id: 5, authorId: 2, title: "Poetry of Pain", royaltyPerSale: 30 },
        { id: 6, authorId: 3, title: "Garden of Words", royaltyPerSale: 40 }
    ],
    sales: [
        { bookId: 1, quantity: 25, date: "2025-01-05" },
        { bookId: 1, quantity: 40, date: "2025-01-12" },
        { bookId: 2, quantity: 15, date: "2025-01-08" },
        { bookId: 3, quantity: 60, date: "2025-01-03" },
        { bookId: 3, quantity: 45, date: "2025-01-15" },
        { bookId: 4, quantity: 30, date: "2025-01-10" },
        { bookId: 5, quantity: 20, date: "2025-01-18" },
        { bookId: 6, quantity: 10, date: "2025-01-20" }
    ],
    withdrawals: []
};

// --- Helper Functions ---

const getAuthorBooks = (authorId) => {
    return db.books.filter(b => b.authorId === Number(authorId));
};

const getBookSales = (bookId) => {
    return db.sales.filter(s => s.bookId === Number(bookId));
};

const calculateAuthorEarnings = (authorId) => {
    const books = getAuthorBooks(authorId);
    let total = 0;
    books.forEach(book => {
        const sales = getBookSales(book.id);
        const bookRevenue = sales.reduce((sum, sale) => sum + (sale.quantity * book.royaltyPerSale), 0);
        total += bookRevenue;
    });
    return total;
};

const calculateAuthorWithdrawals = (authorId) => {
    return db.withdrawals
        .filter(w => w.authorId === Number(authorId))
        .reduce((sum, w) => sum + w.amount, 0);
};

const getAuthorFinancials = (authorId) => {
    const totalEarnings = calculateAuthorEarnings(authorId);
    const totalWithdrawn = calculateAuthorWithdrawals(authorId);
    return {
        total_earnings: totalEarnings,
        current_balance: totalEarnings - totalWithdrawn
    };
};

// --- Endpoints ---

// 1. GET /authors
app.get('/authors', (req, res) => {
    const result = db.authors.map(author => {
        const financials = getAuthorFinancials(author.id);
        return {
            id: author.id,
            name: author.name,
            total_earnings: financials.total_earnings,
            current_balance: financials.current_balance
        };
    });
    res.json(result);
});

// 2. GET /authors/:id
app.get('/authors/:id', (req, res) => {
    const authorId = Number(req.params.id);
    const author = db.authors.find(a => a.id === authorId);
    
    if (!author) {
        return res.status(404).json({ error: "Author not found" });
    }

    const financials = getAuthorFinancials(authorId);
    const books = getAuthorBooks(authorId).map(book => {
        const sales = getBookSales(book.id);
        const totalSold = sales.reduce((sum, s) => sum + s.quantity, 0);
        const totalRoyalty = totalSold * book.royaltyPerSale;
        
        return {
            id: book.id,
            title: book.title,
            royalty_per_sale: book.royaltyPerSale,
            total_sold: totalSold,
            total_royalty: totalRoyalty
        };
    });

    res.json({
        id: author.id,
        name: author.name,
        email: author.email,
        current_balance: financials.current_balance,
        total_earnings: financials.total_earnings,
        total_books: books.length,
        books: books
    });
});

// 3. GET /authors/:id/sales
app.get('/authors/:id/sales', (req, res) => {
    const authorId = Number(req.params.id);
    const author = db.authors.find(a => a.id === authorId);
    
    if (!author) {
        return res.status(404).json({ error: "Author not found" });
    }

    const books = getAuthorBooks(authorId);
    let allSales = [];

    books.forEach(book => {
        const sales = getBookSales(book.id);
        sales.forEach(sale => {
            allSales.push({
                book_title: book.title,
                quantity: sale.quantity,
                royalty_earned: sale.quantity * book.royaltyPerSale,
                sale_date: sale.date
            });
        });
    });

    // Sort by date (newest first)
    allSales.sort((a, b) => new Date(b.sale_date) - new Date(a.sale_date));

    res.json(allSales);
});

// 4. POST /withdrawals
app.post('/withdrawals', (req, res) => {
    const { author_id, amount } = req.body;

    // Validation
    if (!author_id || amount === undefined) {
        return res.status(400).json({ error: "author_id and amount are required" });
    }
    
    const authorId = Number(author_id);
    const withdrawalAmount = Number(amount);
    
    const author = db.authors.find(a => a.id === authorId);
    if (!author) {
        return res.status(404).json({ error: "Author not found" });
    }

    if (withdrawalAmount < 500) {
        return res.status(400).json({ error: "Minimum withdrawal amount is 500" });
    }

    const financials = getAuthorFinancials(authorId);
    if (withdrawalAmount > financials.current_balance) {
        return res.status(400).json({ error: "Insufficient balance" });
    }

    // Process Withdrawal
    const withdrawal = {
        id: db.withdrawals.length + 1,
        authorId: authorId,
        amount: withdrawalAmount,
        status: "pending",
        created_at: new Date().toISOString()
    };
    
    db.withdrawals.push(withdrawal);

    // Calculate new balance
    const newFinancials = getAuthorFinancials(authorId);

    res.status(201).json({
        message: "Withdrawal requested successfully",
        withdrawal_id: withdrawal.id,
        amount: withdrawal.amount,
        new_balance: newFinancials.current_balance,
        status: withdrawal.status
    });
});

// 5. GET /authors/:id/withdrawals
app.get('/authors/:id/withdrawals', (req, res) => {
    const authorId = Number(req.params.id);
    const author = db.authors.find(a => a.id === authorId);
    
    if (!author) {
        return res.status(404).json({ error: "Author not found" });
    }

    const authorWithdrawals = db.withdrawals
        .filter(w => w.authorId === authorId)
        .map(w => ({
            id: w.id,
            amount: w.amount,
            status: w.status,
            created_at: w.created_at
        }))
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    res.json(authorWithdrawals);
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
