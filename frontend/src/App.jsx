import { useState, useEffect } from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom'
import { getMe} from "./api/auth.js";
import {getCart} from './api/cart.js';
import './App.css'
import UserProfile from './components/UserProfile/UserProfile.jsx'
import Header from './components/Header/Header.jsx'
import AuthModal from './components/AuthModal/AuthModal.jsx'
import AdminProductsPage from "./components/AdminProductsPage/AdminProductsPage.jsx";
import ProductCatalog from './components/ProductCatalog/ProductCatalog.jsx'
import Cart from "./components/Cart/Cart.jsx";
import RequireAdmin from './components/RequireAdmin/RequireAdmin.jsx'

function App() {
  const [msg, setMsg] = useState('')
  const [authOpen, setAuthOpen] = useState(false)
  const [userName, setUserName] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [cartCount, setCartCount] = useState(0)
  const navigate = useNavigate()

  function handleLoggedIn(name) {
    if (name) {
      setUserName(name)
    }
    setAuthOpen(false)

    const t = localStorage.getItem('token')
    if (t) {
        getMe(t)
            .then((data) => {
                const auth = String(data?.authorities ?? '')
                setIsAdmin(auth.includes('ROLE_ADMIN'))
            })
            .catch(() => setIsAdmin((false)))
    } else {
        setIsAdmin(false)
    }

    loadCartCount()
  }

  function handleLogout(){
      localStorage.removeItem('token')
      localStorage.removeItem('username')
      setUserName(null)
      setIsAdmin(false)
      loadCartCount()
      if(location.pathname === '/profile'){
          navigate('/', {replace:true})
      }
      if(location.pathname === '/admin/products'){
          navigate('/', {replace:true})
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
                    const auth = String(data.authorities ?? '')
                    setIsAdmin(auth.includes('ROLE_ADMIN'))
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
        isAdmin={isAdmin}
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
                element={<UserProfile onMessage={setMsg} />}
            />
            <Route
                path="/admin/products"
                element={
                    <RequireAdmin>
                        <AdminProductsPage />
                    </RequireAdmin>
                }
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
