import React from 'react';

const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="w-full h-12 bg-bg-card border-t border-border-light flex items-center justify-center px-6 shrink-0">
      <p className="text-xs text-text-muted">
        © {year} LearnMate AI. All rights reserved.
      </p>
    </footer>
  );
};

export default Footer;