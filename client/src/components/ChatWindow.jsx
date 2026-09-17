import { useEffect, useRef, useState } from 'react'
import { io } from 'socket.io-client'

function getCurrentUserId() {
    const token = localStorage.getItem('token')

    if (!token) {
        return null
    }

    const payload = JSON.parse(
        atob(token.split('.')[1])
    )

    return payload.userId
}

function formatMessageDate(dateString) {
    const date = new Date(dateString)

    return date.toLocaleDateString([], {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    })
}

function ChatWindow({ conversation, onSocketReady }) {
    const [socket, setSocket] = useState(null)
    const [messages, setMessages] = useState([])
    const [messageInput, setMessageInput] = useState('')
    const [onlineUsers, setOnlineUsers] = useState([])
    const messagesEndRef = useRef(null)
    const currentUserId = getCurrentUserId()
    const [error, setError] = useState('')

    useEffect(() => {
        const token = localStorage.getItem('token')

        if (!token) {
            return
        }

        const newSocket = io(import.meta.env.VITE_API_URL, {
            auth: {
                token,
            },
        })

        setSocket(newSocket)
        onSocketReady(newSocket)

        newSocket.on('connect', () => {
            console.log('Connected to Socket.IO:', newSocket.id)
        })

        newSocket.on('connect_error', (error) => {
            console.error('Socket connection failed:', error.message)
            setError('Real-time connection failed')
            setError('')
        })

        newSocket.on('onlineUsers', (users) => {
            setOnlineUsers(users)
        })

        newSocket.on('errorMessage', (message) => {
            setError(message)
        })

        return () => {
            newSocket.disconnect()
        }
    }, [])

    useEffect(() => {
        if (!socket || !conversation) {
            return
        }

        socket.emit('joinConversation', conversation.id)

        console.log(
            'Joined conversation:',
            conversation.id
        )
    }, [socket, conversation])

    useEffect(() => {
        if (!conversation) {
            setMessages([])
            return
        }

        loadMessages(conversation.id)
    }, [conversation])

    useEffect(() => {
        if (!socket) {
            return
        }

        function handleNewMessage(message) {
            setMessages((previousMessages) => [
                ...previousMessages,
                message,
            ])
        }

        socket.on('chatMessage', handleNewMessage)

        return () => {
            socket.off('chatMessage', handleNewMessage)
        }
    }, [socket])

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({
            behavior: 'smooth',
        })
    }, [messages])

    async function loadMessages(conversationId) {
        try {
            const token = localStorage.getItem('token')

            const response = await fetch(
                `${import.meta.env.VITE_API_URL}/messages?conversationId=${conversationId}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            )

            if (!response.ok) {
                setError('Failed to load messages')
                return
            }

            const data = await response.json()

            console.log('Messages from server:', data)

            setMessages(data)
            setError('')
        } catch (error) {
            console.error('Failed to load messages:', error)
            setError('Unable to connect to server')
        }
    }

    function sendMessage() {
        if (!socket || !conversation) {
            return
        }

        const message = messageInput.trim()

        if (!message) {
            return
        }

        socket.emit('chatMessage', {
            conversationId: conversation.id,
            message: messageInput,
        })

        setMessageInput('')
    }

    function handleKeyDown(event) {
        if (event.key === 'Enter') {
            sendMessage()
        }
    }

    if (!conversation) {
        return (
        <div>
            <h2>Chat Window</h2>
            <p>Select a conversation to start chatting.</p>
        </div>
        )
    }

    return (
        <section className="chat-window">
            <header className="chat-header">
                <div>
                    <h2>{conversation.name}</h2>

                    <span className="online-status">
                        {onlineUsers.includes(conversation.other_user_id)
                            ? '🟢 Online'
                            : '⚫ Offline'}
                    </span>
                </div>
            </header>

            {error && (
                <p className="chat-error">
                    {error}
                </p>
            )}

            <div className="messages">
                {messages.map((message, index) => {
                    const isOwnMessage =
                        message.sender_id === currentUserId

                    const currentDate = new Date(message.created_at)
                        .toDateString()

                    const previousDate =
                        index > 0
                            ? new Date(messages[index - 1].created_at).toDateString()
                            : null

                    const showDateSeparator =
                        currentDate !== previousDate

                    return (
                        <div key={message.id}>
                            {showDateSeparator && (
                                <div className="date-separator">
                                    {formatMessageDate(message.created_at)}
                                </div>
                            )}

                            <div
                                className={`message ${
                                    isOwnMessage
                                        ? 'own-message'
                                        : 'other-message'
                                }`}
                            >
                                <strong>
                                    {message.sender_username}:
                                </strong>{' '}
                                {message.content}

                                <span className="message-time">
                                    {new Date(
                                        message.created_at
                                    ).toLocaleTimeString([], {
                                        hour: 'numeric',
                                        minute: '2-digit',
                                    })}
                                </span>
                            </div>
                        </div>
                    )
                })}

                <div ref={messagesEndRef} />
            </div>

            <div className="message-input-container">
                <input
                    type="text"
                    placeholder="Type a message..."
                    value={messageInput}
                    onChange={(event) =>
                        setMessageInput(event.target.value)
                    }
                    onKeyDown={handleKeyDown}
                />

                <button onClick={sendMessage}>
                    Send
                </button>
            </div>
        </section>
    )
}

export default ChatWindow