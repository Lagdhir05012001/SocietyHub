import React from 'react';

export default function Pagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  const pageNumbers = [];
  for (let i = 1; i <= totalPages; i += 1) {
    pageNumbers.push(i);
  }

  return (
    <nav aria-label="Page navigation" className="mt-3">
      <ul className="pagination flex-wrap justify-content-center">
        <li className={`page-item${currentPage === 1 ? ' disabled' : ''}`}>
          <button className="page-link" type="button" onClick={() => onPageChange(currentPage - 1)}>Previous</button>
        </li>
        {pageNumbers.map((page) => (
          <li key={page} className={`page-item${currentPage === page ? ' active' : ''}`}>
            <button className="page-link" type="button" onClick={() => onPageChange(page)}>{page}</button>
          </li>
        ))}
        <li className={`page-item${currentPage === totalPages ? ' disabled' : ''}`}>
          <button className="page-link" type="button" onClick={() => onPageChange(currentPage + 1)}>Next</button>
        </li>
      </ul>
    </nav>
  );
}
