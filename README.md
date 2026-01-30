# BookLeaf Author Royalty API

This is a REST API for the BookLeaf simplified author royalty system, built with Node.js and Express.

  # Project Live Link : https://bookstore-api-r1es.onrender.com

## Features

-   **Authors**: Track earnings and current balance.
-   **Sales**: View detailed sales history for authors.
-   **Withdrawals**: Request withdrawals with validation logic.

## Prerequisites

-   Node.js installed on your machine.

## Installation

1.  Clone the repository or download the files.
2.  Install dependencies:
    ```bash
    npm install
    ```

## Running Locally

To start the server locally:

```bash
node index.js
```

The server will start on `http://localhost:3000`.

## API Endpoints

### 1. GET /authors
Returns a list of all authors with calculated total earnings and current balance.

### 2. GET /authors/:id
Returns detailed information about a specific author, including their books and sales summary.

### 3. GET /authors/:id/sales
Returns all sales transactions for an author's books, sorted by newest first.

### 4. POST /withdrawals
Request a withdrawal for an author.

**Body:**
```json
{
  "author_id": 1,
  "amount": 2000
}
```

**Rules:**
-   Minimum amount: ₹500
-   Amount cannot exceed current balance.

### 5. GET /authors/:id/withdrawals
View withdrawal history for an author.


