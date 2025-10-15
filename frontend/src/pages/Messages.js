import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { api } from '../App';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import { ScrollArea } from '../components/ui/scroll-area';
import { Send, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

const Messages = () => {
  const { userId: selectedUserId } = useParams();
  const navigate = useNavigate();
  const [connections, setConnections] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const wsRef = useRef(null);

  useEffect(() => {
    fetchConnections();
    setupWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  useEffect(() => {
    if (selectedUserId && connections.length > 0) {
      const user = connections.find((c) => c.id === selectedUserId);
      if (user) {
        selectUser(user);
      }
    }
  }, [selectedUserId, connections]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const setupWebSocket = () => {
    const wsUrl = process.env.REACT_APP_BACKEND_URL.replace('https://', 'wss://').replace('http://', 'ws://');
    const ws = new WebSocket(`${wsUrl}/ws/${currentUser.id}`);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'new_message' && data.message.sender_id === selectedUser?.id) {
        setMessages((prev) => [...prev, data.message]);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    wsRef.current = ws;
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchConnections = async () => {
    try {
      const response = await api.get('/connections');
      setConnections(response.data);
    } catch (error) {
      toast.error('Failed to load connections');
    } finally {
      setLoading(false);
    }
  };

  const selectUser = async (user) => {
    setSelectedUser(user);
    navigate(`/messages/${user.id}`);
    try {
      const response = await api.get(`/messages/${user.id}`);
      setMessages(response.data);
    } catch (error) {
      toast.error('Failed to load messages');
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedUser) return;

    try {
      const response = await api.post('/messages', {
        receiver_id: selectedUser.id,
        content: newMessage,
      });
      setMessages([...messages, response.data]);
      setNewMessage('');
    } catch (error) {
      toast.error('Failed to send message');
    }
  };

  const getProfessionColor = (profession) => {
    const colors = {
      engineer: 'bg-violet-100 text-violet-700',
      doctor: 'bg-pink-100 text-pink-700',
      artist: 'bg-cyan-100 text-cyan-700',
      teacher: 'bg-emerald-100 text-emerald-700',
    };
    return colors[profession?.toLowerCase()] || 'bg-slate-100 text-slate-700';
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
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-6 animate-fade-in-up">
          <h1 className="text-4xl font-bold text-slate-800 mb-2">Messages</h1>
          <p className="text-slate-600">Chat with your connections in real-time</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Connections List */}
          <Card className="lg:col-span-1 p-4 animate-fade-in-up delay-100">
            <h2 className="font-semibold text-lg text-slate-800 mb-4">Connections</h2>
            {connections.length === 0 ? (
              <div className="text-center py-12">
                <MessageCircle className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p className="text-sm text-slate-600">No connections yet</p>
                <Button
                  data-testid="go-to-discover"
                  size="sm"
                  onClick={() => navigate('/discover')}
                  className="mt-4 bg-violet-600 hover:bg-violet-700 text-white"
                >
                  Discover People
                </Button>
              </div>
            ) : (
              <ScrollArea className="h-[600px]">
                <div className="space-y-2">
                  {connections.map((user, idx) => (
                    <button
                      key={user.id}
                      data-testid={`connection-item-${idx}`}
                      onClick={() => selectUser(user)}
                      className={`w-full p-3 rounded-lg text-left smooth-transition ${
                        selectedUser?.id === user.id
                          ? 'bg-violet-100 border-2 border-violet-300'
                          : 'bg-slate-50 hover:bg-slate-100 border-2 border-transparent'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <Avatar className="w-10 h-10">
                          <AvatarFallback className={`${getProfessionColor(user.profession)} text-sm font-semibold`}>
                            {user.username[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-slate-800 truncate">{user.full_name}</p>
                          <p className="text-xs text-slate-600 truncate">{user.profession}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            )}
          </Card>

          {/* Chat Area */}
          <Card className="lg:col-span-2 animate-fade-in-up delay-200">
            {!selectedUser ? (
              <div className="flex items-center justify-center h-[700px]">
                <div className="text-center">
                  <MessageCircle className="w-20 h-20 mx-auto mb-4 text-slate-300" />
                  <h3 className="text-xl font-semibold text-slate-700 mb-2">Select a conversation</h3>
                  <p className="text-slate-600">Choose a connection from the list to start messaging</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col h-[700px]">
                {/* Chat Header */}
                <div className="p-4 border-b border-slate-200">
                  <div className="flex items-center space-x-3">
                    <Avatar className="w-12 h-12">
                      <AvatarFallback className={`${getProfessionColor(selectedUser.profession)} text-lg font-semibold`}>
                        {selectedUser.username[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-slate-800">{selectedUser.full_name}</h3>
                      <p className="text-sm text-slate-600">{selectedUser.profession}</p>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {messages.length === 0 ? (
                      <div className="text-center py-12">
                        <p className="text-slate-600">No messages yet. Start the conversation!</p>
                      </div>
                    ) : (
                      messages.map((msg, idx) => {
                        const isCurrentUser = msg.sender_id === currentUser.id;
                        return (
                          <div
                            key={msg.id}
                            data-testid={`message-${idx}`}
                            className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                                isCurrentUser
                                  ? 'bg-violet-600 text-white rounded-br-none'
                                  : 'bg-slate-100 text-slate-800 rounded-bl-none'
                              }`}
                            >
                              <p className="text-sm">{msg.content}</p>
                              <p
                                className={`text-xs mt-1 ${
                                  isCurrentUser ? 'text-violet-200' : 'text-slate-500'
                                }`}
                              >
                                {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                              </p>
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                {/* Message Input */}
                <div className="p-4 border-t border-slate-200">
                  <div className="flex items-center space-x-2">
                    <Input
                      data-testid="message-input"
                      placeholder="Type a message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                      className="flex-1"
                    />
                    <Button
                      data-testid="send-message-btn"
                      onClick={sendMessage}
                      disabled={!newMessage.trim()}
                      className="bg-violet-600 hover:bg-violet-700 text-white"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Messages;
