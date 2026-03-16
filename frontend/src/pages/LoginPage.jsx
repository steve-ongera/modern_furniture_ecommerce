import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../context/AppContext.jsx';
import toast from 'react-hot-toast';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success('Welcome back!');
      navigate(from, { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Login | Morara Modern Furniture</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <div className="auth-page">
        <div className="auth-card">
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{ width: 56, height: 56, background: 'var(--primary)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
              <i className="bi bi-house-heart-fill" style={{ fontSize: 28, color: '#fff' }}></i>
            </div>
            <h2>Welcome Back</h2>
            <p className="subtitle">Sign in to your Morara Furniture account</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Email Address</label>
              <div style={{ position: 'relative' }}>
                <input
                  className="form-control"
                  type="email"
                  placeholder="your@email.com"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  required
                  style={{ paddingLeft: 40 }}
                />
                <i className="bi bi-envelope" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}></i>
              </div>
            </div>

            <div className="form-group">
              <label>Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  className="form-control"
                  type={showPass ? 'text' : 'password'}
                  placeholder="Your password"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  required
                  style={{ paddingLeft: 40, paddingRight: 40 }}
                />
                <i className="bi bi-lock" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}></i>
                <button type="button" style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
                  onClick={() => setShowPass(!showPass)}>
                  <i className={`bi ${showPass ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                </button>
              </div>
            </div>

            <button className="btn btn-primary btn-lg btn-block" type="submit" disabled={loading}>
              {loading ? (
                <><i className="bi bi-hourglass-split"></i> Signing in...</>
              ) : (
                <><i className="bi bi-box-arrow-in-right"></i> Sign In</>
              )}
            </button>
          </form>

          <div className="auth-divider"><span>New to Morara Furniture?</span></div>

          <Link to="/register" className="btn btn-outline btn-lg btn-block" style={{ textAlign: 'center' }}>
            <i className="bi bi-person-plus"></i> Create Account
          </Link>

          <div style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--text-muted)' }}>
            <i className="bi bi-shield-check" style={{ color: 'var(--primary)' }}></i> Your data is secure and protected
          </div>
        </div>
      </div>
    </>
  );
}

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    first_name: '', last_name: '', email: '', username: '',
    phone: '', password: '', confirm_password: '',
  });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm_password) {
      toast.error('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await register(form);
      toast.success('Account created! Welcome to Morara Furniture!');
      navigate('/');
    } catch (err) {
      const errors = err.response?.data;
      if (errors) {
        const msg = Object.values(errors).flat().join(' ');
        toast.error(msg || 'Registration failed');
      } else {
        toast.error('Registration failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const f = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  return (
    <>
      <Helmet>
        <title>Create Account | Morara Modern Furniture</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <div className="auth-page">
        <div className="auth-card">
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{ width: 56, height: 56, background: 'var(--primary)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
              <i className="bi bi-person-plus-fill" style={{ fontSize: 26, color: '#fff' }}></i>
            </div>
            <h2>Create Account</h2>
            <p className="subtitle">Join Morara Furniture & start shopping</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>First Name *</label>
                <input className="form-control" placeholder="John" value={form.first_name}
                  onChange={e => f('first_name', e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Last Name *</label>
                <input className="form-control" placeholder="Doe" value={form.last_name}
                  onChange={e => f('last_name', e.target.value)} required />
              </div>
            </div>

            <div className="form-group">
              <label>Email Address *</label>
              <div style={{ position: 'relative' }}>
                <input className="form-control" type="email" placeholder="your@email.com"
                  value={form.email} onChange={e => f('email', e.target.value)} required
                  style={{ paddingLeft: 40 }} />
                <i className="bi bi-envelope" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}></i>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Username *</label>
                <input className="form-control" placeholder="johndoe" value={form.username}
                  onChange={e => f('username', e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Phone Number</label>
                <input className="form-control" type="tel" placeholder="07XX XXX XXX"
                  value={form.phone} onChange={e => f('phone', e.target.value)} />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Password *</label>
                <div style={{ position: 'relative' }}>
                  <input className="form-control" type={showPass ? 'text' : 'password'}
                    placeholder="Min 8 characters" value={form.password}
                    onChange={e => f('password', e.target.value)} required minLength={8}
                    style={{ paddingRight: 40 }} />
                  <button type="button" style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
                    onClick={() => setShowPass(!showPass)}>
                    <i className={`bi ${showPass ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                  </button>
                </div>
              </div>
              <div className="form-group">
                <label>Confirm Password *</label>
                <input className="form-control" type="password" placeholder="Repeat password"
                  value={form.confirm_password} onChange={e => f('confirm_password', e.target.value)} required />
                {form.confirm_password && form.password !== form.confirm_password && (
                  <span className="form-error">Passwords don't match</span>
                )}
              </div>
            </div>

            <button className="btn btn-primary btn-lg btn-block" type="submit"
              disabled={loading || (form.confirm_password && form.password !== form.confirm_password)}>
              {loading ? <><i className="bi bi-hourglass-split"></i> Creating...</> : <><i className="bi bi-person-check"></i> Create Account</>}
            </button>
          </form>

          <div className="auth-divider"><span>Already have an account?</span></div>
          <Link to="/login" className="btn btn-outline btn-lg btn-block" style={{ textAlign: 'center' }}>
            <i className="bi bi-box-arrow-in-right"></i> Sign In
          </Link>
        </div>
      </div>
    </>
  );
}

// Re-export toast for use in this file
import toast from 'react-hot-toast';

export default LoginPage;