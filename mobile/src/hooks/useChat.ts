import { useState, useEffect, useCallback, useRef } from "react";
import { api, Channel, Message } from "../lib/api";
import { chatWs } from "../lib/websocket";

type ReadReceipts = Map<string, Set<string>>;

export function useChat(userId: string) {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [activeChannelId, setActiveChannelId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [typingUsers, setTypingUsers] = useState<
    Map<string, ReturnType<typeof setTimeout>>
  >(new Map());
  const [readReceipts, setReadReceipts] = useState<ReadReceipts>(new Map());
  const [loadingChannels, setLoadingChannels] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [pinnedMessages, setPinnedMessages] = useState<Message[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastReadSentRef = useRef<string>("");
  const messagesRef = useRef<Message[]>([]);
  messagesRef.current = messages;

  const refreshChannels = useCallback(async () => {
    setLoadingChannels(true);
    try {
      const res = await api.listChannels();
      setChannels(
        res.items.sort((a, b) => b.last_message_at - a.last_message_at)
      );
    } catch (e) {
      console.error("Failed to load channels:", e);
    } finally {
      setLoadingChannels(false);
    }
  }, []);

  useEffect(() => {
    refreshChannels();
  }, [refreshChannels]);

  useEffect(() => {
    const ids = channels.map((ch) => ch.channel_id);
    if (ids.length > 0) chatWs.joinChannels(ids);
  }, [channels]);

  useEffect(() => {
    lastReadSentRef.current = "";
    if (!activeChannelId) {
      setMessages([]);
      setPinnedMessages([]);
      setReadReceipts(new Map());
      setReplyTo(null);
      return;
    }
    setLoadingMessages(true);
    api
      .listMessages(activeChannelId)
      .then((res) => {
        const msgs = res.items.reverse();
        setMessages(msgs);
        setPinnedMessages(msgs.filter((m) => m.pinned_at));
        const receipts = new Map<string, Set<string>>();
        const cursor = res.read_cursor || {};
        for (const [readerId, lastMsgId] of Object.entries(cursor)) {
          const idx = msgs.findIndex((m) => m.message_id === lastMsgId);
          if (idx >= 0) {
            for (let i = 0; i <= idx; i++) {
              const mid = msgs[i].message_id;
              if (!receipts.has(mid)) receipts.set(mid, new Set());
              receipts.get(mid)!.add(readerId);
            }
          }
        }
        setReadReceipts(receipts);
        setMessages((prev) =>
          prev.map((m) =>
            receipts.has(m.message_id)
              ? { ...m, status: "read" as const }
              : m
          )
        );
      })
      .catch((e) => console.error("Failed to load messages:", e))
      .finally(() => setLoadingMessages(false));
  }, [activeChannelId]);

  const filteredMessages = searchQuery
    ? messages.filter(
        (m) =>
          !m.deleted_at &&
          m.content.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : messages;

  useEffect(() => {
    const unsubs = [
      chatWs.on(
        "chat.message",
        (data: { message?: Message } & Record<string, unknown>) => {
          const msg = (data.message || data) as Message;
          if (msg.channel_id === activeChannelId) {
            setMessages((prev) => {
              if (
                prev.some(
                  (m) =>
                    m.message_id === msg.message_id ||
                    (msg.client_request_id &&
                      m.client_request_id === msg.client_request_id)
                )
              )
                return prev;
              return [...prev, { ...msg, status: "delivered" as const }];
            });
          }
          setChannels((prev) =>
            prev
              .map((ch) =>
                ch.channel_id === msg.channel_id
                  ? {
                      ...ch,
                      last_message_preview: msg.content?.slice(0, 100) || "",
                      last_message_at: msg.created_at_epoch,
                      last_message_by: msg.sender_id,
                    }
                  : ch
              )
              .sort((a, b) => b.last_message_at - a.last_message_at)
          );
          if (msg.channel_id !== activeChannelId && msg.sender_id !== userId) {
            setUnreadCounts((prev) => ({
              ...prev,
              [msg.channel_id]: (prev[msg.channel_id] || 0) + 1,
            }));
          }
        }
      ),

      chatWs.on(
        "chat.send.ack",
        (data: {
          client_request_id?: string;
          message_id?: string;
          created_at?: string;
        }) => {
          if (data.client_request_id) {
            setMessages((prev) =>
              prev.map((m) =>
                m.client_request_id === data.client_request_id
                  ? {
                      ...m,
                      message_id: data.message_id!,
                      created_at: data.created_at!,
                      status: "sent" as const,
                    }
                  : m
              )
            );
          }
        }
      ),

      chatWs.on(
        "chat.typing",
        (data: {
          user_id?: string;
          channel_id?: string;
          is_typing?: boolean;
        }) => {
          if (data.user_id === userId || data.channel_id !== activeChannelId)
            return;
          setTypingUsers((prev) => {
            const next = new Map(prev);
            if (data.is_typing) {
              const existing = next.get(data.user_id!);
              if (existing) clearTimeout(existing);
              next.set(
                data.user_id!,
                setTimeout(() => {
                  setTypingUsers((p) => {
                    const n = new Map(p);
                    n.delete(data.user_id!);
                    return n;
                  });
                }, 3000)
              );
            } else {
              const existing = next.get(data.user_id!);
              if (existing) clearTimeout(existing);
              next.delete(data.user_id!);
            }
            return next;
          });
        }
      ),

      chatWs.on(
        "chat.react",
        (data: {
          message_id?: string;
          user_id?: string;
          emoji?: string;
          remove?: boolean;
        }) => {
          setMessages((prev) =>
            prev.map((m) => {
              if (m.message_id !== data.message_id) return m;
              const reactions = { ...(m.reactions || {}) };
              const users = reactions[data.emoji!]
                ? [...reactions[data.emoji!]]
                : [];
              if (data.remove) {
                const idx = users.indexOf(data.user_id!);
                if (idx >= 0) users.splice(idx, 1);
              } else if (!users.includes(data.user_id!))
                users.push(data.user_id!);
              if (users.length > 0) reactions[data.emoji!] = users;
              else delete reactions[data.emoji!];
              return { ...m, reactions };
            })
          );
        }
      ),

      chatWs.on(
        "chat.read",
        (data: { user_id?: string; message_id?: string }) => {
          if (data.user_id === userId) return;
          const messageId = data.message_id!;
          setReadReceipts((prev) => {
            const next = new Map(prev);
            const msgs = messagesRef.current;
            const idx = msgs.findIndex((m) => m.message_id === messageId);
            if (idx >= 0) {
              for (let i = 0; i <= idx; i++) {
                const mid = msgs[i].message_id;
                const existing = next.get(mid);
                const readers = existing ? new Set(existing) : new Set<string>();
                readers.add(data.user_id!);
                next.set(mid, readers);
              }
            } else {
              const existing = next.get(messageId);
              const readers = existing ? new Set(existing) : new Set<string>();
              readers.add(data.user_id!);
              next.set(messageId, readers);
            }
            return next;
          });
          setMessages((prev) => {
            const idx = prev.findIndex((m) => m.message_id === messageId);
            if (idx < 0) return prev;
            return prev.map((m, i) =>
              m.sender_id === userId &&
              i <= idx &&
              m.status !== "read"
                ? { ...m, status: "read" as const }
                : m
            );
          });
        }
      ),

      chatWs.on(
        "chat.edit",
        (data: {
          channel_id?: string;
          message_id?: string;
          content?: string;
          edited_at?: string;
        }) => {
          if (data.channel_id !== activeChannelId) return;
          setMessages((prev) =>
            prev.map((m) =>
              m.message_id === data.message_id
                ? { ...m, content: data.content!, edited_at: data.edited_at }
                : m
            )
          );
        }
      ),

      chatWs.on(
        "chat.delete",
        (data: { channel_id?: string; message_id?: string }) => {
          if (data.channel_id !== activeChannelId) return;
          setMessages((prev) =>
            prev.map((m) =>
              m.message_id === data.message_id
                ? {
                    ...m,
                    content: "",
                    deleted_at: (data as Message).deleted_at,
                    deleted_by: (data as Message).deleted_by,
                    reactions: undefined,
                    mentions: undefined,
                    attachments: undefined,
                  }
                : m
            )
          );
          setPinnedMessages((prev) =>
            prev.filter((m) => m.message_id !== data.message_id)
          );
        }
      ),

      chatWs.on(
        "chat.pin",
        (data: {
          channel_id?: string;
          message_id?: string;
          unpin?: boolean;
          pinned_at?: string;
          pinned_by?: string;
        }) => {
          if (data.channel_id !== activeChannelId) return;
          if (data.unpin) {
            setMessages((prev) =>
              prev.map((m) =>
                m.message_id === data.message_id
                  ? { ...m, pinned_at: undefined, pinned_by: undefined }
                  : m
              )
            );
            setPinnedMessages((prev) =>
              prev.filter((m) => m.message_id !== data.message_id)
            );
          } else {
            setMessages((prev) => {
              const updated = prev.map((m) =>
                m.message_id === data.message_id
                  ? {
                      ...m,
                      pinned_at: data.pinned_at,
                      pinned_by: data.pinned_by,
                    }
                  : m
              );
              const msg = updated.find((m) => m.message_id === data.message_id);
              if (msg)
                setPinnedMessages((p) => [
                  ...p.filter((m) => m.message_id !== data.message_id),
                  { ...msg, pinned_at: data.pinned_at! },
                ]);
              return updated;
            });
          }
        }
      ),

      chatWs.on(
        "chat.system",
        (data: { channel_id?: string; notification?: { text?: string } }) => {
          if (data.channel_id !== activeChannelId) return;
          const systemMsg: Message = {
            message_id: `sys-${Date.now()}`,
            channel_id: data.channel_id!,
            sender_id: "system",
            sender_type: "system",
            content: data.notification?.text || "System event",
            content_type: "system",
            created_at: new Date().toISOString(),
            created_at_epoch: Math.floor(Date.now() / 1000),
          };
          setMessages((prev) => [...prev, systemMsg]);
        }
      ),
    ];
    return () => unsubs.forEach((fn) => fn());
  }, [activeChannelId, userId]);

  const sendMessage = useCallback(
    (content: string, mentions?: string[]) => {
      if (!activeChannelId || !content.trim()) return;
      const clientRequestId = `${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}`;
      const optimistic: Message = {
        message_id: clientRequestId,
        channel_id: activeChannelId,
        sender_id: userId,
        sender_type: "user",
        content: content.trim(),
        content_type: "text",
        created_at: new Date().toISOString(),
        created_at_epoch: Math.floor(Date.now() / 1000),
        client_request_id: clientRequestId,
        mentions,
        reply_to: replyTo?.message_id,
        status: "sending",
      };
      setMessages((prev) => [...prev, optimistic]);
      setReplyTo(null);
      chatWs.send({
        action: "chat.send",
        channel_id: activeChannelId,
        content: content.trim(),
        client_request_id: clientRequestId,
        mentions: mentions || [],
        reply_to: replyTo?.message_id,
      });
    },
    [activeChannelId, userId, replyTo]
  );

  const editMessage = useCallback(
    (messageId: string, content: string) => {
      if (!activeChannelId || !content.trim()) return;
      setMessages((prev) =>
        prev.map((m) =>
          m.message_id === messageId
            ? {
                ...m,
                content: content.trim(),
                edited_at: new Date().toISOString(),
              }
            : m
        )
      );
      chatWs.send({
        action: "chat.edit",
        channel_id: activeChannelId,
        message_id: messageId,
        content: content.trim(),
      });
    },
    [activeChannelId]
  );

  const deleteMessage = useCallback(
    (messageId: string) => {
      if (!activeChannelId) return;
      setMessages((prev) =>
        prev.map((m) =>
          m.message_id === messageId
            ? {
                ...m,
                content: "",
                deleted_at: new Date().toISOString(),
                deleted_by: userId,
              }
            : m
        )
      );
      chatWs.send({
        action: "chat.delete",
        channel_id: activeChannelId,
        message_id: messageId,
      });
    },
    [activeChannelId, userId]
  );

  const togglePin = useCallback(
    (messageId: string) => {
      if (!activeChannelId) return;
      const msg = messages.find((m) => m.message_id === messageId);
      const unpin = !!msg?.pinned_at;
      setMessages((prev) =>
        prev.map((m) =>
          m.message_id === messageId
            ? {
                ...m,
                pinned_at: unpin ? undefined : new Date().toISOString(),
                pinned_by: unpin ? undefined : userId,
              }
            : m
        )
      );
      setPinnedMessages((prev) => {
        if (unpin) return prev.filter((m) => m.message_id !== messageId);
        const m = messages.find((x) => x.message_id === messageId);
        if (m)
          return [
            ...prev.filter((x) => x.message_id !== messageId),
            { ...m, pinned_at: new Date().toISOString() },
          ];
        return prev;
      });
      chatWs.send({
        action: "chat.pin",
        channel_id: activeChannelId,
        message_id: messageId,
        unpin,
      });
    },
    [activeChannelId, messages]
  );

  const sendTyping = useCallback(
    (isTyping: boolean) => {
      if (!activeChannelId) return;
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      chatWs.send({
        action: "chat.typing",
        channel_id: activeChannelId,
        is_typing: isTyping,
      });
      if (isTyping) {
        typingTimerRef.current = setTimeout(() => {
          chatWs.send({
            action: "chat.typing",
            channel_id: activeChannelId,
            is_typing: false,
          });
        }, 2000);
      }
    },
    [activeChannelId]
  );

  const sendRead = useCallback(
    (messageId: string) => {
      if (!activeChannelId || messageId === lastReadSentRef.current) return;
      lastReadSentRef.current = messageId;
      chatWs.send({
        action: "chat.read",
        channel_id: activeChannelId,
        message_id: messageId,
      });
    },
    [activeChannelId]
  );

  const toggleReaction = useCallback(
    (messageId: string, emoji: string) => {
      if (!activeChannelId) return;
      const msg = messages.find((m) => m.message_id === messageId);
      const existing = msg?.reactions?.[emoji] || [];
      const remove = existing.includes(userId);
      setMessages((prev) =>
        prev.map((m) => {
          if (m.message_id !== messageId) return m;
          const reactions = { ...(m.reactions || {}) };
          const users = reactions[emoji] ? [...reactions[emoji]] : [];
          if (remove) {
            const idx = users.indexOf(userId);
            if (idx >= 0) users.splice(idx, 1);
          } else if (!users.includes(userId)) users.push(userId);
          if (users.length > 0) reactions[emoji] = users;
          else delete reactions[emoji];
          return { ...m, reactions };
        })
      );
      chatWs.send({
        action: "chat.react",
        channel_id: activeChannelId,
        message_id: messageId,
        emoji,
        remove,
      });
    },
    [activeChannelId, messages, userId]
  );

  const activeChannel =
    channels.find((ch) => ch.channel_id === activeChannelId) || null;
  const typingUserIds = Array.from(typingUsers.keys());

  const handleSetActiveChannel = useCallback((channelId: string | null) => {
    setActiveChannelId(channelId);
    if (channelId)
      setUnreadCounts((prev) => {
        const next = { ...prev };
        delete next[channelId];
        return next;
      });
  }, []);

  return {
    channels,
    activeChannel,
    activeChannelId,
    setActiveChannelId: handleSetActiveChannel,
    messages: filteredMessages,
    loadingChannels,
    loadingMessages,
    sendMessage,
    sendTyping,
    sendRead,
    toggleReaction,
    editMessage,
    deleteMessage,
    togglePin,
    replyTo,
    setReplyTo,
    pinnedMessages,
    searchQuery,
    setSearchQuery,
    typingUserIds,
    readReceipts,
    refreshChannels,
    unreadCounts,
  };
}
