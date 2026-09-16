import { useState } from 'react'
import Login from './components/Login'
import Register from './components/Register'
import Sidebar from './components/Sidebar'
import ChatWindow from './components/ChatWindow'
import './App.css'

function App() {
    const [isLoggedIn, setIsLoggedIn] = useState(
        Boolean(localStorage.getItem('token'))
    )

    const [showRegister, setShowRegister] = useState(false)
    const [currentConversation, setCurrentConversation] = useState(null)

    function handleLogout() {
        localStorage.removeItem('token')
        setIsLoggedIn(false)
        setCurrentConversation(null)
    }

    if (!isLoggedIn) {
        if (showRegister) {
            return (
                <Register
                    onRegister={() => setShowRegister(false)}
                    onLoginClick={() => setShowRegister(false)}
                />
            )
        }

        return (
            <Login
                onLogin={() => setIsLoggedIn(true)}
                onRegisterClick={() => setShowRegister(true)}
            />
        )
    }

    return (
        <div className="app">
            <header className="app-header">
                <h1>Chat App</h1>

                <button onClick={handleLogout}>
                    Logout
                </button>
            </header>

            <main className="chat-layout">
                <Sidebar
                    onSelectConversation={setCurrentConversation}
                />

                <ChatWindow
                    conversation={currentConversation}
                />
            </main>
        </div>
    )
}

export default App