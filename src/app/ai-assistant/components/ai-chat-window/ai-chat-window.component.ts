import { Component, Input, Output, EventEmitter, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatMessage } from '../../services/ai-chat.service';

@Component({
  selector: 'app-ai-chat-window',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ai-chat-window.component.html',
  styleUrls: ['./ai-chat-window.component.css']
})
export class AiChatWindowComponent implements AfterViewChecked {
  @Input() messages: ChatMessage[] = [];
  @Input() isProcessing = false;
  @Input() suggestions: string[] = [];
  @Output() messageSent = new EventEmitter<string>();
  @Output() suggestionClicked = new EventEmitter<string>();

  @ViewChild('messagesContainer') messagesContainer!: ElementRef;

  newMessage = '';

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  private scrollToBottom() {
    if (this.messagesContainer) {
      const element = this.messagesContainer.nativeElement;
      element.scrollTop = element.scrollHeight;
    }
  }

  sendMessage() {
    if (this.newMessage.trim()) {
      this.messageSent.emit(this.newMessage.trim());
      this.newMessage = '';
    }
  }

  onSuggestionClick(suggestion: string) {
    this.suggestionClicked.emit(suggestion);
  }

  onEnterPressed(event: Event) {
    const keyEvent = event as KeyboardEvent;
    if (keyEvent.key === 'Enter' && !keyEvent.shiftKey) {
      keyEvent.preventDefault();
      this.sendMessage();
    }
  }

  formatTime(date: Date): string {
    const d = new Date(date);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
}