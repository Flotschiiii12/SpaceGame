import React, { useState, useEffect, useRef } from 'react';
import { multiplayer } from '../game/multiplayerClient.ts';
import { GlobalChatMessage } from '../game/types.ts';
import { sound } from '../game/audio.ts';
import { Send, Radio, MessageSquare, Shield, Users, X } from 'lucide-react';

interface GlobalChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GlobalChatDrawer: React.FC<GlobalChatDrawerProps> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState<GlobalChatMessage[]>(multiplayer.globalChat);
  const [inputText, setInputText] = useState('');
  const [activeChannel, setActiveChannel] = useState<'all' | 'global' | 'guild'>('all');
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setMessages([...multiplayer.globalChat]);

    const handleMsg = (newMsg: GlobalChatMessage) => {
      setMessages((prev) => [...prev.slice(-70), newMsg]);
    };

    const handleHistory = (history: GlobalChatMessage[]) => {
      setMessages([...history]);
    };

    multiplayer.onGlobalChatReceived = handleMsg;
    multiplayer.onGlobalChatHistory = handleHistory;

    return () => {
      multiplayer.onGlobalChatReceived = undefined;
      multiplayer.onGlobalChatHistory = undefined;
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    const text = inputText.trim();
    if (!text) return;

    multiplayer.sendGlobalChat(text);
    setInputText('');
    sound.playHit(false);
  };

  if (!isOpen) return null;

  const filteredMessages = messages.filter((m) => {
    if (activeChannel === 'all') return true;
    if (activeChannel === 'global') return m.channel === 'global' || m.channel === 'system';
    if (activeChannel === 'guild') return m.channel === 'guild';
    return true;
  });

  return (
    <div className="fixed bottom-20 right-4 z-50 w-96 max-w-[calc(100vw-2rem)] h-[460px] bg-slate-950/95 border border-slate-800 rounded-2xl shadow-2xl backdrop-blur-xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200">
      {/* Header */}
      <div className="p-3.5 border-b border-slate-800 bg-slate-900/70 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
            <Radio className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="text-xs font-bold text-white font-mono flex items-center gap-1.5">
              <span>FLEET COMMS // RELAY</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <div className="text-[10px] text-slate-400 font-mono">Quantum Subspace Transceiver</div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Channel Filters */}
      <div className="flex items-center gap-1 px-3 py-1.5 bg-slate-900/40 border-b border-slate-800/80 text-[11px] font-mono">
        <button
          onClick={() => setActiveChannel('all')}
          className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
            activeChannel === 'all' ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          All Transmissions
        </button>
        <button
          onClick={() => setActiveChannel('global')}
          className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
            activeChannel === 'global' ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Global Fleet
        </button>
        {multiplayer.currentGuild && (
          <button
            onClick={() => setActiveChannel('guild')}
            className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
              activeChannel === 'guild' ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            [{multiplayer.currentGuild.tag}] Guild
          </button>
        )}
      </div>

      {/* Message Feed */}
      <div className="flex-1 p-3 overflow-y-auto space-y-2 text-xs font-mono">
        {filteredMessages.length === 0 ? (
          <div className="text-center text-slate-500 py-12">No subspace transmissions on this band.</div>
        ) : (
          filteredMessages.map((m) => {
            const isSystem = m.channel === 'system';
            const isSelf = m.senderId === multiplayer.playerId;
            return (
              <div
                key={m.id}
                className={`p-2 rounded-lg border text-left leading-relaxed ${
                  isSystem
                    ? 'bg-amber-950/20 border-amber-500/30 text-amber-200'
                    : isSelf
                    ? 'bg-cyan-950/30 border-cyan-500/30 text-slate-200'
                    : 'bg-slate-900/60 border-slate-800/80 text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] mb-1">
                  <span className="flex items-center gap-1.5 font-bold">
                    {m.guildTag && (
                      <span className="px-1 py-0.2 bg-cyan-500/20 text-cyan-300 rounded text-[9px]">
                        [{m.guildTag}]
                      </span>
                    )}
                    <span className={isSystem ? 'text-amber-400' : isSelf ? 'text-cyan-400' : 'text-slate-200'}>
                      {m.senderCallsign}
                    </span>
                  </span>
                  <span className="text-slate-500">
                    {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="break-words">{m.text}</div>
              </div>
            );
          })
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input Composer */}
      <form onSubmit={handleSend} className="p-2.5 bg-slate-900/80 border-t border-slate-800 flex gap-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Transmit to fleet comms..."
          maxLength={180}
          className="flex-1 px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono"
        />
        <button
          type="submit"
          className="px-3.5 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl text-xs font-mono transition-colors flex items-center justify-center cursor-pointer shadow-md"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};
