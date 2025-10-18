import React, { useState, useRef, useEffect } from 'react';
import { api } from '../api';

export default function ChatPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    
    const userMessage = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage, products: [] }]);
    setLoading(true);

    try {
      const res = await api.post('/chat', { message: userMessage });
      
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: res.data.response,
        products: res.data.recommendations || []
      }]);
    } catch (e) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please make sure the backend is running.',
        products: []
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', height: '85vh', display: 'flex', flexDirection: 'column' }}>
      <h2 style={{ marginBottom: '20px', color: '#333' }}>🛋️ AI Furniture Assistant</h2>
      
      <div style={{
        flex: 1,
        overflow: 'auto',
        border: '1px solid #e0e0e0',
        borderRadius: '12px',
        padding: '20px',
        backgroundColor: '#f9f9f9',
        marginBottom: '15px'
      }}>
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', color: '#999', padding: '40px' }}>
            <p>👋 Hello! I'm your AI furniture assistant.</p>
            <p>Ask me anything like:</p>
            <ul style={{ listStyle: 'none', padding: 0, marginTop: '10px' }}>
              <li>• "Show me modern black office chairs"</li>
              <li>• "I need a wooden dining table"</li>
              <li>• "Looking for bathroom storage solutions"</li>
            </ul>
          </div>
        )}
        
        {messages.map((msg, idx) => (
          <div key={idx} style={{
            marginBottom: '15px',
            display: 'flex',
            justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start'
          }}>
            <div style={{
              maxWidth: '75%',
              padding: '12px 16px',
              borderRadius: '18px',
              backgroundColor: msg.role === 'user' ? '#007bff' : '#fff',
              color: msg.role === 'user' ? '#fff' : '#333',
              boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
            }}>
              <p style={{ margin: 0 }}>{msg.content}</p>
              
              {msg.products && msg.products.length > 0 && (
                <div style={{ marginTop: '15px' }}>
                  {msg.products.map((product, pidx) => (
                    <div key={pidx} style={{
                      backgroundColor: '#f8f9fa',
                      padding: '15px',
                      borderRadius: '10px',
                      marginTop: '10px',
                      border: '1px solid #e9ecef'
                    }}>
                      <div style={{ display: 'flex', gap: '15px' }}>
                        {product.images && product.images.length > 0 && (
                          <img
                            src={product.images[0]}
                            alt={product.title}
                            style={{
                              width: '120px',
                              height: '120px',
                              objectFit: 'cover',
                              borderRadius: '8px'
                            }}
                          />
                        )}
                        <div style={{ flex: 1 }}>
                          <h4 style={{ margin: '0 0 8px 0', color: '#212529', fontSize: '16px' }}>
                            {product.title}
                          </h4>
                          <p style={{ margin: '4px 0', fontSize: '14px', color: '#666' }}>
                            <strong>Brand:</strong> {product.brand} | <strong>Price:</strong> {product.price}
                          </p>
                          {product.color && (
                            <p style={{ margin: '4px 0', fontSize: '14px', color: '#666' }}>
                              <strong>Color:</strong> {product.color}
                            </p>
                          )}
                          {product.material && (
                            <p style={{ margin: '4px 0', fontSize: '14px', color: '#666' }}>
                              <strong>Material:</strong> {product.material}
                            </p>
                          )}
                          <p style={{ margin: '8px 0 0 0', fontSize: '13px', color: '#555', fontStyle: 'italic' }}>
                            {product.enhanced_description}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        
        {loading && (
          <div style={{ textAlign: 'center', color: '#999' }}>
            <p>🤔 Thinking...</p>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      <div style={{ display: 'flex', gap: '10px' }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ask me about furniture..."
          disabled={loading}
          style={{
            flex: 1,
            padding: '12px 16px',
            borderRadius: '24px',
            border: '1px solid #ddd',
            fontSize: '14px',
            outline: 'none'
          }}
        />
        <button
          onClick={sendMessage}
          disabled={loading || !input.trim()}
          style={{
            padding: '12px 24px',
            borderRadius: '24px',
            border: 'none',
            backgroundColor: '#007bff',
            color: '#fff',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            opacity: (loading || !input.trim()) ? 0.6 : 1
          }}
        >
          {loading ? '...' : 'Send'}
        </button>
      </div>
    </div>
  );
}