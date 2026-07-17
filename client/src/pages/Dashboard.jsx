import React, { useEffect, useState } from 'react';
import api from '../api';
import { formatDate } from '../utils';

export default function Dashboard() {
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/dashboard')
      .then((response) => {
        setStats(response.data);
        setLoading(false);
      })
      .catch(() => {
        setError('Unable to load dashboard');
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div>Loading dashboard...</div>;
  }

  if (error) {
    return <div className="alert alert-danger">{error}</div>;
  }

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Dashboard</h2>
      </div>
      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-lg-3">
          <div className="card text-bg-primary p-3">
            <div>Total Members</div>
            <h3>{stats.totalMembers}</h3>
          </div>
        </div>
        <div className="col-12 col-sm-6 col-lg-3">
          <div className="card text-bg-success p-3">
            <div>Total Workers</div>
            <h3>{stats.totalWorkers}</h3>
          </div>
        </div>
        <div className="col-12 col-sm-6 col-lg-3">
          <div className="card text-bg-warning p-3">
            <div>Total Expenses</div>
            <h3>{stats.totalExpenses}</h3>
          </div>
        </div>
        <div className="col-12 col-sm-6 col-lg-3">
          <div className="card text-bg-info p-3">
            <div>Maintenance Collected</div>
            <h3>{stats.totalMaintenance}</h3>
          </div>
        </div>
      </div>
      <div className="row g-3">
        <div className="col-12 col-lg-6">
          <div className="card shadow-sm">
            <div className="card-header">Recent Expenses</div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table mb-0">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Category</th>
                      <th>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recentExpenses?.map((expense) => (
                      <tr key={expense.id}>
                        <td>{formatDate(expense.expense_date)}</td>
                        <td>{expense.category}</td>
                        <td>{expense.amount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
        <div className="col-12 col-lg-6">
          <div className="card shadow-sm">
            <div className="card-header">Recent Attendance</div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table mb-0">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Worker</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recentAttendance?.map((record) => (
                      <tr key={record.id}>
                        <td>{formatDate(record.date)}</td>
                        <td>{record.worker_name}</td>
                        <td>{record.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
