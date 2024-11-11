import React from 'react';
import { Link } from 'react-router-dom';

const Header: React.FC = () => {
  return (
    <header className="bg-blue-600 text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        <h1 className="text-2xl font-bold">O Aprendiz - Treinamento de Sherlock</h1>
        <nav>
          <Link to="/" className="mr-4 hover:underline">Home</Link>
          <Link to="/training" className="mr-4 hover:underline">Treinamento</Link>
          <Link to="/play" className="mr-4 hover:underline">Jogar</Link>
          <Link to="/manual" className="hover:underline">Manual</Link>
        </nav>
      </div>
    </header>
  );
};

export default Header;