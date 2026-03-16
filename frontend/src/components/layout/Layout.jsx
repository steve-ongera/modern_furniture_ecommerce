import { Outlet } from 'react-router-dom';
import Navbar from './Navbar.jsx';
import Footer from './Footer.jsx';

export default function Layout() {
  return (
    <>
      <Navbar />
      <main style={{ minHeight: 'calc(100vh - 40px - 64px)' }}>
        <Outlet />
      </main>
      <Footer />
    </>
  );
}