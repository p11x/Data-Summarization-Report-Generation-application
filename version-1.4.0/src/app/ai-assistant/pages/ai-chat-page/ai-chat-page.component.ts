import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

import { AiChatWindowComponent } from '../../components/ai-chat-window/ai-chat-window.component';
import { AiFileUploadComponent } from '../../components/ai-file-upload/ai-file-upload.component';
import { AiResultCardComponent } from '../../components/ai-result-card/ai-result-card.component';

import { AiChatService, ChatMessage } from '../../services/ai-chat.service';
import { DatasetParserService, ParsedDataset } from '../../services/dataset-parser.service';
import { AiAnalysisService, AnalysisResult } from '../../services/ai-analysis.service';

@Component({
  selector: 'app-ai-chat-page',
  standalone: true,
  imports: [CommonModule, FormsModule, AiChatWindowComponent, AiFileUploadComponent, AiResultCardComponent],
  templateUrl: './ai-chat-page.component.html',
  styleUrls: ['./ai-chat-page.component.css']
})
export class AiChatPageComponent implements OnInit, OnDestroy {
  messages: ChatMessage[] = [];
  dataset: ParsedDataset | null = null;
  results: AnalysisResult[] = [];
  isProcessing = false;
  showUploadSection = true;
  
  private destroy$ = new Subject<void>();

  promptSuggestions = [
    'Summarize this dataset',
    'Show top 10 values',
    'Generate a chart',
    'Find correlations',
    'Provide insights'
  ];

  constructor(
    private aiChatService: AiChatService,
    private datasetParser: DatasetParserService,
    private aiAnalysisService: AiAnalysisService,
    private router: Router
  ) {}

  ngOnInit() {
    // Subscribe to chat messages
    this.aiChatService.chatHistory$
      .pipe(takeUntil(this.destroy$))
      .subscribe(messages => this.messages = messages);

    // Subscribe to dataset
    this.datasetParser.currentDataset$
      .pipe(takeUntil(this.destroy$))
      .subscribe(dataset => {
        this.dataset = dataset;
        this.showUploadSection = !dataset;
      });

    // Subscribe to analysis results
    this.aiAnalysisService.results$
      .pipe(takeUntil(this.destroy$))
      .subscribe(results => this.results = results);

    // Subscribe to processing state
    this.aiAnalysisService.isProcessing$
      .pipe(takeUntil(this.destroy$))
      .subscribe(processing => this.isProcessing = processing);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  async onFileSelected(file: File) {
    try {
      const parsed = await this.datasetParser.parseFile(file);
      this.dataset = parsed;
      this.showUploadSection = false;
      
      // Send welcome message with dataset info
      this.aiChatService.addMessage(
        `File "${file.name}" uploaded successfully. ${parsed.metadata.rowCount} rows, ${parsed.metadata.columnNames.length} columns detected. How can I help you analyze this data?`,
        'assistant'
      );
    } catch (error) {
      console.error('Error parsing file:', error);
    }
  }

  async onSendMessage(message: string) {
    if (!message.trim() || !this.dataset) return;

    // Add user message
    this.aiChatService.addMessage(message, 'user');

    // Add loading message
    const loadingMsg = this.aiChatService.addLoadingMessage();

    try {
      // Get AI response
      const result = await this.aiAnalysisService.analyze(message, this.dataset);
      
      // Update loading message with response
      this.aiChatService.updateMessage(loadingMsg.id, result.content);
    } catch (error) {
      this.aiChatService.updateMessage(
        loadingMsg.id, 
        'Sorry, I encountered an error processing your request. Please try again.'
      );
    }
  }

  onSuggestionClick(suggestion: string) {
    this.onSendMessage(suggestion);
  }

  onResultClick(result: AnalysisResult) {
    // Scroll to result or show detail
    console.log('Result clicked:', result.id);
  }

  goToReport() {
    this.router.navigate(['/ai-report']);
  }

  clearDataset() {
    this.datasetParser.clearDataset();
    this.aiChatService.clearCurrentSession();
    this.showUploadSection = true;
  }

  goBack() {
    this.router.navigate(['/home']);
  }
}