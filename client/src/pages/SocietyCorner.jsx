import React, { useEffect, useState } from 'react';
import api from '../api';
import AutoDismissAlert from '../components/AutoDismissAlert';
import { downloadBlob, formatDate } from '../utils';

export default function SocietyCorner({ user }) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [form, setForm] = useState({ file_name: '', document_date: '' });
  const [documentFile, setDocumentFile] = useState(null);
  const [documentKey, setDocumentKey] = useState(Date.now());
  const [editId, setEditId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const loadDocuments = () => {
    setLoading(true);
    api.get('/society-corner')
      .then((res) => setDocuments(res.data))
      .catch(() => setError('Unable to load society corner documents'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  const resetForm = () => {
    setEditId(null);
    setFormError('');
    setUploadError('');
    setForm({ file_name: '', document_date: '' });
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

    if (documentFile && documentFile.type !== 'application/pdf') {
      setUploadError('Only PDF files are allowed.');
      return;
    }

    try {
      setUploadError('');
      const formData = new FormData();
      formData.append('file_name', form.file_name);
      formData.append('document_date', form.document_date);
      if (documentFile) {
        formData.append('document', documentFile);
      }

      if (editId) {
        await api.put(`/society-corner/${editId}`, formData);
      } else {
        await api.post('/society-corner', formData);
      }

      closeModal();
      loadDocuments();
    } catch (err) {
      setFormError(err.response?.data?.error || 'Unable to save document');
    }
  };

  const startEdit = (record) => {
    setEditId(record.id);
    setForm({ file_name: record.file_name, document_date: record.document_date || '' });
    setDocumentFile(null);
    setDocumentKey(Date.now());
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this document?')) return;
    try {
      await api.delete(`/society-corner/${id}`);
      loadDocuments();
    } catch {
      setError('Unable to delete document');
    }
  };

  const handleDownloadDocument = async (record) => {
    try {
      const response = await api.get(`/download/society-corner/${record.id}`, { responseType: 'blob' });
      downloadBlob(response.data, record.pdf_original_filename || record.pdf_filename);
    } catch {
      setError('Unable to download document');
    }
  };

  const filteredDocuments = documents.filter((document) => {
    const search = searchTerm.trim().toLowerCase();
    if (!search) return true;
    return document.file_name?.toLowerCase().includes(search);
  });

  const summary = {
    total: documents.length,
    filtered: filteredDocuments.length,
  };

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Society Corner</h2>
        <div className="page-actions">
          {user.role === 'admin' && (
            <button className="btn btn-primary" onClick={openModal}>Add Document</button>
          )}
        </div>
      </div>

      <AutoDismissAlert message={error} onClose={() => setError('')} />

      {user.role === 'admin' && isModalOpen && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{editId ? 'Edit Document' : 'Add Document'}</h5>
                <button type="button" className="btn-close" onClick={closeModal}></button>
              </div>
              <div className="modal-body">
                <form onSubmit={handleSubmit}>
                  <AutoDismissAlert message={formError} onClose={() => setFormError('')} className="alert alert-danger mb-3" />
                  <div className="row g-3">
                    <div className="col-12 col-md-6">
                      <label className="form-label">File Name</label>
                      <input
                        className="form-control"
                        value={form.file_name}
                        onChange={(e) => setForm({ ...form, file_name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label">Date</label>
                      <input
                        className="form-control"
                        type="date"
                        value={form.document_date}
                        onChange={(e) => setForm({ ...form, document_date: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-12">
                      <label className="form-label">PDF File</label>
                      <input
                        key={documentKey}
                        className="form-control"
                        type="file"
                        accept="application/pdf"
                        onChange={(e) => {
                          const file = e.target.files[0] || null;
                          if (file && file.type !== 'application/pdf') {
                            setUploadError('Only PDF files are allowed.');
                          } else {
                            setUploadError('');
                          }
                          setDocumentFile(file);
                        }}
                        required={!editId}
                      />
                      {uploadError && <div className="text-danger small mt-2">{uploadError}</div>}
                      {editId && <small className="text-muted">Leave blank to keep the current file</small>}
                    </div>
                  </div>
                  <div className="mt-4 text-end">
                    <button className="btn btn-secondary me-2" type="button" onClick={closeModal}>Cancel</button>
                    <button className="btn btn-primary" type="submit">{editId ? 'Update Document' : 'Add Document'}</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="summary-badges mt-3">
        <span className="badge bg-primary">Total records: {summary.total}</span>
        <span className="badge bg-secondary">Filtered: {summary.filtered}</span>
      </div>

      <div className="card shadow-sm mt-3">
        <div className="card-body">
          <div className="row g-3 align-items-end">
            <div className="col-12 col-md-4">
              <label className="form-label">Search Documents</label>
              <input
                className="form-control"
                type="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by file name"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="card shadow-sm mt-3">
        <div className="card-body p-0">
          {loading ? (
            <div className="p-3">Loading documents...</div>
          ) : (
            <div className="table-responsive">
              <table className="table mb-0">
                <thead>
                  <tr>
                    <th>Sr No</th>
                    <th>File Name</th>
                    <th>Date</th>
                    <th>Document</th>
                    {user.role === 'admin' && <th>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {filteredDocuments.map((document, index) => (
                    <tr key={document.id}>
                      <td>{index + 1}</td>
                      <td>{document.file_name}</td>
                      <td>{formatDate(document.document_date)}</td>
                      <td>
                        {document.pdf_filename ? (
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => handleDownloadDocument(document)}
                          >
                            Download
                          </button>
                        ) : (
                          '-'
                        )}
                      </td>
                      {user.role === 'admin' && (
                        <td>
                          <button className="btn btn-sm btn-outline-secondary me-2" onClick={() => startEdit(document)}>Edit</button>
                          <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(document.id)}>Delete</button>
                        </td>
                      )}
                    </tr>
                  ))}
                  {filteredDocuments.length === 0 && (
                    <tr>
                      <td colSpan={user.role === 'admin' ? 5 : 4} className="text-center py-4">
                        No records found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
