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
import AdminLayout from "./components/AdminLayout/AdminLayout.jsx";
import AdminDashboard from "./components/AdminDashboard/AdminDashboard.jsx";
import AdminInventoryPage from "./components/AdminInventoryPage/AdminInventoryPage.jsx";
import AdminOrdersPage from "./components/AdminOrdersPage/AdminOrdersPage.jsx";
import AdminUsersPage from "./components/AdminUsersPage/AdminUsersPage.jsx";
import OrderListPage from "./components/OrderListPage/OrderListPage.jsx";
import OrderDetailPage from "./components/OrderDetailPage/OrderDetailPage.jsx";

function App() {
  const [msg, setMsg] = useState('')
  const [authOpen, setAuthOpen] = useState(false)
  const [userName, setUserName] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [userRole, setUserRole] = useState('')
  const [userPermissions, setUserPermissions] = useState([])
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const [cartCount, setCartCount] = useState(0)
  const navigate = useNavigate()
  const location = useLocation()
  const isAdminPage = location.pathname.startsWith('/admin')
  const [productSearch, setProductSearch] = useState('')
  const [shippingLocation, setShippingLocation]  = useState(() => {
      try{
          return JSON.parse(localStorage.getItem('shippingLocation') || 'null') || {city: 'Seattle', zip: '98000'}
      }catch{
          return {city:'Seattle', zip:'98000'}
      }
  })

    useEffect(() => {
        localStorage.setItem('shippingLocation', JSON.stringify(shippingLocation))
    }, [shippingLocation]);

  function handleLoggedIn(name) {
    if (name) {
      setUserName(name)
    }
    setAuthOpen(false)

    const t = localStorage.getItem('token')
    if (t) {
        getMe(t)
            .then((data) => {
                setIsAdmin(data?.isAdmin === true)
                setUserRole(String(data?.authorities ?? '').split(',')[0] || '')
                setUserPermissions(data?.permissions ?? [])
                setIsSuperAdmin(data?.isSuperAdmin === true)
            })
            .catch(() => { setIsAdmin(false); setUserRole(''); setUserPermissions([]); setIsSuperAdmin(false) })
    } else {
        setIsAdmin(false)
    }

    loadCartCount()

    const path = sessionStorage.getItem('postLoginRedirect')
    if (path){
        navigate(path,{replace: true})
    }
    sessionStorage.removeItem('postLoginRedirect')
  }

  function handleLogout(){
      localStorage.removeItem('token')
      localStorage.removeItem('username')
      setUserName(null)
      setIsAdmin(false)
      setUserRole('')
      setUserPermissions([])
      setIsSuperAdmin(false)
      loadCartCount()
      if(location.pathname === '/profile'){
          navigate('/', {replace:true})
      }
      if(location.pathname.startsWith('/admin')){
          navigate('/', {replace:true})
      }
      if (location.pathname === '/cart') {
          navigate('/', { replace: true })
      }
      if (location.pathname.startsWith('/products/')){
          navigate('/',{replace:true})
      }
      if (location.pathname.startsWith('/orders')){
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
                    setIsAdmin(data.isAdmin === true)
                    setUserRole(String(data.authorities ?? '').split(',')[0] || '')
                    setUserPermissions(data.permissions ?? [])
                    setIsSuperAdmin(data.isSuperAdmin === true)
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
        {!isAdminPage && <Header
        onOpenAuth={() => {
            setMsg('')
            setAuthOpen(true)
        }}
        userName={userName}
        isAdmin={isAdmin}
        onLogout={handleLogout}
        cartCount={cartCount}
        searchValue={productSearch}
        onSearchChange={setProductSearch}
        shippingLocation={shippingLocation}
        onChangeShippingLocation={setShippingLocation}
      />}
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
                        search={productSearch}
                        onSearchChange={setProductSearch}
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
                path="/admin/*"
                element={
                    <RequireAdmin>
                        <AdminLayout userName={userName} userRole={userRole} userPermissions={userPermissions} isSuperAdmin={isSuperAdmin} onLogout={handleLogout}>
                            <Routes>
                                <Route path="dashboard" element={<AdminDashboard />} />
                                <Route path="products" element={<AdminProductsPage />} />
                                <Route path="inventory" element={<AdminInventoryPage />} />
                                <Route path="orders" element={<AdminOrdersPage />} />
                                <Route path="users" element={<AdminUsersPage userPermissions={userPermissions} isSuperAdmin={isSuperAdmin} />} />
                            </Routes>
                        </AdminLayout>
                    </RequireAdmin>
                }
            />
            <Route
                path="/cart"
                element={
                <Cart
                    onCartUpdate={setCartCount}
                    onNeedAuth={() => {
                    setMsg('')
                    setAuthOpen(true)
                    }}
                    userName={userName}
                />
            }
            />

            <Route
                path='/orders'
                element={
                <OrderListPage
                    onNeedAuth={() => {
                        setMsg('')
                        setAuthOpen(true)
                    }}
                    userName={userName}
                />}
            />
            <Route
                path='/orders/:orderId'
                element={
                <OrderDetailPage
                    onNeedAuth={() => {
                        setMsg('')
                        setAuthOpen(true)
                    }}
                    userName={userName}
                />}
            />
        </Routes>

    </>
  )
}

export default App
