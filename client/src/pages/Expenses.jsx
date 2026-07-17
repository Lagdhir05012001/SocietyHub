import React, { useEffect, useState } from 'react';
import api from '../api';
import { downloadCsv, downloadPdf, formatDate } from '../utils';
import Pagination from '../components/Pagination';

const PAGE_SIZE = 10;
const categories = [
  'Maintenance',
  'Utilities',
  'Staff Salary',
  'Cleaning',
  'Repairs',
  'Garden',
  'Security',
  'Office Expenses',
  'Other'
];

export default function Expenses({ user }) {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ category: '', expense_date: '', amount: '', description: '', proofs: [] });
  const [editId, setEditId] = useState(null);
  const [fileInputKey, setFileInputKey] = useState(Date.now());
  const [categoryFilter, setCategoryFilter] = useState('');
  const [monthFilter, setMonthFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const loadExpenses = () => {
    setLoading(true);
    api.get('/expenses')
      .then((res) => setExpenses(res.data))
      .catch(() => setError('Unable to load expenses'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadExpenses();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    try {
      const files = Array.from(form.proofs || []);
      const allowedTypes = ['image/png', 'image/jpeg'];
      const invalidFile = files.find((file) => !allowedTypes.includes(file.type));
      if (invalidFile) {
        setError('Only PNG and JPG images are allowed for proof uploads.');
        return;
      }
      const data = new FormData();
      data.append('category', form.category);
      data.append('expense_date', form.expense_date);
      data.append('amount', form.amount);
      data.append('description', form.description);
      if (!editId) {
        files.forEach((file) => data.append('proofs', file));
      }
      if (editId) {
        await api.put(`/expenses/${editId}`, {
          category: form.category,
          expense_date: form.expense_date,
          amount: form.amount,
          description: form.description,
        });
      } else {
        await api.post('/expenses', data, { headers: { 'Content-Type': 'multipart/form-data' } });
      }
      setForm({ category: '', expense_date: '', amount: '', description: '', proofs: [] });
      setEditId(null);
      setFileInputKey(Date.now());
      loadExpenses();
    } catch (err) {
      setError(err.response?.data?.error || 'Unable to save expense');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this expense?')) return;
    try {
      await api.delete(`/expenses/${id}`);
      loadExpenses();
    } catch {
      setError('Unable to delete expense');
    }
  };

  const startEdit = (expense) => {
    setEditId(expense.id);
    setForm({
      category: expense.category,
      expense_date: expense.expense_date,
      amount: expense.amount,
      description: expense.description || '',
      proofs: [],
    });
  };

  const cancelEdit = () => {
    setEditId(null);
    setForm({ category: '', expense_date: '', amount: '', description: '', proofs: [] });
    setFileInputKey(Date.now());
  };

  const exportCsv = () => {
    const headers = ['Date', 'Category', 'Amount', 'Description'];
    const rows = filteredExpenses.map((expense) => [formatDate(expense.expense_date), expense.category, expense.amount, expense.description]);
    downloadCsv('expenses.csv', headers, rows);
  };

  const exportPdf = () => {
    const headers = ['Date', 'Category', 'Amount', 'Description'];
    const rows = filteredExpenses.map((expense) => [formatDate(expense.expense_date), expense.category, expense.amount, expense.description]);
    downloadPdf('expenses.pdf', 'Expenses', headers, rows);
  };

  const filteredExpenses = expenses.filter((expense) => {
    const matchesCategory = !categoryFilter || expense.category === categoryFilter;
    const [year = '', month = ''] = expense.expense_date ? expense.expense_date.split('-') : ['',''];
    const matchesMonth = !monthFilter || month === monthFilter;
    const matchesYear = !yearFilter || year === yearFilter;
    return matchesCategory && matchesMonth && matchesYear;
  });

  const totalPages = Math.max(1, Math.ceil(filteredExpenses.length / PAGE_SIZE));
  const displayedExpenses = filteredExpenses.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const summary = {
    total: expenses.length,
    filtered: filteredExpenses.length,
    amount: filteredExpenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0),
  };

  return (
    <div>
    <div className="page-header">
      <h2 className="page-title">Expenses</h2>
      <div className="page-actions">
        <button className="btn btn-outline-secondary" onClick={exportCsv}>Export CSV</button>
          <button className="btn btn-outline-secondary" onClick={exportPdf}>Export PDF</button>
        </div>
      </div>
    <div className="summary-badges">
      <span className="badge bg-primary">Total expenses: {summary.total}</span>
      <span className="badge bg-secondary">Filtered: {summary.filtered}</span>
        <span className="badge bg-success">Amount: ₹{summary.amount.toFixed(2)}</span>
      </div>
      {error && <div className="alert alert-danger">{error}</div>}
      {user.role === 'admin' && (
        <div className="card mb-4 shadow-sm">
          <div className="card-header">{editId ? 'Edit Expense' : 'Add Expense'}</div>
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div className="row g-3">
                <div className="col-md-4">
                  <label className="form-label">Category</label>
                  <select className="form-select" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} required>
                    <option value="">Select category</option>
                    {categories.map((category) => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-4">
                  <label className="form-label">Date</label>
                  <input className="form-control" type="date" value={form.expense_date} onChange={(e) => setForm({ ...form, expense_date: e.target.value })} required />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Amount</label>
                  <input className="form-control" type="number" step="0.01" min="0" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
                </div>
              </div>
              <div className="row g-3 mt-3">
                <div className="col-md-12">
                  <label className="form-label">Description</label>
                  <textarea className="form-control" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                </div>
                <div className="col-md-12">
                  <label className="form-label">Proof Images</label>
                  {!editId ? (
                    <input key={fileInputKey} className="form-control" type="file" multiple accept=".png,.jpg,.jpeg" onChange={(e) => setForm({ ...form, proofs: e.target.files })} />
                  ) : (
                    <div className="form-text">Proof images cannot be changed while editing.</div>
                  )}
                </div>
              </div>
              <div className="mt-3">
                <button className="btn btn-primary me-2" type="submit">{editId ? 'Update Expense' : 'Save Expense'}</button>
                {editId && <button className="btn btn-secondary" type="button" onClick={cancelEdit}>Cancel</button>}
              </div>
            </form>
          </div>
        </div>
      )}
      <div className="card mb-3 shadow-sm">
        <div className="card-body">
          <div className="row g-3 align-items-end">
            <div className="col-12 col-md-3">
              <label className="form-label">Category</label>
              <select className="form-select" value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1); }}>
                <option value="">All categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
            <div className="col-12 col-sm-6 col-md-2">
              <label className="form-label">Month</label>
              <select className="form-select" value={monthFilter} onChange={(e) => { setMonthFilter(e.target.value); setCurrentPage(1); }}>
                <option value="">All months</option>
                <option value="01">January</option>
                <option value="02">February</option>
                <option value="03">March</option>
                <option value="04">April</option>
                <option value="05">May</option>
                <option value="06">June</option>
                <option value="07">July</option>
                <option value="08">August</option>
                <option value="09">September</option>
                <option value="10">October</option>
                <option value="11">November</option>
                <option value="12">December</option>
              </select>
            </div>
            <div className="col-12 col-sm-6 col-md-2">
              <label className="form-label">Year</label>
              <select className="form-select" value={yearFilter} onChange={(e) => { setYearFilter(e.target.value); setCurrentPage(1); }}>
                <option value="">All years</option>
                <option value="2026">2026</option>
                <option value="2027">2027</option>
                <option value="2028">2028</option>
                <option value="2029">2029</option>
                <option value="2030">2030</option>
              </select>
            </div>
          </div>
        </div>
      </div>
      <div className="card shadow-sm">
        <div className="card-body p-0">
          {loading ? (
            <div className="p-3">Loading expenses...</div>
          ) : (
            <div className="table-responsive">
              <table className="table mb-0">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Category</th>
                    <th>Amount</th>
                    <th>Description</th>
                    <th>Proofs</th>
                    {user.role === 'admin' && <th>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {displayedExpenses.map((expense) => (
                    <tr key={expense.id}>
                      <td>{formatDate(expense.expense_date)}</td>
                      <td>{expense.category}</td>
                      <td>{expense.amount}</td>
                      <td>{expense.description}</td>
                      <td>{expense.proofs?.map((proof, index) => (
                        <div key={index}><a href={`${api.defaults.baseURL}/uploads/${proof}`} target="_blank" rel="noreferrer">View</a></div>
                      ))}</td>
                      {user.role === 'admin' && (
                        <td>
                          <button className="btn btn-sm btn-outline-secondary me-2" onClick={() => startEdit(expense)}>Edit</button>
                          <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(expense.id)}>Delete</button>
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
