import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';

export default function Register({ onRegister }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [flatNo, setFlatNo] = useState('');
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('email', email);
      formData.append('password', password);
      formData.append('phone', phone);
      formData.append('flat_no', flatNo);
      if (profile) {
        formData.append('profile', profile);
      }
      const response = await api.post('/auth/register', formData);
      onRegister(response.data.user, response.data.token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    }
  };

  return (
    <div className="row justify-content-center">
      <div className="col-12 col-md-8 col-lg-7">
        <div className="card shadow-sm auth-card">
          <div className="card-body">
            <h3 className="card-title mb-4">Register as Member</h3>
            {error && <div className="alert alert-danger">{error}</div>}
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label">Full Name</label>
                <input className="form-control" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="mb-3">
                <label className="form-label">Email</label>
                <input className="form-control" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="mb-3">
                <label className="form-label">Password</label>
                <input className="form-control" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
              <div className="mb-3">
                <label className="form-label">Phone</label>
                <input className="form-control" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <div className="mb-3">
                <label className="form-label">Flat Number</label>
                <input className="form-control" value={flatNo} onChange={(e) => setFlatNo(e.target.value)} required />
              </div>
              <div className="mb-3">
                <label className="form-label">Profile Image</label>
                <input className="form-control" type="file" accept="image/png, image/jpeg" onChange={(e) => setProfile(e.target.files[0] || null)} />
              </div>
              <button className="btn btn-primary w-100" type="submit">Register</button>
            </form>
            <div className="mt-3 text-center">
              <Link to="/login">Already have an account?</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
