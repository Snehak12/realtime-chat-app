import { useEffect, useState } from 'react'

function Sidebar({ onSelectConversation }) {
    const [conversations, setConversations] = useState([])
    const [search, setSearch] = useState('')
    const [searchResults, setSearchResults] = useState([])
    const [error, setError] = useState('')

    useEffect(() => {
        loadConversations()
    }, [])

    async function loadConversations() {
        try {
            const token = localStorage.getItem('token')

            const response = await fetch(`${import.meta.env.VITE_API_URL}/conversations`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            )

            if (!response.ok) {
                setError('Failed to load conversations')
                return
            }

            const data = await response.json()

            setConversations(data)
            setError('')
        } catch (error) {
            console.error('Failed to load conversations:', error)
            setError('Unable to connect to server')
        }
    }

    async function handleSearch(event) {
        const value = event.target.value

        setSearch(value)
        setError('')

        if (!value.trim()) {
            setSearchResults([])
            return
        }

        try {
            const token = localStorage.getItem('token')

            const response = await fetch(
                `${import.meta.env.VITE_API_URL}/users/search?q=${encodeURIComponent(value)}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            )

            if (!response.ok) {
                setError('User search failed')
                return
            }

            const data = await response.json()

            setSearchResults(data)
        } catch (error) {
            console.error('User search failed:', error)
            setError('Unable to connect to server')
        }
    }

    async function openUser(user) {
        try {
            const token = localStorage.getItem('token')

            const response = await fetch(`${import.meta.env.VITE_API_URL}/conversations`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        userId: user.id,
                    }),
                }
            )

            if (!response.ok) {
                setError('Failed to open conversation')
                return
            }

            const data = await response.json()

            const conversation = data.conversation

            setSearch('')
            setSearchResults([])
            setError('')

            await loadConversations()

            onSelectConversation({
                ...conversation,
                name: user.username,
                other_user_id: user.id,
            })
        } catch (error) {
            console.error('Failed to open conversation:', error)
            setError('Unable to connect to server')
        }
    }

    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <h2>Chats</h2>
            </div>

            <div className="search-container">
                <input
                    type="text"
                    placeholder="Search users..."
                    value={search}
                    onChange={handleSearch}
                />
            </div>

            {error && (
                <p className="sidebar-error">
                    {error}
                </p>
            )}

            <div className="conversation-list">
                {search.trim() ? (
                    searchResults.map((user) => (
                        <button
                            className="conversation-item"
                            key={user.id}
                            onClick={() => openUser(user)}
                        >
                            {user.username}
                        </button>
                    ))
                ) : (
                    conversations.map((conversation) => (
                        <button
                            className="conversation-item"
                            key={conversation.id}
                            onClick={() =>
                                onSelectConversation(conversation)
                            }
                        >
                            {conversation.name}
                        </button>
                    ))
                )}
            </div>
        </aside>
    )
}

export default Sidebar