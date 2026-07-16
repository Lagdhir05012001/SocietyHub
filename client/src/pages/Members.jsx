import React, { useEffect, useState } from 'react';
import api from '../api';
import { downloadCsv, downloadPdf } from '../utils';
import Pagination from '../components/Pagination';

const PAGE_SIZE = 10;

export default function Members({ user }) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', email: '', phone: '', flat_no: '', password: '' });
  const [profileFile, setProfileFile] = useState(null);
  const [profileKey, setProfileKey] = useState(Date.now());
  const [editId, setEditId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const loadMembers = () => {
    setLoading(true);
    api.get('/members')
      .then((res) => setMembers(res.data))
      .catch(() => setError('Unable to load members'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadMembers();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    try {
      const formData = new FormData();
      formData.append('name', form.name);
      formData.append('email', form.email);
      formData.append('phone', form.phone);
      formData.append('flat_no', form.flat_no);
      if (form.password) {
        formData.append('password', form.password);
      }
      if (profileFile) {
        formData.append('profile', profileFile);
      }

      if (editId) {
        await api.put(`/members/${editId}`, formData);
      } else {
        await api.post('/members', formData);
      }
      setForm({ name: '', email: '', phone: '', flat_no: '', password: '' });
      setProfileFile(null);
      setProfileKey(Date.now());
      setEditId(null);
      loadMembers();
    } catch (err) {
      setError(err.response?.data?.error || 'Unable to save member');
    }
  };

  const startEdit = (member) => {
    setEditId(member.id);
    setForm({ name: member.name, email: member.email, phone: member.phone || '', flat_no: member.flat_no || '', password: '' });
    setProfileFile(null);
    setProfileKey(Date.now());
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this member?')) return;
    try {
      await api.delete(`/members/${id}`);
      loadMembers();
    } catch {
      setError('Unable to delete member');
    }
  };

  const exportCsv = () => {
    const headers = ['Name', 'Email', 'Phone', 'Flat'];
    const rows = members.map((member) => [member.name, member.email, member.phone || '', member.flat_no]);
    downloadCsv('members.csv', headers, rows);
  };

  const exportPdf = () => {
    const headers = ['Name', 'Email', 'Phone', 'Flat'];
    const rows = members.map((member) => [member.name, member.email, member.phone || '', member.flat_no]);
    downloadPdf('members.pdf', 'Members', headers, rows);
  };

  const filteredMembers = members.filter((member) => {
    const search = searchTerm.trim().toLowerCase();
    if (!search) return true;
    return member.name.toLowerCase().includes(search) || member.email.toLowerCase().includes(search);
  });

  const totalPages = Math.max(1, Math.ceil(filteredMembers.length / PAGE_SIZE));
  const displayedMembers = filteredMembers.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const summary = {
    total: members.length,
    filtered: filteredMembers.length,
  };
  const baseUrl = api.defaults.baseURL || '';

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2>Members</h2>
        <div>
          <button className="btn btn-outline-secondary me-2" onClick={exportCsv}>Export CSV</button>
          <button className="btn btn-outline-secondary" onClick={exportPdf}>Export PDF</button>
        </div>
      </div>
      <div className="mb-3">
        <span className="badge bg-primary me-2">Total members: {summary.total}</span>
        <span className="badge bg-secondary">Showing: {summary.filtered}</span>
      </div>
      {error && <div className="alert alert-danger">{error}</div>}
      {user.role === 'admin' && (
        <div className="card mb-4 shadow-sm">
          <div className="card-header">{editId ? 'Edit Member' : 'Add Member'}</div>
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label">Name</label>
                  <input className="form-control" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Email</label>
                  <input className="form-control" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Phone</label>
                  <input className="form-control" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Flat Number</label>
                  <input className="form-control" value={form.flat_no} onChange={(e) => setForm({ ...form, flat_no: e.target.value })} required />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Password</label>
                  <input className="form-control" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder={editId ? 'Leave blank to keep current password' : ''} />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Profile Image</label>
                  <input
                    key={profileKey}
                    className="form-control"
                    type="file"
                    accept="image/png, image/jpeg"
                    onChange={(e) => setProfileFile(e.target.files[0] || null)}
                  />
                  {editId && <small className="text-muted">Leave blank to keep existing profile</small>}
                </div>
              </div>
              <div className="mt-3">
                <button className="btn btn-primary me-2" type="submit">{editId ? 'Update Member' : 'Add Member'}</button>
                {editId && <button className="btn btn-secondary" type="button" onClick={() => { setEditId(null); setForm({ name: '', email: '', phone: '', flat_no: '', password: '' }); setProfileFile(null); setProfileKey(Date.now()); }}>Cancel</button>}
              </div>
            </form>
          </div>
        </div>
      )}
      <div className="card mb-3 shadow-sm">
        <div className="card-body">
          <div className="row g-3 align-items-end">
            <div className="col-md-4">
              <label className="form-label">Search Members</label>
              <input
                className="form-control"
                type="search"
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                placeholder="Search by name or email"
              />
            </div>
          </div>
        </div>
      </div>
      <div className="card shadow-sm">
        <div className="card-body p-0">
          {loading ? (
            <div className="p-3">Loading members...</div>
          ) : (
            <table className="table mb-0">
              <thead>
                <tr>
                  <th>Profile</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Flat</th>
                  {user.role === 'admin' && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {displayedMembers.map((member) => (
                  <tr key={member.id}>
                    <td>
                      {member.profile_image ? (
                        <img
                          src={`${baseUrl}/uploads/${member.profile_image}`}
                          alt={member.name}
                          className="rounded-circle"
                          style={{ width: 36, height: 36, objectFit: 'cover' }}
                        />
                      ) : (
                        <div className="bg-secondary text-white rounded-circle d-inline-flex justify-content-center align-items-center" style={{ width: 36, height: 36 }}>
                          {member.name?.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </td>
                    <td>{member.name}</td>
                    <td>{member.email}</td>
                    <td>{member.phone}</td>
                    <td>{member.flat_no}</td>
                    {user.role === 'admin' && (
                      <td>
                        <button className="btn btn-sm btn-outline-secondary me-2" onClick={() => startEdit(member)}>Edit</button>
                        <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(member.id)}>Delete</button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
    </div>
  );
}
