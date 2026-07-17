import React, { useEffect, useState } from 'react';
import api from '../api';
import { downloadCsv, downloadPdf, formatDateTime } from '../utils';
import Pagination from '../components/Pagination';

const PAGE_SIZE = 10;
const months = [
  { value: '01', label: 'January' },
  { value: '02', label: 'February' },
  { value: '03', label: 'March' },
  { value: '04', label: 'April' },
  { value: '05', label: 'May' },
  { value: '06', label: 'June' },
  { value: '07', label: 'July' },
  { value: '08', label: 'August' },
  { value: '09', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' },
];
const years = ['2026', '2027', '2028', '2029', '2030'];

export default function Maintenance({ user }) {
  const [records, setRecords] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ member_id: '', month: '', year: '', amount: '', status: '' });
  const [generate, setGenerate] = useState({ month: '', year: '', amount: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [monthFilter, setMonthFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const loadData = () => {
    setLoading(true);
    Promise.all([api.get('/maintenance'), api.get('/members')])
      .then(([maintenanceRes, membersRes]) => {
        setRecords(maintenanceRes.data);
        setMembers(membersRes.data);
      })
      .catch(() => setError('Unable to load maintenance data'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const buildMonthYear = (month, year) => {
    if (!year || !month) return '';
    return `${year}-${month}`;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    try {
      const month_year = buildMonthYear(form.month, form.year);
      const payload = {
        member_id: form.member_id,
        month_year,
        amount: form.amount,
        status: form.status,
      };
      if (editId) {
        await api.put(`/maintenance/${editId}`, payload);
      } else {
        await api.post('/maintenance', payload);
      }
      setForm({ member_id: '', month: '', year: '', amount: '', status: '' });
      setEditId(null);
      loadData();
    } catch (err) {
      setError(err.response?.data?.error || 'Unable to create maintenance record');
    }
  };

  const handleGenerate = async (event) => {
    event.preventDefault();
    setError('');
    try {
      const month_year = buildMonthYear(generate.month, generate.year);
      await api.post('/maintenance/generate', { month_year, amount: generate.amount });
      setGenerate({ month: '', year: '', amount: '' });
      loadData();
    } catch (err) {
      setError(err.response?.data?.error || 'Unable to generate maintenance');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this maintenance record?')) return;
    try {
      await api.delete(`/maintenance/${id}`);
      loadData();
    } catch {
      setError('Unable to delete maintenance record');
    }
  };

  const startEdit = (record) => {
    const [year, month] = record.month_year.split('-');
    setEditId(record.id);
    setForm({ member_id: record.member_id, month, year, amount: record.amount, status: record.status || '' });
  };

  const cancelEdit = () => {
    setEditId(null);
    setForm({ member_id: '', month: '', year: '', amount: '', status: '' });
  };

  const exportCsv = () => {
    const headers = ['Month', 'Member', 'Flat', 'Amount', 'Status', 'Paid Date'];
    const rows = records.map((record) => [record.month_year, record.member_name, record.flat_no, record.amount, record.status, formatDateTime(record.paid_date)]);
    downloadCsv('maintenance.csv', headers, rows);
  };

  const exportPdf = () => {
    const headers = ['Month', 'Member', 'Flat', 'Amount', 'Status', 'Paid Date'];
    const rows = filteredRecords.map((record) => [record.month_year, record.member_name, record.flat_no, record.amount, record.status, formatDateTime(record.paid_date)]);
    downloadPdf('maintenance.pdf', 'Maintenance Records', headers, rows);
  };

  const filteredRecords = records.filter((record) => {
    const search = searchTerm.trim().toLowerCase();
    const matchesName = !search || record.member_name.toLowerCase().includes(search);
    const matchesStatus = !statusFilter || record.status === statusFilter;
    const [year = '', month = ''] = record.month_year ? record.month_year.split('-') : ['',''];
    const matchesMonth = !monthFilter || month === monthFilter;
    const matchesYear = !yearFilter || year === yearFilter;
    return matchesName && matchesStatus && matchesMonth && matchesYear;
  });

  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / PAGE_SIZE));
  const displayedRecords = filteredRecords.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const paidAmount = filteredRecords.reduce((sum, record) => sum + (record.status === 'Paid' ? Number(record.amount || 0) : 0), 0);
  const unpaidAmount = filteredRecords.reduce((sum, record) => sum + (record.status !== 'Paid' ? Number(record.amount || 0) : 0), 0);
  const summary = {
    total: records.length,
    filtered: filteredRecords.length,
    amount: filteredRecords.reduce((sum, record) => sum + Number(record.amount || 0), 0),
    paidAmount,
    unpaidAmount,
  };

  return (
    <div>
    <div className="page-header">
      <h2 className="page-title">Maintenance Records</h2>
      <div className="page-actions">
        <button className="btn btn-outline-secondary" onClick={exportCsv}>Export CSV</button>
          <button className="btn btn-outline-secondary" onClick={exportPdf}>Export PDF</button>
        </div>
      </div>
    <div className="summary-badges">
      <span className="badge bg-primary">Total records: {summary.total}</span>
      <span className="badge bg-secondary">Filtered: {summary.filtered}</span>
      <span className="badge bg-success">Total amount: ₹{summary.amount.toFixed(2)}</span>
      <span className="badge bg-info text-dark">Paid amount: ₹{summary.paidAmount.toFixed(2)}</span>
        <span className="badge bg-warning text-dark">Unpaid amount: ₹{summary.unpaidAmount.toFixed(2)}</span>
      </div>
      {error && <div className="alert alert-danger">{error}</div>}
      {user.role === 'admin' && (
        <>
          <div className="card mb-4 shadow-sm">
            <div className="card-header">{editId ? 'Edit Maintenance' : 'Add Maintenance'}</div>
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                <div className="row g-3">
                  <div className="col-12 col-md-4">
                    <label className="form-label">Member</label>
                    <select className="form-select" value={form.member_id} onChange={(e) => setForm({ ...form, member_id: e.target.value })} required>
                      <option value="">Select member</option>
                      {members.map((member) => (
                        <option key={member.id} value={member.id}>{member.name} - {member.flat_no}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-12 col-sm-6 col-md-2">
                    <label className="form-label">Month</label>
                    <select className="form-select" value={form.month} onChange={(e) => setForm({ ...form, month: e.target.value })} required>
                      <option value="">Month</option>
                      {months.map((month) => (
                        <option key={month.value} value={month.value}>{month.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-12 col-sm-6 col-md-2">
                    <label className="form-label">Year</label>
                    <select className="form-select" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} required>
                      <option value="">Year</option>
                      {years.map((year) => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-12 col-md-4">
                    <label className="form-label">Amount</label>
                    <input className="form-control" type="number" min="0" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
                  </div>
                </div>
                <div className="row g-3 mt-3">
                  <div className="col-12 col-md-4">
                    <label className="form-label">Status</label>
                    <select className="form-select" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} required>
                      <option value="">Select status</option>
                      <option value="Unpaid">Unpaid</option>
                      <option value="Paid">Paid</option>
                    </select>
                  </div>
                </div>
                <div className="mt-3">
                  <button className="btn btn-primary me-2" type="submit">{editId ? 'Update Maintenance' : 'Save Maintenance'}</button>
                  {editId && (
                    <button className="btn btn-secondary" type="button" onClick={cancelEdit}>Cancel</button>
                  )}
                </div>
              </form>
            </div>
          </div>
          <div className="card mb-4 shadow-sm">
            <div className="card-header">Generate Monthly Maintenance</div>
            <div className="card-body">
              <form onSubmit={handleGenerate} className="row g-3 align-items-end">
                <div className="col-12 col-md-3">
                  <label className="form-label">Month</label>
                  <select className="form-select" value={generate.month} onChange={(e) => setGenerate({ ...generate, month: e.target.value })} required>
                    <option value="">Month</option>
                    {months.map((month) => (
                      <option key={month.value} value={month.value}>{month.label}</option>
                    ))}
                  </select>
                </div>
                <div className="col-12 col-sm-6 col-md-2">
                  <label className="form-label">Year</label>
                  <select className="form-select" value={generate.year} onChange={(e) => setGenerate({ ...generate, year: e.target.value })} required>
                    <option value="">Year</option>
                    {years.map((year) => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
                <div className="col-12 col-md-4">
                  <label className="form-label">Amount</label>
                  <input className="form-control" type="number" min="0" step="0.01" value={generate.amount} onChange={(e) => setGenerate({ ...generate, amount: e.target.value })} required />
                </div>
                <div className="col-12 col-sm-6 col-md-2">
                  <button className="btn btn-secondary w-100" type="submit">Generate</button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}
      <div className="card mb-3 shadow-sm">
        <div className="card-body">
          <div className="row g-3 align-items-end">
            <div className="col-12 col-md-3">
              <label className="form-label">Search Member</label>
              <input
                className="form-control"
                type="search"
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                placeholder="Search by member name"
              />
            </div>
            <div className="col-12 col-sm-6 col-md-2">
              <label className="form-label">Status</label>
              <select className="form-select" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}>
                <option value="">All statuses</option>
                <option value="Paid">Paid</option>
                <option value="Unpaid">Unpaid</option>
              </select>
            </div>
            <div className="col-12 col-sm-6 col-md-2">
              <label className="form-label">Month</label>
              <select className="form-select" value={monthFilter} onChange={(e) => { setMonthFilter(e.target.value); setCurrentPage(1); }}>
                <option value="">All months</option>
                {months.slice(1).map((month) => (
                  <option key={month.value} value={month.value}>{month.label}</option>
                ))}
              </select>
            </div>
            <div className="col-12 col-sm-6 col-md-2">
              <label className="form-label">Year</label>
              <select className="form-select" value={yearFilter} onChange={(e) => { setYearFilter(e.target.value); setCurrentPage(1); }}>
                {years.map((year) => (
                  <option key={year} value={year}>{year || 'All years'}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
      <div className="card shadow-sm">
        <div className="card-body p-0">
          {loading ? (
            <div className="p-3">Loading maintenance records...</div>
          ) : (
            <div className="table-responsive">
              <table className="table mb-0">
                <thead>
                  <tr>
                    <th>Month</th>
                    <th>Member</th>
                    <th>Flat</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Paid Date</th>
                    {user.role === 'admin' && <th>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {displayedRecords.map((record) => (
                    <tr key={record.id}>
                      <td>{record.month_year}</td>
                      <td>{record.member_name}</td>
                      <td>{record.flat_no}</td>
                      <td>{record.amount}</td>
                      <td>{record.status}</td>
                      <td>{record.paid_date ? formatDateTime(record.paid_date) : '-'}</td>
                      {user.role === 'admin' && (
                        <td>
                          <button className="btn btn-sm btn-outline-secondary me-2" onClick={() => startEdit(record)}>Edit</button>
                          <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(record.id)}>Delete</button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
    </div>
  );
}
