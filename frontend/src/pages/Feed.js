import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { api } from '../App';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import { Heart, MessageSquare, Send, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

const Feed = () => {
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState('');
  const [commentInput, setCommentInput] = useState({});
  const [loading, setLoading] = useState(true);
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const response = await api.get('/posts');
      setPosts(response.data);
    } catch (error) {
      toast.error('Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  const createPost = async () => {
    if (!newPost.trim()) return;

    try {
      await api.post('/posts', { content: newPost });
      setNewPost('');
      toast.success('Post created!');
      fetchPosts();
    } catch (error) {
      toast.error('Failed to create post');
    }
  };

  const likePost = async (postId) => {
    try {
      await api.post(`/posts/${postId}/like`);
      fetchPosts();
    } catch (error) {
      toast.error('Failed to like post');
    }
  };

  const deletePost = async (postId) => {
    try {
      await api.delete(`/posts/${postId}`);
      toast.success('Post deleted');
      fetchPosts();
    } catch (error) {
      toast.error('Failed to delete post');
    }
  };

  const commentOnPost = async (postId) => {
    const content = commentInput[postId];
    if (!content?.trim()) return;

    try {
      await api.post(`/posts/${postId}/comment`, { content });
      setCommentInput({ ...commentInput, [postId]: '' });
      toast.success('Comment added');
      fetchPosts();
    } catch (error) {
      toast.error('Failed to add comment');
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-3xl mx-auto p-6 space-y-6">
        {/* Create Post */}
        <Card className="p-6 animate-fade-in-up">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">Share an Update</h2>
          <Textarea
            data-testid="new-post-input"
            placeholder="What's on your mind?"
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
            rows={4}
            className="mb-4"
          />
          <Button
            data-testid="create-post-btn"
            onClick={createPost}
            disabled={!newPost.trim()}
            className="bg-violet-600 hover:bg-violet-700 text-white"
          >
            <Send className="w-4 h-4 mr-2" />
            Post
          </Button>
        </Card>

        {/* Posts Feed */}
        {posts.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-slate-600">No posts yet. Be the first to share something!</p>
          </Card>
        ) : (
          posts.map((post, idx) => (
            <Card key={post.id} data-testid={`post-${idx}`} className="p-6 animate-fade-in-up" style={{ animationDelay: `${idx * 0.1}s` }}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <Avatar>
                    <AvatarFallback className="bg-violet-100 text-violet-600 font-semibold">
                      {post.username[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-slate-800">{post.username}</h3>
                    <p className="text-sm text-slate-500">
                      {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
                {post.user_id === currentUser.id && (
                  <Button
                    data-testid={`delete-post-btn-${idx}`}
                    variant="ghost"
                    size="sm"
                    onClick={() => deletePost(post.id)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>

              <p className="text-slate-700 mb-4 whitespace-pre-wrap">{post.content}</p>

              <div className="flex items-center space-x-6 mb-4 pt-4 border-t border-slate-100">
                <button
                  data-testid={`like-post-btn-${idx}`}
                  onClick={() => likePost(post.id)}
                  className={`flex items-center space-x-2 ${post.likes.includes(currentUser.id) ? 'text-pink-600' : 'text-slate-600'} hover:text-pink-600`}
                >
                  <Heart className={`w-5 h-5 ${post.likes.includes(currentUser.id) ? 'fill-current' : ''}`} />
                  <span>{post.likes.length}</span>
                </button>
                <div className="flex items-center space-x-2 text-slate-600">
                  <MessageSquare className="w-5 h-5" />
                  <span>{post.comments.length}</span>
                </div>
              </div>

              {/* Comments */}
              {post.comments.length > 0 && (
                <div className="space-y-3 mb-4 pl-4 border-l-2 border-violet-200">
                  {post.comments.map((comment) => (
                    <div key={comment.id} className="bg-slate-50 rounded-lg p-3">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-semibold text-sm text-slate-800">{comment.username}</span>
                        <span className="text-xs text-slate-500">
                          {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-slate-700 text-sm">{comment.content}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Comment */}
              <div className="flex items-center space-x-2">
                <input
                  data-testid={`comment-input-${idx}`}
                  type="text"
                  placeholder="Write a comment..."
                  value={commentInput[post.id] || ''}
                  onChange={(e) => setCommentInput({ ...commentInput, [post.id]: e.target.value })}
                  onKeyPress={(e) => e.key === 'Enter' && commentOnPost(post.id)}
                  className="flex-1 px-4 py-2 bg-slate-50 rounded-full border border-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-600"
                />
                <Button
                  data-testid={`comment-submit-btn-${idx}`}
                  size="sm"
                  onClick={() => commentOnPost(post.id)}
                  disabled={!commentInput[post.id]?.trim()}
                  className="bg-violet-600 hover:bg-violet-700 text-white rounded-full px-6"
                >
                  Send
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>
    </Layout>
  );
};

export default Feed;
