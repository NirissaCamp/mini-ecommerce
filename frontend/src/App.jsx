import { useState, useEffect } from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom'
import { getMe} from "./api/auth.js";
import {getCart} from './api/cart.js';
import './App.css'
import UserProfile from './components/UserProfile/UserProfile.jsx'
import Header from './components/Header/Header.jsx'
import AuthModal from './components/AuthModal/AuthModal.jsx'
import ProductCatalog from './components/ProductCatalog/ProductCatalog.jsx'
import Cart from "./components/Cart/Cart.jsx";

function App() {
    const [msg, setMsg] = useState('')
    const [authOpen, setAuthOpen] = useState(false)
    const [userName, setUserName] = useState(null)
    const [cartCount, setCartCount] = useState(0)
    const navigate = useNavigate()

    function handleLoggedIn(name) {
        if (name) {
            setUserName(name)
        }
        setAuthOpen(false)
        loadCartCount()
    }

    function handleLogout() {
        localStorage.removeItem('token')
        localStorage.removeItem('username')
        setUserName(null)
        setCartCount(0)
        if (location.pathname === '/profile') {
            navigate('/', {replace: true})
        }
    }

    function loadCartCount() {
        const token = localStorage.getItem('token')
        if (!token) {
            setCartCount(0);
            return;
        }
        getCart(token)
            .then(cart => setCartCount(cart?.itemCount ?? 0))
            .catch(() => {
            })
    }

    useEffect(() => {
        const token = localStorage.getItem('token')
        if (!token) {
            setUserName(null)
            setIsAdmin(false)
            return
        }

        getMe(token)
            .then((data) => {
                if (data && data.username != null) {
                    setUserName(data.username)
                    loadCartCount()
                } else {
                    setUserName(null)
                    setIsAdmin(false)
                }
            })
            .catch(() => {
                localStorage.removeItem('token')
                localStorage.removeItem('username')
                setUserName(null)
                setIsAdmin(false)
            })
    }, [])
    return (
        <>
            <Header
                onOpenAuth={() => setAuthOpen(true)}
                userName={userName}
                onLogout={handleLogout}
                cartCount={cartCount}
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
                        <ProductCatalog
                            userName={userName}
                            onNeedAuth={() => setAuthOpen(true)}
                            onCartUpdate={setCartCount}
                        />
                    }
                />
                <Route
                    path="/profile"
                    element={<UserProfile onMessage={setMsg}/>}
                />
                <Route
                    path="/cart"
                    element={<Cart onCartUpdate={setCartCount} onNeedAuth={() => setAuthOpen(true)}/>}
                />
            </Routes>
        </>
    )

}
export default App
