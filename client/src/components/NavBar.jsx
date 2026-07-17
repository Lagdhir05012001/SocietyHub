import React, { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import api from '../api';

export default function NavBar({ user, onLogout }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const linkClass = ({ isActive }) => `nav-link${isActive ? ' active' : ''}`;

  const closeMenu = () => setIsMenuOpen(false);

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
      <div className="container-fluid px-3 px-lg-4">
        <Link className="navbar-brand" to="/" onClick={closeMenu}>ShivTirth</Link>
        <button
          className="navbar-toggler"
          type="button"
          aria-controls="navbarNav"
          aria-expanded={isMenuOpen}
          aria-label="Toggle navigation"
          onClick={() => setIsMenuOpen((open) => !open)}
        >
          <span className="navbar-toggler-icon" />
        </button>
        <div className={`collapse navbar-collapse${isMenuOpen ? ' show' : ''}`} id="navbarNav">
          {user ? (
            <>
              <ul className="navbar-nav me-auto mb-2 mb-lg-0">
                <li className="nav-item">
                  <NavLink className={linkClass} to="/dashboard" end onClick={closeMenu}>Dashboard</NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className={linkClass} to="/members" onClick={closeMenu}>Members</NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className={linkClass} to="/workers" onClick={closeMenu}>Workers</NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className={linkClass} to="/attendance" onClick={closeMenu}>Attendance</NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className={linkClass} to="/expenses" onClick={closeMenu}>Expenses</NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className={linkClass} to="/maintenance" onClick={closeMenu}>Maintenance</NavLink>
                </li>
                {user.role === 'admin' && (
                  <li className="nav-item">
                    <NavLink className={linkClass} to="/activity-log" onClick={closeMenu}>Activity Log</NavLink>
                  </li>
                )}
              </ul>
              <div className="d-flex align-items-center text-white me-3 my-2 my-lg-0">
                {user.profile_image ? (
                  <img
                    src={`${api.defaults.baseURL}/uploads/${user.profile_image}`}
                    alt={user.name}
                    className="rounded-circle me-2"
                    style={{ width: 32, height: 32, objectFit: 'cover' }}
                  />
                ) : (
                  <div className="bg-secondary text-white rounded-circle d-inline-flex justify-content-center align-items-center me-2" style={{ width: 32, height: 32 }}>
                    {user.name?.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="user-pill">{user.name} ({user.role})</span>
              </div>
              <button
                className="btn btn-outline-light"
                onClick={() => {
                  closeMenu();
                  onLogout();
                }}
              >
                Logout
              </button>
            </>
          ) : (
            <ul className="navbar-nav ms-auto mb-2 mb-lg-0">
              <li className="nav-item">
                <Link className="nav-link" to="/login" onClick={closeMenu}>Login</Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to="/register" onClick={closeMenu}>Register</Link>
              </li>
            </ul>
          )}
        </div>
      </div>
    </nav>
  );
}
