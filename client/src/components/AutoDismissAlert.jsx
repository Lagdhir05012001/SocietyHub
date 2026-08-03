import React, { useEffect } from 'react';

export default function AutoDismissAlert({ message, onClose, className = 'alert alert-danger' }) {
  useEffect(() => {
    if (!message) return undefined;

    const timer = window.setTimeout(() => {
      onClose?.();
    }, 3000);

    return () => window.clearTimeout(timer);
  }, [message, onClose]);

  if (!message) return null;

  return <div className={className}>{message}</div>;
}
