import { useEffect, useRef, useState } from 'react';
import { WebPubSubClient } from '@azure/web-pubsub-client';

const GROUP_NAME = 'sample_chat';

function App() {

  const [nickname, setNickname] = useState('Guest');
  const nicknameRef = useRef('Guest');
  const [draft, setDraft] = useState('');
  const [messages, setMessages] = useState([
    { id: 'welcome', user: 'System', text: 'Chat connected. Say hello!', mine: false },
  ]);
  const [connectionStatus, setConnectionStatus] = useState('Connecting...');
  const clientRef = useRef(null);

  useEffect(() => {
    nicknameRef.current = nickname;
  }, [nickname]);

  useEffect(() => {

    const client = new WebPubSubClient({
      getClientAccessUrl: async () => {
        const response = await fetch(`${import.meta.env.VITE_SERVER_URL}/negotiate?user=${encodeURIComponent(nicknameRef.current || 'Guest')}`);
        const { url } = await response.json();
        return url;
      },
      autoReconnect: true,
    });

    clientRef.current = client;

    const handleConnected = () => {
      setConnectionStatus('Connected');
    };

    const handleDisconnected = (event) => {
      setConnectionStatus(event?.message?.message || 'Disconnected');
    };

    const handleGroupMessage = (event) => {
      const payload = event.message?.data;
      const data = typeof payload === 'string' ? JSON.parse(payload) : payload;
      const message = {
        id: `${event.message?.group}-${Date.now()}-${Math.random()}`,
        user: data?.user || 'Unknown',
        text: data?.text || '',
        mine: data?.user === (nickname || 'Guest'),
      };

      setMessages((currentMessages) => [...currentMessages, message]);
    };

    client.on('connected', handleConnected);
    client.on('disconnected', handleDisconnected);
    client.on('group-message', handleGroupMessage);

    client
      .start()
      .then(async () => {
        await client.joinGroup(GROUP_NAME);
        setConnectionStatus('Connected');
      })
      .catch((error) => {
        console.error('Unable to start WebPubSub client', error);
        setConnectionStatus('Connection failed');
      });

    return () => {
      client.off('connected', handleConnected);
      client.off('disconnected', handleDisconnected);
      client.off('group-message', handleGroupMessage);
      client.stop();
    };
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();

    const text = draft.trim();
    if (!text || !clientRef.current) {
      return;
    }

    const payload = {
      user: nickname.trim() || 'Guest',
      text,
    };

    await clientRef.current.sendToGroup(GROUP_NAME, payload, 'json');
    setDraft('');
  };

  return (
    <main className="chat-shell">
      <section className="chat-panel">
        <header className="chat-header">
          <div>
            <p className="eyebrow">Azure Web PubSub</p>
            <h1>Sample chat</h1>
          </div>
          <span className={`status-badge ${connectionStatus === 'Connected' ? 'online' : 'offline'}`}>
            {connectionStatus}
          </span>
        </header>

        <div className="chat-messages" aria-live="polite">
          {messages.map((message) => (
            <article key={message.id} className={`message ${message.mine ? 'mine' : ''}`}>
              <div className="message-meta">
                <strong>{message.user}</strong>
              </div>
              <p>{message.text}</p>
            </article>
          ))}
        </div>

        <form className="composer" onSubmit={handleSubmit}>
          <label className="nickname-field">
            <span>Name</span>
            <input
              type="text"
              value={nickname}
              onChange={(event) => setNickname(event.target.value || 'Guest')}
              maxLength={24}
            />
          </label>

          <div className="message-row">
            <input
              type="text"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Type your message"
              aria-label="Message"
            />
            <button type="submit" disabled={!draft.trim()}>Send</button>
          </div>
        </form>
      </section>
    </main>
  );
}

export default App;
