import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft, Heart, Phone, Send, User, Video } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { api } from "../utils/api";
import { auth } from "../utils/auth";

function Chat() {
  const navigate = useNavigate();
  const { emergencyId } = useParams();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [emergency, setEmergency] = useState(null);
  const [loadError, setLoadError] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    const loadCurrentUser = async () => {
      const { data, error } = await auth.getUser();
      if (cancelled) return;
      if (error) {
        setLoadError(error.message || "Unable to verify your account.");
        return;
      }
      setCurrentUser(data?.user || null);
    };

    const refresh = async () => {
      if (!emergencyId) {
        setLoadError("This chat is missing its emergency ID.");
        return;
      }

      const [emergencyResult, messageResult] = await Promise.all([
        api.getEmergencyById(emergencyId),
        api.getMessages(emergencyId)
      ]);
      if (cancelled) return;

      if (emergencyResult.error || !emergencyResult.emergency) {
        setLoadError(emergencyResult.error || "Emergency details are unavailable.");
        return;
      }
      if (messageResult.error) {
        setLoadError(messageResult.error);
        return;
      }

      const sortedMessages = [...(messageResult.messages || [])].sort(
        (a, b) => new Date(a.timestamp || 0).getTime() - new Date(b.timestamp || 0).getTime()
      );
      setEmergency(emergencyResult.emergency);
      setMessages(sortedMessages);
      setLoadError("");
    };

    loadCurrentUser();
    refresh();
    const interval = setInterval(refresh, 3000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [emergencyId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (event) => {
    event.preventDefault();
    const message = newMessage.trim();
    if (!message) return;
    if (!currentUser) {
      toast.error("Sign in before sending a message.");
      return;
    }

    setLoading(true);
    const result = await api.sendMessage({ emergencyId, message, type: "text" });
    if (result.error) {
      toast.error(`Failed to send message: ${result.error}`);
    } else {
      setNewMessage("");
      setMessages((current) => [...current, result.message].filter(Boolean));
      toast.success("Message sent");
    }
    setLoading(false);
  };

  const handleCall = () => {
    if (!emergency?.patientPhone || currentUser?.user_metadata?.role === "patient") {
      toast.error("A responder phone number is not available for this call.");
      return;
    }
    window.location.href = `tel:${emergency.patientPhone}`;
  };

  const canCallPatient = Boolean(
    emergency?.patientPhone && currentUser?.user_metadata?.role !== "patient"
  );
  const formatTime = (timestamp) => new Date(timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit"
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-red-50">
      <header className="sticky top-0 z-10 border-b border-pink-100 bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" aria-label="Go back" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-pink-500 to-red-500">
              <Heart className="h-5 w-5 fill-white text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Emergency Chat</h1>
              <p className="text-xs text-gray-600">ID: {emergencyId?.substring(0, 12) || "Unavailable"}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="Call patient"
              title={canCallPatient ? "Call patient" : "Patient calling is not available from this chat"}
              disabled={!canCallPatient}
              onClick={handleCall}
            >
              <Phone className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="Video calling unavailable"
              title="Video calling is not available yet"
              disabled
            >
              <Video className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-4xl px-6 py-8">
        <Card className="h-[calc(100vh-12rem)] border-pink-100 bg-white/80 shadow-xl backdrop-blur-sm">
          <CardContent className="flex h-full flex-col p-0">
            <div className="flex-1 space-y-4 overflow-y-auto p-6">
              {loadError && <p className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">{loadError}</p>}
              {messages.length === 0 ? (
                <div className="py-12 text-center" role="status">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-pink-100">
                    <Heart className="h-8 w-8 text-pink-600" />
                  </div>
                  <p className="text-gray-600">No messages yet</p>
                  <p className="text-sm text-gray-500">Start the conversation to coordinate emergency response</p>
                </div>
              ) : messages.map((message) => {
                const isCurrentUser = message.senderId === currentUser?.id;
                return (
                  <div key={message.messageId} className={`flex ${isCurrentUser ? "justify-end" : "justify-start"}`}>
                    <div className="max-w-[70%]">
                      <div className={`mb-1 flex items-center gap-2 text-xs ${isCurrentUser ? "justify-end" : "justify-start"}`}>
                        {!isCurrentUser && <User className="h-4 w-4 text-gray-500" />}
                        <span className="font-semibold">{message.senderName}</span>
                        <time className="text-gray-500">{formatTime(message.timestamp)}</time>
                      </div>
                      <div className={`rounded-2xl px-4 py-2 ${isCurrentUser ? "bg-gradient-to-r from-pink-500 to-red-500 text-white" : "bg-gray-100 text-gray-900"}`}>
                        <p className="break-words text-sm">{message.message}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <div className="border-t border-pink-100 p-4">
              <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                <Input
                  aria-label="Type a message"
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(event) => setNewMessage(event.target.value)}
                  className="flex-1"
                  disabled={loading}
                />
                <Button
                  type="submit"
                  disabled={loading || !newMessage.trim()}
                  className="flex-shrink-0 bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600"
                >
                  <Send className="h-4 w-4" />
                  <span className="sr-only">Send message</span>
                </Button>
              </form>
              <div className="mt-3 grid grid-cols-3 gap-3">
                {["On my way", "Arrived at location", "Need assistance"].map((text) => (
                  <Button key={text} type="button" variant="outline" size="sm" onClick={() => setNewMessage(text)}>
                    {text}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

export { Chat };
