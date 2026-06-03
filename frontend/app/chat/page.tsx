'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { searchUsers, getConversation } from '@/lib/api';
import socket from '@/lib/socket';

interface Message {
  id: string;
  content: string;
  senderId: string;
  receiverId?: string;
  groupId?: string;
  createdAt: string;
  sender?: { id: string; username: string };
}

interface User { id: string; username: string; }
interface Group { id: string; name: string; }

const USER_COLORS = ['#6366f1','#8b5cf6','#ec4899','#14b8a6','#f59e0b','#10b981','#3b82f6','#ef4444'];

function colorForUser(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return USER_COLORS[Math.abs(hash) % USER_COLORS.length];
}

function getInitial(name: string) { return name.charAt(0).toUpperCase(); }

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}

const REACTIONS = ['👍','❤️','😂','😮','😢'];

export default function ChatPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [userId, setUserId] = useState('');
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [activeChat, setActiveChat] = useState<User | null>(null);
  const [activeGroup, setActiveGroup] = useState<Group | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [groupName, setGroupName] = useState('');
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [myGroups, setMyGroups] = useState<Group[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [reactions, setReactions] = useState<Record<string, string>>({});
  const [hoveredMsg, setHoveredMsg] = useState<string | null>(null);
  const [newMsgIds, setNewMsgIds] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const storedUsername = localStorage.getItem('username');
    const storedToken = localStorage.getItem('token');
    if (!storedToken || !storedUsername) { router.push('/'); return; }
    setUsername(storedUsername);

    fetch(`http://localhost:3000/users/search?username=${storedUsername}`)
      .then(r => r.json())
      .then(users => {
        if (users.length > 0) {
          setUserId(users[0].id);
          fetch(`http://localhost:3000/chats/groups/user/${users[0].id}`)
            .then(r => r.json())
            .then(groups => setMyGroups(groups));
        }
      });

    socket.connect();
    socket.on('newMessage', (message: Message) => {
      setMessages(prev => {
        if (prev.find(m => m.id === message.id)) return prev;
        setNewMsgIds(ids => new Set([...ids, message.id]));
        setTimeout(() => setNewMsgIds(ids => { const n = new Set(ids); n.delete(message.id); return n; }), 500);
        return [...prev, message];
      });
    });

    socket.on('typing', () => {
      setIsTyping(true);
      if (typingTimeout.current) clearTimeout(typingTimeout.current);
      typingTimeout.current = setTimeout(() => setIsTyping(false), 2000);
    });

    socket.on('reactionAdded', (data: { messageId: string; emoji: string; userId: string }) => {
      setReactions(prev => ({ ...prev, [data.messageId]: data.emoji }));
    });

    return () => { socket.disconnect(); };
  }, [router]);

  useEffect(() => {
    if (userId) socket.emit('joinRoom', userId);
  }, [userId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function handleTyping() {
    if (activeChat) socket.emit('typing', { to: activeChat.id });
  }

  async function handleSearch() {
    if (!search.trim()) return;
    const results = await searchUsers(search);
    setSearchResults(results.filter((u: User) => u.username !== username));
  }

  async function openChat(user: User) {
    setActiveChat(user); setActiveGroup(null);
    setSearchResults([]); setSearch('');
    const history = await getConversation(userId, user.id);
    setMessages(history);
  }

  async function openGroupChat(group: Group) {
    setActiveGroup(group); setActiveChat(null);
    const res = await fetch(`http://localhost:3000/chats/groups/${group.id}/messages`);
    setMessages(await res.json());
  }

  async function handleSend() {
    if (!newMessage.trim()) return;
    if (activeChat) socket.emit('sendMessage', { senderId: userId, receiverId: activeChat.id, content: newMessage });
    else if (activeGroup) socket.emit('sendMessage', { senderId: userId, groupId: activeGroup.id, content: newMessage });
    setNewMessage('');
  }

  async function handleCreateGroup() {
    if (!groupName.trim()) return;
    const res = await fetch('http://localhost:3000/chats/groups/create', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: groupName, creatorId: userId }),
    });
    const group = await res.json();
    openGroupChat(group);
    setGroupName(''); setShowCreateGroup(false);
    setMyGroups(prev => [...prev, group]);
  }

  function handleLogout() { localStorage.clear(); router.push('/'); }

  function addReaction(msgId: string, emoji: string) {
    setReactions(prev => ({ ...prev, [msgId]: emoji }));
    setHoveredMsg(null);
    socket.emit('addReaction', { messageId: msgId, emoji, userId });
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');
        * { font-family: 'DM Sans', sans-serif; box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #374151; border-radius: 99px; }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; } to { opacity: 1; }
        }
        @keyframes pulse-dot {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        .msg-new { animation: slideUp 0.35s cubic-bezier(.22,1,.36,1) both; }
        .msg-bubble { transition: filter 0.15s, transform 0.15s; }
        .msg-bubble:hover { filter: brightness(1.08); transform: scale(1.01); }
        .sidebar-item { transition: background 0.2s, transform 0.15s, box-shadow 0.2s; }
        .sidebar-item:hover { transform: translateX(3px); box-shadow: -3px 0 0 #6366f1; }
        .reaction-picker { animation: fadeIn 0.15s ease; }
        .send-btn { transition: background 0.15s, transform 0.1s, box-shadow 0.2s; }
        .send-btn:hover:not(:disabled) { transform: scale(1.05); box-shadow: 0 0 20px #6366f180; }
        .send-btn:active:not(:disabled) { transform: scale(0.96); }
        .search-input:focus { box-shadow: 0 0 0 2px #6366f160; }
        .nav-glow { box-shadow: inset 0 -1px 0 #ffffff08; }
        .dot { display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: #6366f1; animation: pulse-dot 1.2s infinite ease-in-out; }
        .dot:nth-child(2) { animation-delay: 0.2s; }
        .dot:nth-child(3) { animation-delay: 0.4s; }
        .group-btn:hover { background: #1e1b4b; }
        .logout-btn { transition: color 0.15s; }
        .logout-btn:hover { color: #f87171; }
      `}</style>

      <main style={{ height: '100vh', background: '#0a0a0f', display: 'flex', overflow: 'hidden', color: '#e2e8f0' }}>

        {/* ── SIDEBAR ── */}
        <aside style={{ width: 280, background: '#0f0f17', borderRight: '1px solid #1e1e2e', display: 'flex', flexDirection: 'column' }}>

          {/* Logo + user */}
          <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid #1e1e2e' }} className="nav-glow">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 32, height: 32, borderRadius: 10, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>💬</div>
                <span style={{ fontWeight: 600, fontSize: 17, letterSpacing: '-0.3px' }}>Chatflow</span>
              </div>
              <button onClick={handleLogout} className="logout-btn" style={{ fontSize: 11, color: '#4b5563', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px', borderRadius: 6 }}>
                salir
              </button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: colorForUser(userId || 'x'), display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: 15, flexShrink: 0 }}>
                {getInitial(username)}
              </div>
              <div>
                <p style={{ fontWeight: 500, fontSize: 14, margin: 0 }}>{username}</p>
                <p style={{ fontSize: 11, color: '#22c55e', margin: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }}/>
                  en línea
                </p>
              </div>
            </div>
          </div>

          {/* Buscar */}
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #1e1e2e' }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                className="search-input"
                type="text"
                placeholder="Buscar usuario..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                style={{ flex: 1, background: '#1a1a2e', border: '1px solid #2d2d44', borderRadius: 10, padding: '8px 12px', color: '#e2e8f0', fontSize: 13, outline: 'none', transition: 'box-shadow 0.2s' }}
              />
              <button onClick={handleSearch} style={{ background: '#6366f1', border: 'none', borderRadius: 10, padding: '8px 12px', cursor: 'pointer', fontSize: 14, transition: 'background 0.15s' }}
                onMouseOver={e => (e.currentTarget.style.background = '#4f46e5')}
                onMouseOut={e => (e.currentTarget.style.background = '#6366f1')}>
                🔍
              </button>
            </div>

            {searchResults.length > 0 && (
              <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
                {searchResults.map(user => (
                  <button key={user.id} onClick={() => openChat(user)} className="sidebar-item"
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 10, background: '#1a1a2e', border: 'none', cursor: 'pointer', color: '#e2e8f0', textAlign: 'left', width: '100%' }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: colorForUser(user.id), display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: 12, flexShrink: 0 }}>
                      {getInitial(user.username)}
                    </div>
                    <span style={{ fontSize: 13 }}>{user.username}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Conversaciones activas */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
            <p style={{ fontSize: 10, fontWeight: 600, color: '#4b5563', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 6px 4px' }}>Conversaciones</p>

            {activeChat && (
              <button onClick={() => openChat(activeChat)} className="sidebar-item"
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 12, background: '#1a1a2e', border: '1px solid #2d2d44', cursor: 'pointer', color: '#e2e8f0', textAlign: 'left', width: '100%' }}>
                <div style={{ width: 34, height: 34, borderRadius: '50%', background: colorForUser(activeChat.id), display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: 14, flexShrink: 0, position: 'relative' }}>
                  {getInitial(activeChat.username)}
                  <span style={{ position: 'absolute', bottom: 0, right: 0, width: 9, height: 9, borderRadius: '50%', background: '#22c55e', border: '2px solid #0f0f17' }}/>
                </div>
                <div style={{ overflow: 'hidden' }}>
                  <p style={{ fontWeight: 500, fontSize: 13, margin: 0 }}>{activeChat.username}</p>
                  <p style={{ fontSize: 11, color: '#6b7280', margin: 0 }}>Chat privado</p>
                </div>
              </button>
            )}

            {activeGroup && (
              <button onClick={() => openGroupChat(activeGroup)} className="sidebar-item"
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 12, background: '#1a1a2e', border: '1px solid #2d2d44', cursor: 'pointer', color: '#e2e8f0', textAlign: 'left', width: '100%' }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: 'linear-gradient(135deg, #7c3aed, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 16, flexShrink: 0 }}>#</div>
                <div>
                  <p style={{ fontWeight: 500, fontSize: 13, margin: 0 }}>{activeGroup.name}</p>
                  <p style={{ fontSize: 11, color: '#6b7280', margin: 0 }}>Grupo</p>
                </div>
              </button>
            )}

            {myGroups.length > 0 && (
              <div style={{ marginTop: 8 }}>
                <p style={{ fontSize: 10, fontWeight: 600, color: '#4b5563', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 6px 4px' }}>Mis grupos</p>
                {myGroups.map(group => (
                  <button key={group.id} onClick={() => openGroupChat(group)} className="sidebar-item"
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 12, background: activeGroup?.id === group.id ? '#2d1b4e' : '#1a1a2e', border: `1px solid ${activeGroup?.id === group.id ? '#7c3aed' : '#2d2d44'}`, cursor: 'pointer', color: '#e2e8f0', textAlign: 'left', width: '100%', marginBottom: 4 }}>
                    <div style={{ width: 34, height: 34, borderRadius: 10, background: 'linear-gradient(135deg, #7c3aed, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 16, flexShrink: 0 }}>#</div>
                    <div>
                      <p style={{ fontWeight: 500, fontSize: 13, margin: 0 }}>{group.name}</p>
                      <p style={{ fontSize: 11, color: '#6b7280', margin: 0 }}>Grupo</p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {!activeChat && !activeGroup && myGroups.length === 0 && (
              <p style={{ fontSize: 12, color: '#374151', textAlign: 'center', marginTop: 20 }}>Busca un usuario para empezar</p>
            )}
          </div>

          {/* Crear grupo */}
          <div style={{ padding: '12px 16px', borderTop: '1px solid #1e1e2e' }}>
            <button onClick={() => setShowCreateGroup(!showCreateGroup)} className="group-btn"
              style={{ width: '100%', padding: '9px 12px', borderRadius: 10, background: 'transparent', border: '1px dashed #2d2d44', color: '#6b7280', cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.2s' }}>
              <span style={{ fontSize: 18, lineHeight: 1 }}>+</span> Crear grupo
            </button>
            {showCreateGroup && (
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <input type="text" placeholder="Nombre del grupo..." value={groupName}
                  onChange={e => setGroupName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleCreateGroup()}
                  style={{ flex: 1, background: '#1a1a2e', border: '1px solid #7c3aed', borderRadius: 10, padding: '8px 12px', color: '#e2e8f0', fontSize: 13, outline: 'none' }}
                />
                <button onClick={handleCreateGroup}
                  style={{ background: '#7c3aed', border: 'none', borderRadius: 10, padding: '8px 12px', cursor: 'pointer', color: 'white', fontSize: 16, transition: 'background 0.15s' }}>✓</button>
              </div>
            )}
          </div>
        </aside>

        {/* ── CHAT AREA ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#0d0d14' }}>
          {activeChat || activeGroup ? (
            <>
              {/* Header */}
              <div style={{ padding: '14px 24px', borderBottom: '1px solid #1e1e2e', background: '#0f0f17', display: 'flex', alignItems: 'center', gap: 14 }} className="nav-glow">
                <div style={{ width: 42, height: 42, borderRadius: activeGroup ? 12 : '50%', background: activeGroup ? 'linear-gradient(135deg, #7c3aed, #a855f7)' : colorForUser(activeChat?.id || ''), display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: activeGroup ? 18 : 16, flexShrink: 0 }}>
                  {activeGroup ? '#' : getInitial(activeChat?.username || '')}
                </div>
                <div>
                  <p style={{ fontWeight: 600, fontSize: 15, margin: 0 }}>{activeGroup ? activeGroup.name : activeChat?.username}</p>
                  <p style={{ fontSize: 11, color: activeGroup ? '#a855f7' : '#22c55e', margin: 0 }}>
                    {isTyping ? <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>escribiendo <span className="dot"/><span className="dot"/><span className="dot"/></span> : activeGroup ? 'Grupo' : 'en línea'}
                  </p>
                </div>
                <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                  <span style={{ fontSize: 11, color: '#374151', background: '#1a1a2e', padding: '4px 10px', borderRadius: 99, border: '1px solid #2d2d44' }}>
                    {messages.length} mensajes
                  </span>
                </div>
              </div>

              {/* Messages */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: 2 }}>
                {messages.map((msg, i) => {
                  const isMe = msg.senderId === userId;
                  const senderName = msg.sender?.username || 'Usuario';
                  const showAvatar = !isMe && (i === 0 || messages[i-1].senderId !== msg.senderId);
                  const isNew = newMsgIds.has(msg.id);
                  const reaction = reactions[msg.id];
                  const isHovered = hoveredMsg === msg.id;

                  return (
                    <div key={msg.id} className={isNew ? 'msg-new' : ''}
                      style={{ display: 'flex', flexDirection: isMe ? 'row-reverse' : 'row', alignItems: 'flex-end', gap: 8, marginBottom: 4, position: 'relative' }}
                      onMouseEnter={() => setHoveredMsg(msg.id)}
                      onMouseLeave={() => setHoveredMsg(null)}>

                      {/* Avatar */}
                      <div style={{ width: 28, flexShrink: 0 }}>
                        {!isMe && showAvatar && (
                          <div style={{ width: 28, height: 28, borderRadius: '50%', background: colorForUser(msg.senderId), display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: 11 }}>
                            {getInitial(senderName)}
                          </div>
                        )}
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start', maxWidth: '60%', gap: 2 }}>
                        {activeGroup && !isMe && showAvatar && (
                          <span style={{ fontSize: 10, color: colorForUser(msg.senderId), fontWeight: 600, paddingLeft: 4 }}>{senderName}</span>
                        )}

                        <div style={{ position: 'relative' }}>
                          {/* Reaction picker */}
                          {isHovered && (
                            <div className="reaction-picker" style={{ position: 'absolute', top: -38, [isMe ? 'right' : 'left']: 0, display: 'flex', gap: 4, background: '#1a1a2e', border: '1px solid #2d2d44', borderRadius: 99, padding: '4px 8px', zIndex: 10, whiteSpace: 'nowrap' }}>
                              {REACTIONS.map(emoji => (
                                <button key={emoji} onClick={() => addReaction(msg.id, emoji)}
                                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, padding: '0 2px', transition: 'transform 0.1s' }}
                                  onMouseOver={e => (e.currentTarget.style.transform = 'scale(1.3)')}
                                  onMouseOut={e => (e.currentTarget.style.transform = 'scale(1)')}>
                                  {emoji}
                                </button>
                              ))}
                            </div>
                          )}

                          {/* Bubble */}
                          <div className="msg-bubble" style={{
                            padding: '8px 12px 6px',
                            borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                            background: isMe ? 'linear-gradient(135deg, #6366f1, #4f46e5)' : '#1a1a2e',
                            border: isMe ? 'none' : '1px solid #2d2d44',
                            position: 'relative',
                          }}>
                            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5, wordBreak: 'break-word' }}>{msg.content}</p>
                            <p style={{ margin: '2px 0 0', fontSize: 10, color: isMe ? 'rgba(255,255,255,0.45)' : '#374151', textAlign: 'right', fontFamily: 'DM Mono, monospace' }}>
                              {formatTime(msg.createdAt)}
                            </p>
                          </div>

                          {/* Reaction badge */}
                          {reaction && (
                            <div style={{ position: 'absolute', bottom: -10, [isMe ? 'left' : 'right']: 4, background: '#1a1a2e', border: '1px solid #2d2d44', borderRadius: 99, padding: '1px 6px', fontSize: 13 }}>
                              {reaction}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div style={{ padding: '16px 24px', background: '#0f0f17', borderTop: '1px solid #1e1e2e', display: 'flex', gap: 12, alignItems: 'center' }}>
                <input
                  type="text"
                  placeholder={`Mensaje para ${activeGroup ? activeGroup.name : activeChat?.username}...`}
                  value={newMessage}
                  onChange={e => { setNewMessage(e.target.value); handleTyping(); }}
                  onKeyDown={e => e.key === 'Enter' && handleSend()}
                  style={{ flex: 1, background: '#1a1a2e', border: '1px solid #2d2d44', borderRadius: 14, padding: '12px 18px', color: '#e2e8f0', fontSize: 14, outline: 'none', transition: 'border-color 0.2s, box-shadow 0.2s' }}
                  onFocus={e => { e.target.style.borderColor = '#6366f1'; e.target.style.boxShadow = '0 0 0 3px #6366f120'; }}
                  onBlur={e => { e.target.style.borderColor = '#2d2d44'; e.target.style.boxShadow = 'none'; }}
                />
                <button onClick={handleSend} disabled={!newMessage.trim()} className="send-btn"
                  style={{ background: newMessage.trim() ? 'linear-gradient(135deg, #6366f1, #4f46e5)' : '#1a1a2e', border: newMessage.trim() ? 'none' : '1px solid #2d2d44', borderRadius: 14, padding: '12px 22px', color: newMessage.trim() ? 'white' : '#374151', fontWeight: 600, fontSize: 14, cursor: newMessage.trim() ? 'pointer' : 'not-allowed', transition: 'all 0.2s' }}>
                  Enviar
                </button>
              </div>
            </>
          ) : (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
              <div style={{ fontSize: 64, animation: 'pulse-dot 3s ease-in-out infinite' }}>💬</div>
              <p style={{ color: '#374151', fontSize: 18, fontWeight: 500, margin: 0 }}>Bienvenido a Chatflow</p>
              <p style={{ color: '#1f2937', fontSize: 14, margin: 0 }}>Busca un usuario en el sidebar para empezar</p>
            </div>
          )}
        </div>
      </main>
    </>
  );
}