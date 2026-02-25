import React, { useState, useEffect } from 'react';

function Admin() {
    const [authors, setAuthors] = useState([]);

    useEffect(() => {
        // Fetch authors from the API
        const fetchAuthors = async () => {
            try {
                const response = await fetch('http://localhost:3001/api/authors');
                const data = await response.json();
                setAuthors(data);
            } catch (error) {
                console.error("Error fetching authors:", error);
            }
        };
        fetchAuthors();
    }, []);

    return (
        <div className="bg-gray-800 text-white min-h-screen">
            <div className="container mx-auto p-4">
                <h1 className="text-3xl font-bold mb-6">Admin Panel</h1>
                <div className="bg-gray-900 shadow-md rounded-lg p-4">
                    <h2 className="text-xl font-semibold mb-4">Authors Management</h2>
                    <div className="overflow-x-auto">
                        <table className="min-w-full table-auto">
                            <thead className="bg-gray-700">
                                <tr>
                                    <th className="px-4 py-2 text-left">ID</th>
                                    <th className="px-4 py-2 text-left">Name</th>
                                    <th className="px-4 py-2 text-left">Handle</th>
                                    <th className="px-4 py-2 text-left">Verified</th>
                                    <th className="px-4 py-2 text-left">Failed Attempts</th>
                                    <th className="px-4 py-2 text-left">Lock Expires At</th>
                                    <th className="px-4 py-2 text-left">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {authors.map((author) => (
                                    <tr key={author.id} className="border-b border-gray-700 hover:bg-gray-800">
                                        <td className="px-4 py-2">{author.id}</td>
                                        <td className="px-4 py-2 font-medium">{author.name}</td>
                                        <td className="px-4 py-2">@{author.handle}</td>
                                        <td className="px-4 py-2">{author.is_verified ? <span className='text-green-400'>Yes</span> : <span className='text-red-400'>No</span>}</td>
                                        <td className="px-4 py-2">{author.failed_login_attempts}</td>
                                        <td className="px-4 py-2">{author.lock_expires_at ? new Date(author.lock_expires_at).toLocaleString() : 'N/A'}</td>
                                        <td className="px-4 py-2">
                                            <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded text-sm">
                                                Edit
                                            </button>
                                            {/* Add more actions like suspend, delete etc. */}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Admin;
