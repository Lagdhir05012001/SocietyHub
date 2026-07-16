import React, { useEffect, useState } from 'react';
import api from '../api';
import { downloadCsv, downloadPdf } from '../utils';
import Pagination from '../components/Pagination';

const PAGE_SIZE = 10;

export default function Workers({ user }) {
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', phone: '', type: '', salary: '' });
  const [editId, setEditId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const loadWorkers = () => {
    setLoading(true);
    api.get('/workers')
      .then((res) => setWorkers(res.data))
      .catch(() => setError('Unable to load workers'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadWorkers();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    try {
      if (editId) {
        await api.put(`/workers/${editId}`, form);
      } else {
        await api.post('/workers', form);
      }
      setForm({ name: '', phone: '', type: '', salary: '' });
      setEditId(null);
      loadWorkers();
    } catch (err) {
      setError(err.response?.data?.error || 'Unable to save worker');
    }
  };

  const startEdit = (worker) => {
    setEditId(worker.id);
    setForm({ name: worker.name, phone: worker.phone || '', type: worker.type || '', salary: worker.salary || '' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this worker?')) return;
    try {
      await api.delete(`/workers/${id}`);
      loadWorkers();
    } catch {
      setError('Unable to delete worker');
    }
  };

  const exportCsv = () => {
    const headers = ['Name', 'Type', 'Phone', 'Salary'];
    const rows = workers.map((worker) => [worker.name, worker.type, worker.phone || '', worker.salary]);
    downloadCsv('workers.csv', headers, rows);
  };

  const exportPdf = () => {
    const headers = ['Name', 'Type', 'Phone', 'Salary'];
    const rows = workers.map((worker) => [worker.name, worker.type, worker.phone || '', worker.salary]);
    downloadPdf('workers.pdf', 'Workers', headers, rows);
  };

  const filteredWorkers = workers.filter((worker) => {
    const search = searchTerm.trim().toLowerCase();
    if (!search) return true;
    return worker.name.toLowerCase().includes(search) || worker.type.toLowerCase().includes(search);
  });

  const totalPages = Math.max(1, Math.ceil(filteredWorkers.length / PAGE_SIZE));
  const displayedWorkers = filteredWorkers.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const summary = {
    total: workers.length,
    filtered: filteredWorkers.length,
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2>Workers</h2>
        <div>
          <button className="btn btn-outline-secondary me-2" onClick={exportCsv}>Export CSV</button>
          <button className="btn btn-outline-secondary" onClick={exportPdf}>Export PDF</button>
        </div>
      </div>
      <div className="mb-3">
        <span className="badge bg-primary me-2">Total workers: {summary.total}</span>
        <span className="badge bg-secondary">Showing: {summary.filtered}</span>
      </div>
      {error && <div className="alert alert-danger">{error}</div>}
      {user.role === 'admin' && (
        <div className="card mb-4 shadow-sm">
          <div className="card-header">{editId ? 'Edit Worker' : 'Add Worker'}</div>
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label">Name</label>
                  <input className="form-control" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Type</label>
                  <input className="form-control" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} required />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Phone</label>
                  <input className="form-control" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Salary</label>
                  <input className="form-control" type="number" min="0" step="0.01" value={form.salary} onChange={(e) => setForm({ ...form, salary: e.target.value })} />
                </div>
              </div>
              <div className="mt-3">
                <button className="btn btn-primary me-2" type="submit">{editId ? 'Update Worker' : 'Add Worker'}</button>
                {editId && <button className="btn btn-secondary" type="button" onClick={() => { setEditId(null); setForm({ name: '', phone: '', type: '', salary: '' }); }}>Cancel</button>}
              </div>
            </form>
          </div>
        </div>
      )}
      <div className="card mb-3 shadow-sm">
        <div className="card-body">
          <div className="row g-3 align-items-end">
            <div className="col-md-4">
              <label className="form-label">Search Workers</label>
              <input
                className="form-control"
                type="search"
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                placeholder="Search by name or type"
              />
            </div>
          </div>
        </div>
      </div>
      <div className="card shadow-sm">
        <div className="card-body p-0">
          {loading ? (
            <div className="p-3">Loading workers...</div>
          ) : (
            <table className="table mb-0">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Phone</th>
                  <th>Salary</th>
                  {user.role === 'admin' && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {displayedWorkers.map((worker) => (
                  <tr key={worker.id}>
                    <td>{worker.name}</td>
                    <td>{worker.type}</td>
                    <td>{worker.phone}</td>
                    <td>{worker.salary}</td>
                    {user.role === 'admin' && (
                      <td>
                        <button className="btn btn-sm btn-outline-secondary me-2" onClick={() => startEdit(worker)}>Edit</button>
                        <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(worker.id)}>Delete</button>
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
