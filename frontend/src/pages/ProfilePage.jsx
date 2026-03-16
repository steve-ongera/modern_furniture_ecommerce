import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AppContext.jsx';
import { authAPI, locationsAPI } from '../services/api.js';
import { Breadcrumb } from '../components/common/ProtectedRoute.jsx';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { user, setUser } = useAuth();
  const [counties, setCounties] = useState([]);
  const [form, setForm] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    phone: user?.phone || '',
    city: user?.city || '',
    address: user?.address || '',
    county: user?.county || '',
  });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');

  useEffect(() => {
    locationsAPI.counties().then(r => setCounties(r.data.results || r.data)).catch(() => {});
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await authAPI.updateProfile(form);
      setUser(res.data);
      toast.success('Profile updated successfully!');
    } catch (err) {
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const f = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const TABS = [
    { key: 'profile', icon: 'bi-person', label: 'Profile' },
    { key: 'security', icon: 'bi-shield-lock', label: 'Security' },
  ];

  return (
    <>
      <Helmet>
        <title>My Profile | Morara Modern Furniture</title>
        <meta name="robots" content="noindex" />
      </Helmet>

      <div className="container">
        <Breadcrumb items={[{ label: 'My Profile' }]} />

        <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 24, padding: '24px 0' }}>
          {/* Sidebar */}
          <aside>
            {/* Avatar */}
            <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: 24, textAlign: 'center', marginBottom: 16 }}>
              <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', fontSize: 28, color: '#fff', fontFamily: 'var(--font-display)', fontWeight: 700 }}>
                {(user?.first_name?.[0] || user?.email?.[0] || 'U').toUpperCase()}
              </div>
              <div style={{ fontWeight: 700, fontSize: 16 }}>{user?.first_name} {user?.last_name}</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>{user?.email}</div>
            </div>

            {/* Nav */}
            <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
              {TABS.map(tab => (
                <button key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px',
                    width: '100%', borderBottom: '1px solid var(--border)', fontSize: 14,
                    background: activeTab === tab.key ? 'var(--light-gray)' : 'transparent',
                    color: activeTab === tab.key ? 'var(--primary)' : 'var(--text-dark)',
                    fontWeight: activeTab === tab.key ? 600 : 400,
                  }}>
                  <i className={`bi ${tab.icon}`} style={{ color: 'var(--primary)' }}></i> {tab.label}
                </button>
              ))}
              <Link to="/orders" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', fontSize: 14, borderBottom: '1px solid var(--border)' }}>
                <i className="bi bi-bag" style={{ color: 'var(--primary)' }}></i> My Orders
              </Link>
              <Link to="/wishlist" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', fontSize: 14 }}>
                <i className="bi bi-heart" style={{ color: 'var(--primary)' }}></i> Wishlist
              </Link>
            </div>
          </aside>

          {/* Content */}
          <div>
            {activeTab === 'profile' && (
              <div className="form-card">
                <h3><i className="bi bi-person"></i> Personal Information</h3>
                <form onSubmit={handleSave}>
                  <div className="form-row">
                    <div className="form-group">
                      <label>First Name</label>
                      <input className="form-control" value={form.first_name}
                        onChange={e => f('first_name', e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label>Last Name</label>
                      <input className="form-control" value={form.last_name}
                        onChange={e => f('last_name', e.target.value)} />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Email Address</label>
                    <input className="form-control" value={user?.email} disabled
                      style={{ background: 'var(--off-white)', cursor: 'not-allowed' }} />
                    <small style={{ color: 'var(--text-muted)', fontSize: 12 }}>Email cannot be changed</small>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Phone Number</label>
                      <input className="form-control" type="tel" value={form.phone}
                        onChange={e => f('phone', e.target.value)} placeholder="07XX XXX XXX" />
                    </div>
                    <div className="form-group">
                      <label>City / Town</label>
                      <input className="form-control" value={form.city}
                        onChange={e => f('city', e.target.value)} placeholder="e.g. Nairobi" />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>County</label>
                    <select className="form-control" value={form.county}
                      onChange={e => f('county', e.target.value)}>
                      <option value="">Select county...</option>
                      {counties.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Delivery Address</label>
                    <textarea className="form-control" rows={3} value={form.address}
                      onChange={e => f('address', e.target.value)}
                      placeholder="Street, House Number, Estate..." />
                  </div>

                  <button className="btn btn-primary" type="submit" disabled={loading}>
                    {loading ? 'Saving...' : <><i className="bi bi-check2"></i> Save Changes</>}
                  </button>
                </form>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="form-card">
                <h3><i className="bi bi-shield-lock"></i> Security Settings</h3>
                <div style={{ padding: '16px', background: 'var(--off-white)', borderRadius: 'var(--radius-md)', marginBottom: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <i className="bi bi-check-circle-fill" style={{ color: 'var(--primary)', fontSize: 20 }}></i>
                    <div>
                      <div style={{ fontWeight: 600 }}>Password</div>
                      <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Last changed: Unknown</div>
                    </div>
                  </div>
                </div>
                <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 16 }}>
                  Password change functionality can be integrated via the API endpoint.
                </p>
                <div style={{ background: '#e8f5e9', padding: 16, borderRadius: 'var(--radius-md)', fontSize: 14 }}>
                  <i className="bi bi-info-circle" style={{ color: 'var(--primary)' }}></i> Contact us at <strong>info@morarafurniture.co.ke</strong> to change your password or account details.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}