import React, { useState, useEffect } from 'react';

function AuthorPanel() {
    const [news, setNews] = useState([]);
    const [newPost, setNewPost] = useState({ text: '', tags: '' });
    const authorId = 1; // This should be dynamically set based on logged in user

    useEffect(() => {
        // Fetch news for the author
        const fetchNews = async () => {
            try {
                // In a real app, you'd fetch news for the logged-in author
                const response = await fetch(`http://localhost:3001/api/news`); 
                const allNews = await response.json();
                setNews(allNews.filter(item => item.author_id === authorId));
            } catch (error) {
                console.error("Error fetching news:", error);
            }
        };
        fetchNews();
    }, [authorId]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewPost({ ...newPost, [name]: value });
    };

    const handlePostSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch('http://localhost:3001/api/news', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...newPost, author_id: authorId, date: new Date().toISOString() }),
            });
            if(response.ok) {
                // Refresh news list
                const updatedNewsResponse = await fetch(`http://localhost:3001/api/news`); 
                const allNews = await updatedNewsResponse.json();
                setNews(allNews.filter(item => item.author_id === authorId));
                setNewPost({ text: '', tags: '' }); // Clear form
            }
        } catch (error) {
            console.error("Error creating post:", error);
        }
    };

    return (
        <div className="bg-gray-800 text-white min-h-screen">
            <div className="container mx-auto p-4">
                <h1 className="text-3xl font-bold mb-6">Author Panel</h1>

                {/* Create New Post Form */}
                <div className="bg-gray-900 shadow-md rounded-lg p-6 mb-8">
                    <h2 className="text-xl font-semibold mb-4">Create New Post</h2>
                    <form onSubmit={handlePostSubmit}>
                        <div className="mb-4">
                            <label htmlFor="text" className="block text-gray-400 text-sm font-bold mb-2">Content:</label>
                            <textarea 
                                id="text" 
                                name="text" 
                                value={newPost.text}
                                onChange={handleInputChange}
                                className="w-full bg-gray-800 border border-gray-700 rounded py-2 px-3 text-white leading-tight focus:outline-none focus:bg-gray-700 focus:border-blue-500 h-24"
                                placeholder="What's on your mind?"
                            ></textarea>
                        </div>
                        <div className="mb-4">
                            <label htmlFor="tags" className="block text-gray-400 text-sm font-bold mb-2">Tags (comma-separated):</label>
                            <input 
                                type="text" 
                                id="tags" 
                                name="tags" 
                                value={newPost.tags}
                                onChange={handleInputChange}
                                className="w-full bg-gray-800 border border-gray-700 rounded py-2 px-3 text-white leading-tight focus:outline-none focus:bg-gray-700 focus:border-blue-500"
                                placeholder="e.g., info, update, important"
                            />
                        </div>
                        <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
                            Publish Post
                        </button>
                    </form>
                </div>

                {/* News Feed */}
                <div className="bg-gray-900 shadow-md rounded-lg p-4">
                    <h2 className="text-xl font-semibold mb-4">Your Posts</h2>
                    <div className="space-y-4">
                        {news.map(item => (
                            <div key={item.id} className="bg-gray-800 p-4 rounded-lg">
                                <p className="text-gray-300">{item.text}</p>
                                <div className="text-sm text-gray-500 mt-2">
                                    <span>{new Date(item.date).toLocaleString()}</span>
                                    {item.tags && <span className="ml-4">Tags: {item.tags}</span>}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AuthorPanel;
