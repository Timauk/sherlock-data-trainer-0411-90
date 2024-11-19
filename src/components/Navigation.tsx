import React from 'react';
import { Link } from 'react-router-dom';

const Navigation = () => {
  return (
    <nav className="bg-background border-b border-border mb-4">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <Link to="/" className="text-xl font-bold">
            Sherlock Data Trainer
          </Link>
          <div className="flex gap-4">
            <Link to="/" className="hover:text-primary">
              Home
            </Link>
            <Link to="/play" className="hover:text-primary">
              Play
            </Link>
            <Link to="/training" className="hover:text-primary">
              Training
            </Link>
            <Link to="/implementation" className="hover:text-primary">
              Implementation
            </Link>
            <Link to="/manual" className="hover:text-primary">
              Manual
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;