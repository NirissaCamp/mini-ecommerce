import { useState, useEffect } from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom'
import { getMe} from "./api/auth.js";
import './App.css'
import UserProfile from './components/UserProfile/UserProfile.jsx'
import Header from './components/Header/Header.jsx'
import AuthModal from './components/AuthModal/AuthModal.jsx'

function App() {
  const [msg, setMsg] = useState('')
  const [authOpen, setAuthOpen] = useState(false)
  const [userName, setUserName] = useState(null)
  const navigate = useNavigate()

  function handleLoggedIn(name) {
    if (name) {
      setUserName(name)
    }
    setAuthOpen(false)
  }

  function handleLogout(){
      localStorage.removeItem('token')
      localStorage.removeItem('username')
      setUserName(null)
      if(location.pathname === '/profile'){
          navigate('/', {replace:true})
      }
  }

    useEffect(() => {
        const token = localStorage.getItem('token')
        if (!token) {
            setUserName(null)
            return
        }

        getMe(token)
            .then((data) => {
                if (data && data.username != null) {
                    setUserName(data.username)
                } else {
                    setUserName(null)
                }
            })
            .catch(() => {
                localStorage.removeItem('token')
                localStorage.removeItem('username')
                setUserName(null)
            })
    }, [])
  return (
    <>
      <Header
        onOpenAuth={() => setAuthOpen(true)}
        userName={userName}
        onLogout={handleLogout}
      />
      <AuthModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        onMessage={setMsg}
        onLoggedIn={handleLoggedIn}
      />
        <Routes>
            <Route
                path='/'
                element={
                    <main>
                        <p>Products Coming Soon...</p>
                    </main>
                }
            />
            <Route
                path="/profile"
                element={<UserProfile onMessage={setMsg} />}
            />
        </Routes>

    </>
  )
}

export default App
