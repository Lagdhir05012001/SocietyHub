import React, { useEffect, useState } from 'react';
import api from '../api';
import AutoDismissAlert from '../components/AutoDismissAlert';
import { downloadBlob } from '../utils';
import Pagination from '../components/Pagination';

const PAGE_SIZE = 10;

export default function Tharav({ user }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [form, setForm] = useState({ tharav_number: '', tharav_date: '', description: '' });
  const [documentFile, setDocumentFile] = useState(null);
  const [documentKey, setDocumentKey] = useState(Date.now());
  const [editId, setEditId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const loadRecords = () => {
    setLoading(true);
    api.get('/tharav')
      .then((res) => setRecords(res.data))
      .catch(() => setError('Unable to load tharav records'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadRecords();
  }, []);

  const resetForm = () => {
    setEditId(null);
    setFormError('');
    setUploadError('');
    setForm({ tharav_number: '', tharav_date: '', description: '' });
    setDocumentFile(null);
    setDocumentKey(Date.now());
  };

  const openModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setFormError('');
    try {
      if (documentFile && documentFile.type !== 'application/pdf') {
        setUploadError('Only PDF files are allowed for Tharav uploads.');
        return;
      }
      setUploadError('');
      const formData = new FormData();
      formData.append('tharav_number', form.tharav_number);
      formData.append('tharav_date', form.tharav_date);
      formData.append('description', form.description || '');
      if (documentFile) {
        formData.append('document', documentFile);
      }

      if (editId) {
        await api.put(`/tharav/${editId}`, formData);
      } else {
        await api.post('/tharav', formData);
      }
      closeModal();
      loadRecords();
    } catch (err) {
      setFormError(err.response?.data?.error || 'Unable to save tharav record');
    }
  };

  const startEdit = (record) => {
    setEditId(record.id);
    setForm({ tharav_number: record.tharav_number, tharav_date: record.tharav_date, description: record.description || '' });
    setDocumentFile(null);
    setDocumentKey(Date.now());
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this tharav record?')) return;
    try {
      await api.delete(`/tharav/${id}`);
      loadRecords();
    } catch {
      setError('Unable to delete tharav record');
    }
  };

  const handleDownloadTharav = async (record) => {
    try {
      const response = await api.get(`/download/tharav/${record.id}`, { responseType: 'blob' });
      downloadBlob(response.data, record.pdf_original_filename || record.pdf_filename);
    } catch {
      setError('Unable to download Tharav file');
    }
  };

  const filteredRecords = records.filter((record) => {
    const search = searchTerm.trim().toLowerCase();
    if (!search) return true;
    return record.tharav_number.toLowerCase().includes(search) ||
      record.description?.toLowerCase().includes(search);
  });

  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / PAGE_SIZE));
  const displayedRecords = filteredRecords.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const summary = {
    total: records.length,
    filtered: filteredRecords.length,
  };
  const baseUrl = api.defaults.baseURL || '';

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Tharav</h2>
        <div className="page-actions">
          {user.role === 'admin' && (
            <button className="btn btn-primary" onClick={openModal}>Add Tharav</button>
          )}
        </div>
      </div>
      <div className="summary-badges">
        <span className="badge bg-primary">Total records: {summary.total}</span>
        <span className="badge bg-secondary">Filtered: {summary.filtered}</span>
      </div>
      <AutoDismissAlert message={error} onClose={() => setError('')} />
      {user.role === 'admin' && isModalOpen && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{editId ? 'Edit Tharav' : 'Add Tharav'}</h5>
                <button type="button" className="btn-close" onClick={closeModal}></button>
              </div>
              <div className="modal-body">
                <form onSubmit={handleSubmit}>
                  <AutoDismissAlert message={formError} onClose={() => setFormError('')} className="alert alert-danger mb-3" />
                  <div className="row g-3">
                    <div className="col-12 col-md-6">
                      <label className="form-label">Tharav Number</label>
                      <input
                        className="form-control"
                        value={form.tharav_number}
                        onChange={(e) => setForm({ ...form, tharav_number: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label">Date</label>
                      <input
                        className="form-control"
                        type="date"
                        value={form.tharav_date}
                        onChange={(e) => setForm({ ...form, tharav_date: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-12">
                      <label className="form-label">Description</label>
                      <textarea
                        className="form-control"
                        value={form.description}
                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                        rows={3}
                      />
                    </div>
                    <div className="col-12">
                      <label className="form-label">PDF Document</label>
                      <input
                        key={documentKey}
                        className="form-control"
                        type="file"
                        accept="application/pdf"
                        onChange={(e) => {
                          const file = e.target.files[0] || null;
                          if (file && file.type !== 'application/pdf') {
                            setUploadError('Only PDF files are allowed for Tharav uploads.');
                          } else {
                            setUploadError('');
                          }
                          setDocumentFile(file);
                        }}
                        required={!editId}
                      />
                      {uploadError && <div className="text-danger small mt-2">{uploadError}</div>}
                      {editId && <small className="text-muted">Leave blank to keep current file</small>}
                    </div>
                  </div>
                  <div className="mt-4 text-end">
                    <button className="btn btn-secondary me-2" type="button" onClick={closeModal}>Cancel</button>
                    <button className="btn btn-primary" type="submit">{editId ? 'Update Tharav' : 'Add Tharav'}</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="card shadow-sm">
        <div className="card-body">
          <div className="row g-3 align-items-end">
            <div className="col-12 col-md-4">
              <label className="form-label">Search Tharav</label>
              <input
                className="form-control"
                type="search"
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                placeholder="Search by number or description"
              />
            </div>
          </div>
        </div>
      </div>
      <div className="card shadow-sm">
        <div className="card-body p-0">
          {loading ? (
            <div className="p-3">Loading tharav records...</div>
          ) : (
            <div className="table-responsive">
              <table className="table mb-0">
                <thead>
                  <tr>
                    <th>Sr No</th>
                    <th>Tharav Number</th>
                    <th>Date</th>
                        <th>Description</th>
                        <th>Document</th>
                        {user.role === 'admin' && <th>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {displayedRecords.map((record, index) => (
                    <tr key={record.id}>
                      <td>{(currentPage - 1) * PAGE_SIZE + index + 1}</td>
                      <td>{record.tharav_number}</td>
                      <td>{formatDate(record.tharav_date)}</td>
                      <td>{record.description || '-'}</td>
                      <td>
                        {record.pdf_filename ? (
                           <button
                             type="button"
                             className="btn btn-sm btn-outline-primary me-2 d-inline-flex align-items-center justify-content-center"
                             style={{ minWidth: '90px' }}
                             onClick={() => handleDownloadTharav(record)}
                           >{record.pdf_original_filename || record.pdf_filename}</button>
                        ) : (
                          '-'
                        )}
                      </td>
                      {user.role === 'admin' && (
                        <td>
                          <button className="btn btn-sm btn-outline-secondary me-2" onClick={() => startEdit(record)}>Edit</button>
                          <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(record.id)}>Delete</button>
                        </td>
                      )}
                    </tr>
                  ))}
                  {displayedRecords.length === 0 && (
                    <tr>
                      <td colSpan={user.role === 'admin' ? 6 : 5} className="text-center py-3">No records found.</td>
                    </tr>
                  )}
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
