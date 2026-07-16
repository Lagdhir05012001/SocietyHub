import React, { useEffect, useState } from 'react';
import api from '../api';
import { downloadCsv, downloadPdf, formatDateTime } from '../utils';
import Pagination from '../components/Pagination';

const PAGE_SIZE = 10;

export default function ActivityLog() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setLoading(true);
    api.get('/activity-log')
      .then((res) => setLogs(res.data))
      .catch(() => setError('Unable to load activity log'))
      .finally(() => setLoading(false));
  }, []);

  const filteredLogs = logs.filter((log) => {
    const search = searchTerm.trim().toLowerCase();
    if (!search) return true;
    return (
      log.user_name?.toLowerCase().includes(search) ||
      log.action.toLowerCase().includes(search) ||
      log.details?.toLowerCase().includes(search)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / PAGE_SIZE));
  const displayedLogs = filteredLogs.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const summary = {
    total: logs.length,
    filtered: filteredLogs.length,
  };

  const exportCsv = () => {
    const headers = ['Date / Time', 'User', 'Action', 'Details'];
    const rows = filteredLogs.map((log) => [formatDateTime(log.created_at), log.user_name || 'System', log.action, log.details || '']);
    downloadCsv('activity-log.csv', headers, rows);
  };

  const exportPdf = () => {
    const headers = ['Date / Time', 'User', 'Action', 'Details'];
    const rows = filteredLogs.map((log) => [formatDateTime(log.created_at), log.user_name || 'System', log.action, log.details || '']);
    downloadPdf('activity-log.pdf', 'Activity Log', headers, rows);
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2>Activity Log</h2>
        <div>
          <button className="btn btn-outline-secondary me-2" onClick={exportCsv}>Export CSV</button>
          <button className="btn btn-outline-secondary" onClick={exportPdf}>Export PDF</button>
        </div>
      </div>

      <div className="mb-3">
        <span className="badge bg-primary me-2">Total events: {summary.total}</span>
        <span className="badge bg-secondary">Filtered: {summary.filtered}</span>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="card mb-3 shadow-sm">
        <div className="card-body">
          <div className="row g-3 align-items-end">
            <div className="col-md-4">
              <label className="form-label">Search Activity</label>
              <input
                className="form-control"
                type="search"
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                placeholder="Search by user, action, or details"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="card shadow-sm">
        <div className="card-body p-0">
          {loading ? (
            <div className="p-3">Loading activity log...</div>
          ) : (
            <table className="table mb-0">
              <thead>
                <tr>
                  <th>Date / Time</th>
                  <th>User</th>
                  <th>Action</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {displayedLogs.map((log) => (
                  <tr key={log.id}>
                    <td>{formatDateTime(log.created_at)}</td>
                    <td>{log.user_name || 'System'}</td>
                    <td>{log.action}</td>
                    <td>{log.details}</td>
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
