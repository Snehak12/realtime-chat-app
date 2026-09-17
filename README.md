# Real-Time Chat Application

A full-stack real-time 1-to-1 chat application built with Node.js, Express, Socket.IO, PostgreSQL, and React.

The application supports authenticated users, user search, conversation management, persistent message history, and real-time message delivery.

## Features

- User registration and login
- JWT-based authentication
- Password hashing with bcrypt
- Protected REST API endpoints
- Real-time 1-to-1 messaging with Socket.IO
- User search
- Conversation creation with duplicate prevention
- Persistent message history using PostgreSQL
- Online/offline user status
- Message timestamps and date separators
- React-based frontend
- PostgreSQL connection pooling
- Input validation and authorization checks
- Database indexing for optimized message-history queries

## Tech Stack

### Frontend

- React
- Vite
- Socket.IO Client
- HTML/CSS

### Backend

- Node.js
- Express.js
- Socket.IO
- JWT
- bcrypt

### Database

- PostgreSQL
- node-postgres (`pg`)

## Architecture

```text
React Frontend
      |
      | REST API
      v
Node.js + Express
      |
      +---- PostgreSQL
      |
      +---- Socket.IO
                |
                v
        Real-Time Messaging
```

## Database Design

The application uses four main PostgreSQL tables:

- `users` — stores user accounts and hashed passwords
- `conversations` — stores 1-to-1 conversations
- `conversation_members` — maps users to conversations
- `messages` — stores persistent chat messages

### Database Indexes

Two indexes were added to optimize frequently accessed queries:

```sql
CREATE INDEX idx_messages_conversation_created
ON messages (conversation_id, created_at);

CREATE INDEX idx_conversation_members_user
ON conversation_members (user_id, conversation_id);
```

## Authentication & Security

- Passwords are hashed using `bcrypt` before being stored.
- JWT tokens are used for authenticated API requests.
- Protected REST endpoints require a valid Bearer token.
- Socket.IO connections require JWT authentication.
- Users can only access conversations they belong to.
- Messages can only be sent by conversation members.
- SQL queries use parameterized values.
- Password hashes are never returned through API responses.
- Database credentials and JWT secrets are stored in environment variables.

## API Endpoints

### Authentication

| Method | Endpoint    | Description         |
| ------ | ----------- | ------------------- |
| POST   | `/register` | Register a new user |
| POST   | `/login`    | Authenticate a user |

### Users

| Method | Endpoint           | Description      |
| ------ | ------------------ | ---------------- |
| GET    | `/users/search?q=` | Search for users |

### Conversations

| Method | Endpoint         | Description                                |
| ------ | ---------------- | ------------------------------------------ |
| POST   | `/conversations` | Create or retrieve a 1-to-1 conversation   |
| GET    | `/conversations` | Get the authenticated user's conversations |

### Messages

| Method | Endpoint                    | Description                           |
| ------ | --------------------------- | ------------------------------------- |
| GET    | `/messages?conversationId=` | Retrieve conversation message history |

## Real-Time Communication

Socket.IO handles real-time communication between connected clients.

### Client → Server Events

- `chatMessage`
- `joinConversation`

### Server → Client Events

- `chatMessage`
- `onlineUsers`
- `userStatus`
- `errorMessage`

## Performance Testing

The application was benchmarked locally using controlled test data and load tests.

### Database Query Optimization

A conversation containing approximately 100,000 messages was used to benchmark the message-history query.

| Configuration           | Execution Time |
| ----------------------- | -------------: |
| Without composite index |      88.786 ms |
| With composite index    |      ~55.11 ms |

The composite index reduced measured query execution time by approximately **38%** in this benchmark.

### Real-Time Messaging

Socket.IO message delivery was measured across 20 local test messages.

- **Median delivery latency:** 3 ms
- **Minimum:** 3 ms
- **Maximum:** 57 ms

> These latency results were measured in a local development environment and should not be interpreted as expected internet-wide latency.

### Backend Load Testing

The backend was tested with:

- 1,000 requests per run
- 50 concurrent requests
- 3 test runs
- 3,000 total requests
- 0 failed requests

Representative results:

- **1,000+ requests/second**
- **~33 ms average request latency**
- **~48 ms p95 latency**
- **0% request failures**

## Project Structure

```text
chat-app/
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ChatWindow.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   └── Sidebar.jsx
│   │   ├── App.jsx
│   │   ├── App.css
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
│
├── public/
│   ├── index.html
│   ├── login.html
│   ├── register.html
│   └── style.css
│
├── src/
│   ├── middleware/
│   │   └── authMiddleware.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── conversations.js
│   │   ├── messages.js
│   │   └── users.js
│   ├── sockets/
│   │   └── chat.js
│   ├── db.js
│   └── server.js
│
├── .gitignore
├── package.json
└── README.md
```

## Local Setup

### 1. Clone the repository

```bash
git clone https://github.com/Snehak12/realtime-chat-app.git
cd realtime-chat-app
```

### 2. Install backend dependencies

```bash
npm install
```

### 3. Install frontend dependencies

```bash
cd client
npm install
cd ..
```

### 4. Configure environment variables

Create `.env` in the project root:

```env
DB_USER=your_postgres_user
DB_HOST=localhost
DB_NAME=chat_app
DB_PASSWORD=your_postgres_password
DB_PORT=5432
JWT_SECRET=your_jwt_secret
```

Create `client/.env`:

```env
VITE_API_URL=http://localhost:3000
```

### 5. Start the backend

From the project root:

```bash
npm run dev
```

The backend runs on:

```text
http://localhost:3000
```

### 6. Start the React frontend

In another terminal:

```bash
cd client
npm run dev
```

Vite will provide the local frontend URL.

## Environment Variables

Environment files containing secrets are excluded from version control.

```text
.env
client/.env
node_modules/
client/node_modules/
```

## Future Improvements

- Message pagination or infinite scrolling for large conversation histories
- Improved multi-tab online-status handling
- Production deployment
- Automated testing
- Rate limiting
- Monitoring and logging

## License

This project is available for educational and portfolio purposes.
