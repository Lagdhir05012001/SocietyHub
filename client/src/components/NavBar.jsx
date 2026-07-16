import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import api from '../api';

export default function NavBar({ user, onLogout }) {
  const linkClass = ({ isActive }) => `nav-link${isActive ? ' active' : ''}`;

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
      <div className="container-fluid">
        <Link className="navbar-brand" to="/">ShivTirth</Link>
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
          <span className="navbar-toggler-icon" />
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
          {user ? (
            <>
              <ul className="navbar-nav me-auto">
                <li className="nav-item">
                  <NavLink className={linkClass} to="/dashboard" end>Dashboard</NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className={linkClass} to="/members">Members</NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className={linkClass} to="/workers">Workers</NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className={linkClass} to="/attendance">Attendance</NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className={linkClass} to="/expenses">Expenses</NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className={linkClass} to="/maintenance">Maintenance</NavLink>
                </li>
                {user.role === 'admin' && (
                  <li className="nav-item">
                    <NavLink className={linkClass} to="/activity-log">Activity Log</NavLink>
                  </li>
                )}
              </ul>
              <div className="d-flex align-items-center text-white me-3">
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
                <span>{user.name} ({user.role})</span>
              </div>
              <button className="btn btn-outline-light" onClick={onLogout}>Logout</button>
            </>
          ) : (
            <ul className="navbar-nav ms-auto">
              <li className="nav-item">
                <Link className="nav-link" to="/login">Login</Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to="/register">Register</Link>
              </li>
            </ul>
          )}
        </div>
      </div>
    </nav>
  );
}
