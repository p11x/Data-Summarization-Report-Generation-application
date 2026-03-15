import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isLoading?: boolean;
}

export interface ChatSession {
  id: string;
  messages: ChatMessage[];
  createdAt: Date;
}

@Injectable({
  providedIn: 'root'
})
export class AiChatService {
  private sessions = new BehaviorSubject<ChatSession[]>([]);
  private currentSession = new BehaviorSubject<ChatSession | null>(null);
  private chatHistory = new BehaviorSubject<ChatMessage[]>([]);

  sessions$ = this.sessions.asObservable();
  currentSession$ = this.currentSession.asObservable();
  chatHistory$ = this.chatHistory.asObservable();

  constructor() {
    this.loadSessions();
  }

  private loadSessions() {
    const savedSessions = localStorage.getItem('ai-chat-sessions');
    if (savedSessions) {
      try {
        const sessions = JSON.parse(savedSessions);
        this.sessions.next(sessions);
      } catch (e) {
        console.error('Error loading chat sessions:', e);
      }
    }
  }

  private saveSessions() {
    localStorage.setItem('ai-chat-sessions', JSON.stringify(this.sessions.value));
  }

  createNewSession(): ChatSession {
    const session: ChatSession = {
      id: this.generateId(),
      messages: [],
      createdAt: new Date()
    };

    const currentSessions = this.sessions.value;
    this.sessions.next([session, ...currentSessions]);
    this.currentSession.next(session);
    this.chatHistory.next([]);
    this.saveSessions();

    return session;
  }

  selectSession(sessionId: string) {
    const session = this.sessions.value.find(s => s.id === sessionId);
    if (session) {
      this.currentSession.next(session);
      this.chatHistory.next(session.messages);
    }
  }

  addMessage(content: string, role: 'user' | 'assistant'): ChatMessage {
    const message: ChatMessage = {
      id: this.generateId(),
      role,
      content,
      timestamp: new Date()
    };

    const currentMessages = this.chatHistory.value;
    this.chatHistory.next([...currentMessages, message]);

    // Update current session
    const session = this.currentSession.value;
    if (session) {
      session.messages = [...session.messages, message];
      this.currentSession.next({ ...session });
      this.saveSessions();
    }

    return message;
  }

  addLoadingMessage(): ChatMessage {
    const message: ChatMessage = {
      id: this.generateId(),
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isLoading: true
    };

    const currentMessages = this.chatHistory.value;
    this.chatHistory.next([...currentMessages, message]);
    return message;
  }

  updateMessage(messageId: string, content: string) {
    const currentMessages = this.chatHistory.value;
    const updatedMessages = currentMessages.map(msg => {
      if (msg.id === messageId) {
        return { ...msg, content, isLoading: false };
      }
      return msg;
    });
    this.chatHistory.next(updatedMessages);

    // Update session
    const session = this.currentSession.value;
    if (session) {
      session.messages = updatedMessages;
      this.currentSession.next({ ...session });
      this.saveSessions();
    }
  }

  deleteSession(sessionId: string) {
    const currentSessions = this.sessions.value.filter(s => s.id !== sessionId);
    this.sessions.next(currentSessions);
    
    if (this.currentSession.value?.id === sessionId) {
      this.currentSession.next(null);
      this.chatHistory.next([]);
    }
    this.saveSessions();
  }

  clearCurrentSession() {
    this.chatHistory.next([]);
    this.currentSession.next(null);
  }

  getSessionHistory(): ChatMessage[] {
    return this.chatHistory.value;
  }

  private generateId(): string {
    return `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}