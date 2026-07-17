import React, { useEffect, useState } from 'react';
import api from '../api';
import { downloadCsv, downloadPdf, formatDate } from '../utils';
import Pagination from '../components/Pagination';

const months = [
  { value: '', label: 'All months' },
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
const years = [
  { value: '', label: 'Select Year' },
  { value: '2026', label: '2026' },
  { value: '2027', label: '2027' },
  { value: '2028', label: '2028' },
  { value: '2029', label: '2029' },
  { value: '2030', label: '2030' },
];
const PAGE_SIZE = 10;

export default function Attendance({ user }) {
  const [attendance, setAttendance] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ worker_id: '', date: '', status: '' });
  const [editId, setEditId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [monthFilter, setMonthFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadData = () => {
    setLoading(true);
    Promise.all([api.get('/attendance'), api.get('/workers')])
      .then(([attendanceRes, workersRes]) => {
        setAttendance(attendanceRes.data);
        setWorkers(workersRes.data);
      })
      .catch(() => setError('Unable to load attendance'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    try {
      if (editId) {
        await api.put(`/attendance/${editId}`, form);
      } else {
        await api.post('/attendance', form);
      }
      setForm({ worker_id: '', date: '', status: '' });
      setEditId(null);
      setIsModalOpen(false);
      loadData();
    } catch (err) {
      setError(err.response?.data?.error || 'Unable to save attendance');
    }
  };

  const startEdit = (record) => {
    setEditId(record.id);
    setForm({ worker_id: record.worker_id, date: record.date, status: record.status });
    setIsModalOpen(true);
  };

  const cancelEdit = () => {
    setEditId(null);
    setForm({ worker_id: '', date: '', status: '' });
    setIsModalOpen(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this attendance record?')) return;
    try {
      await api.delete(`/attendance/${id}`);
      loadData();
    } catch {
      setError('Unable to delete record');
    }
  };

  const exportCsv = () => {
    const headers = ['Date', 'Worker', 'Type', 'Status'];
    const rows = filteredAttendance.map((record) => [formatDate(record.date), record.worker_name, record.worker_type, record.status]);
    downloadCsv('attendance.csv', headers, rows);
  };

  const exportPdf = () => {
    const headers = ['Date', 'Worker', 'Type', 'Status'];
    const rows = filteredAttendance.map((record) => [formatDate(record.date), record.worker_name, record.worker_type, record.status]);
    downloadPdf('attendance.pdf', 'Attendance Records', headers, rows);
  };

  const filteredAttendance = attendance.filter((record) => {
    const search = searchTerm.trim().toLowerCase();
    const matchesNameType = !search || record.worker_name.toLowerCase().includes(search) || record.worker_type.toLowerCase().includes(search);
    const matchesStatus = !statusFilter || record.status === statusFilter;
    const [year = '', month = ''] = record.date ? record.date.split('-') : ['',''];
    const matchesMonth = !monthFilter || month === monthFilter;
    const matchesYear = !yearFilter || year === yearFilter;
    return matchesNameType && matchesStatus && matchesMonth && matchesYear;
  });

  const totalPages = Math.max(1, Math.ceil(filteredAttendance.length / PAGE_SIZE));
  const displayedAttendance = filteredAttendance.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const presentCount = filteredAttendance.filter((record) => record.status === 'Present').length;
  const absentCount = filteredAttendance.filter((record) => record.status === 'Absent').length;
  const summary = {
    total: attendance.length,
    filtered: filteredAttendance.length,
    present: presentCount,
    absent: absentCount,
  };

  return (
    <div>
    <div className="page-header">
      <h2 className="page-title">Worker Attendance</h2>
      <div className="page-actions">
        {user.role === 'admin' && (
          <button
            className="btn btn-primary"
            onClick={() => {
              setEditId(null);
              setForm({ worker_id: '', date: '', status: '' });
              setIsModalOpen(true);
            }}
          >
            Mark Attendance
          </button>
        )}
        <button className="btn btn-outline-secondary" onClick={exportCsv}>Export CSV</button>
        <button className="btn btn-outline-secondary" onClick={exportPdf}>Export PDF</button>
      </div>
    </div>
    <div className="summary-badges">
      <span className="badge bg-primary">Total records: {summary.total}</span>
      <span className="badge bg-secondary">Filtered: {summary.filtered}</span>
      <span className="badge bg-success">Present: {summary.present}</span>
        <span className="badge bg-danger">Absent: {summary.absent}</span>
      </div>
      {error && <div className="alert alert-danger">{error}</div>}
      {user.role === 'admin' && isModalOpen && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{editId ? 'Edit Attendance' : 'Mark Attendance'}</h5>
                <button type="button" className="btn-close" onClick={cancelEdit}></button>
              </div>
              <div className="modal-body">
                <form onSubmit={handleSubmit}>
              <div className="row g-3">
                <div className="col-md-4">
                  <label className="form-label">Worker</label>
                  <select className="form-select" value={form.worker_id} onChange={(e) => setForm({ ...form, worker_id: e.target.value })} required>
                    <option value="">Select a worker</option>
                    {workers.map((worker) => (
                      <option key={worker.id} value={worker.id}>{worker.name}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-4">
                  <label className="form-label">Date</label>
                  <input className="form-control" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Status</label>
                  <select className="form-select" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} required>
                    <option value="">Select status</option>
                    <option value="Present">Present</option>
                    <option value="Absent">Absent</option>
                  </select>
                </div>
              </div>
              <div className="mt-4 text-end">
                <button className="btn btn-secondary me-2" type="button" onClick={cancelEdit}>Cancel</button>
                <button className="btn btn-primary" type="submit">{editId ? 'Update' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )}
      <div className="card mb-3 shadow-sm">
        <div className="card-body">
          <div className="row g-3 align-items-end">
            <div className="col-12 col-md-3">
              <label className="form-label">Search</label>
              <input
                className="form-control"
                type="search"
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                placeholder="Worker name or type"
              />
            </div>
            <div className="col-12 col-sm-6 col-md-2">
              <label className="form-label">Status</label>
              <select className="form-select" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}>
                <option value="">Select Status</option>
                <option value="Present">Present</option>
                <option value="Absent">Absent</option>
              </select>
            </div>
            <div className="col-12 col-sm-6 col-md-2">
              <label className="form-label">Month</label>
              <select className="form-select" value={monthFilter} onChange={(e) => { setMonthFilter(e.target.value); setCurrentPage(1); }}>
                {months.map((month) => (
                  <option key={month.value} value={month.value}>{month.label}</option>
                ))}
              </select>
            </div>
            <div className="col-12 col-sm-6 col-md-2">
              <label className="form-label">Year</label>
              <select className="form-select" value={yearFilter} onChange={(e) => { setYearFilter(e.target.value); setCurrentPage(1); }}>
                {years.map((year) => (
                  <option key={year.value} value={year.value}>{year.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
      <div className="card shadow-sm">
        <div className="card-body p-0">
          {loading ? (
            <div className="p-3">Loading attendance records...</div>
          ) : (
            <div className="table-responsive">
              <table className="table mb-0">
                <thead>
                  <tr>
                    <th>Sr No</th>
                    <th>Date</th>
                    <th>Worker</th>
                    <th>Type</th>
                    <th>Status</th>
                    {user.role === 'admin' && <th>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {displayedAttendance.map((record, index) => (
                    <tr key={record.id}>
                      <td>{(currentPage - 1) * PAGE_SIZE + index + 1}</td>
                      <td>{formatDate(record.date)}</td>
                      <td>{record.worker_name}</td>
                      <td>{record.worker_type}</td>
                      <td>{record.status}</td>
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
