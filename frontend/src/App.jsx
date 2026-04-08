import { useState, useEffect } from 'react'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { getMe} from "./api/auth.js";
import {addToCart, getCart} from './api/cart.js';
import './App.css'
import UserProfile from './components/UserProfile/UserProfile.jsx'
import Header from './components/Header/Header.jsx'
import AuthModal from './components/AuthModal/AuthModal.jsx'
import AdminProductsPage from "./components/AdminProductsPage/AdminProductsPage.jsx";
import ProductCatalog from './components/ProductCatalog/ProductCatalog.jsx'
import Cart from "./components/Cart/Cart.jsx";
import RequireAdmin from './components/RequireAdmin/RequireAdmin.jsx'
import ProductDetail from "./components/ProductDetail/ProductDetail.jsx";

function App() {
  const [msg, setMsg] = useState('')
  const [authOpen, setAuthOpen] = useState(false)
  const [userName, setUserName] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [cartCount, setCartCount] = useState(0)
  const navigate = useNavigate()
  const location = useLocation()

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
      if (location.pathname === '/cart') {
          navigate('/', { replace: true })
      }
      if (location.pathname.startsWith('/products/')){
          navigate('/',{replace:true})
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

    useEffect(() => {
        if (location.state?.openAuth) {
            setAuthOpen(true)
            navigate(location.pathname, { replace: true, state: {} })
        }
    }, [location, navigate])
  return (
    <>
      <Header
        onOpenAuth={() => {
            setMsg('')
            setAuthOpen(true)
        }}
        userName={userName}
        isAdmin={isAdmin}
        onLogout={handleLogout}
        cartCount={cartCount}
      />
      <AuthModal
        open={authOpen}
        onClose={() => {
            setMsg('')
            setAuthOpen(false)
        }}
        onMessage={setMsg}
        onLoggedIn={handleLoggedIn}
        message={msg}
      />

        <Routes>
            <Route
                path='/'
                element={
                    <ProductCatalog
                        userName={userName}
                        onNeedAuth={() => {
                            setMsg('')
                            setAuthOpen(true)
                        }}
                        onCartUpdate={setCartCount}
                    />
                }
            />
            <Route
                path='/products/:id'
                element={<ProductDetail
                            isLoggedIn={!!userName}
                            onNeedAuth={()=>setAuthOpen(true)}
                            onAdd={async (productId)=>{
                                const token = localStorage.getItem('token');
                                const cart = await addToCart(token, productId, 1);
                                setCartCount(cart.itemCount);
                            }}
                />}
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
                element={<Cart onCartUpdate={setCartCount} onNeedAuth={() => {
                    setMsg('')
                    setAuthOpen(true)
                }}/>}
            />
        </Routes>

    </>
  )
}

export default App
