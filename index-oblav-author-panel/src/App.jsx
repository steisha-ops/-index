import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Login from './pages/Login';
import Admin from './pages/Admin';
import AuthorPanel from './pages/AuthorPanel';
import Widgets from './pages/Widgets';

function App() {
  return (
    <Router>
      <div className="bg-gray-800 text-white min-h-screen">
        <nav className="bg-gray-900 p-4 shadow-lg">
            <div className="container mx-auto flex justify-between items-center">
                <Link to="/" className="text-xl font-bold">Author Platform</Link>
                <div>
                    <Link to="/login" className="px-3 py-2 rounded hover:bg-gray-700">Login</Link>
                    <Link to="/author" className="px-3 py-2 rounded hover:bg-gray-700">Author Panel</Link>
                    <Link to="/admin" className="px-3 py-2 rounded hover:bg-gray-700">Admin</Link>
                    <Link to="/widgets" className="px-3 py-2 rounded hover:bg-gray-700">Widgets</Link>
                </div>
            </div>
        </nav>

        <main className="container mx-auto p-4">
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/author" element={<AuthorPanel />} />
                <Route path="/widgets" element={<Widgets />} />
                <Route path="/" element={<Home />} />
            </Routes>
        </main>
      </div>
    </Router>
  );
}

function Home() {
    return (
        <div className="text-center mt-20">
            <h1 className="text-4xl font-bold">Welcome to the Author Platform</h1>
            <p className="mt-4 text-lg text-gray-400">Use the navigation to access different sections.</p>
        </div>
    );
}

export default App;
