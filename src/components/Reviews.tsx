
import React, { useState, useEffect } from 'react';

interface Review {
  id: number;
  content: string;
  rating: number;
  created_at: string;
}

const StarRating = ({ rating, setRating, interactive = false }: { rating: number, setRating?: (r: number) => void, interactive?: boolean }) => {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={!interactive}
          onClick={() => interactive && setRating && setRating(star)}
          className={`${interactive ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default'} focus:outline-none`}
        >
          <svg 
            className={`w-5 h-5 ${star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300 dark:text-gray-600'}`} 
            viewBox="0 0 24 24" 
            stroke="currentColor" 
            strokeWidth={star <= rating ? 0 : 2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
        </button>
      ))}
    </div>
  );
};

export const Reviews: React.FC = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [content, setContent] = useState('');
  const [rating, setRating] = useState(5);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fix: use process.env instead of import.meta.env to avoid TS errors and match vite config polyfill
  const API_URL = process.env.VITE_API_URL || 'http://localhost:3000';

  const fetchReviews = async () => {
    try {
      const res = await fetch(`${API_URL}/reviews`);
      if (!res.ok) throw new Error('Failed to connect to backend');
      const data = await res.json();
      setReviews(data);
      setError(null);
    } catch (err) {
      setError('Could not load reviews. Ensure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, rating }),
      });

      if (!res.ok) throw new Error('Failed to submit');

      const newReview = await res.json();
      setReviews([newReview, ...reviews]);
      setContent('');
      setRating(5);
    } catch (err) {
      alert('Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-950 overflow-y-auto custom-scrollbar">
      <div className="p-6 border-b border-gray-100 dark:border-slate-800">
         <h1 className="text-xl font-semibold text-gray-900 dark:text-white tracking-tight">Community Feedback</h1>
         <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
            Share your experience or suggestions for EDI Insight. Data stored securely in Postgres.
         </p>
      </div>

      <div className="flex-1 p-6 max-w-4xl mx-auto w-full">
        
        {/* Submission Form */}
        <div className="bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl p-6 mb-10 shadow-sm">
            <h2 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-4">Write a Review</h2>
            <form onSubmit={handleSubmit}>
                <div className="mb-4">
                    <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-2">Rating</label>
                    <StarRating rating={rating} setRating={setRating} interactive />
                </div>
                
                <div className="mb-4">
                    <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-2">Your Feedback</label>
                    <textarea 
                        className="w-full p-3 bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-700 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all placeholder-gray-400"
                        rows={3}
                        placeholder="What do you think about this tool?"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        required
                    />
                </div>

                <div className="flex justify-end">
                    <button 
                        type="submit" 
                        disabled={submitting || !content.trim()}
                        className="bg-black dark:bg-brand-600 text-white px-6 py-2 rounded-md text-sm font-medium hover:bg-gray-800 dark:hover:bg-brand-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {submitting && <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                        Submit Review
                    </button>
                </div>
            </form>
        </div>

        {/* Reviews List */}
        <div className="space-y-6">
            <h2 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">Recent Reviews</h2>
            
            {loading && (
                <div className="text-center py-10">
                    <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    <p className="text-xs text-gray-400">Loading feedback...</p>
                </div>
            )}

            {error && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900 text-red-600 dark:text-red-400 rounded-lg text-sm text-center">
                    {error}
                </div>
            )}

            {!loading && !error && reviews.length === 0 && (
                <div className="text-center py-10 border border-dashed border-gray-200 dark:border-slate-800 rounded-lg">
                    <p className="text-gray-400 dark:text-slate-500 text-sm">No reviews yet. Be the first!</p>
                </div>
            )}

            <div className="grid gap-4">
                {reviews.map((review) => (
                    <div key={review.id} className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 p-5 rounded-lg shadow-sm hover:border-gray-200 dark:hover:border-slate-700 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                            <StarRating rating={review.rating} />
                            <span className="text-[10px] text-gray-400 dark:text-slate-500">
                                {new Date(review.created_at).toLocaleDateString()}
                            </span>
                        </div>
                        <p className="text-gray-700 dark:text-slate-300 text-sm leading-relaxed">
                            {review.content}
                        </p>
                    </div>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
};
