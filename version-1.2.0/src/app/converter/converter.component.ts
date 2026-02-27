import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

interface ConversionOption {
  from: string;
  to: string;
  label: string;
}

@Component({
  selector: 'app-converter',
  templateUrl: './converter.component.html',
  styleUrls: ['./converter.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class ConverterComponent {
  // Available conversion options
  conversionOptions: ConversionOption[] = [
    { from: 'csv', to: 'json', label: 'CSV → JSON' },
    { from: 'json', to: 'csv', label: 'JSON → CSV' },
    { from: 'excel', to: 'csv', label: 'Excel → CSV' },
    { from: 'csv', to: 'excel', label: 'CSV → Excel' },
    { from: 'json', to: 'excel', label: 'JSON → Excel' },
    { from: 'excel', to: 'json', label: 'Excel → JSON' },
    { from: 'pdf', to: 'txt', label: 'PDF → Text' },
    { from: 'txt', to: 'pdf', label: 'Text → PDF' },
    { from: 'pdf', to: 'csv', label: 'PDF → CSV' },
    { from: 'text', to: 'csv', label: 'Text → CSV' },
  ];

  // File state
  selectedFile: File | null = null;
  selectedConversion: ConversionOption = this.conversionOptions[0];
  isConverting: boolean = false;
  isComplete: boolean = false;
  errorMessage: string = '';
  
  // Results
  convertedContent: any = null;
  convertedBlob: Blob | null = null;
  outputFilename: string = '';
  previewContent: string = '';
  previewLines: string[] = [];
  
  // Stats
  stats = {
    originalSize: 0,
    convertedSize: 0,
    recordCount: 0
  };

  // Supported input formats for file input
  acceptedFormats: string = '.csv,.json,.xlsx,.xls,.pdf,.txt';

  constructor(private router: Router) {}

  // Get formats for dropdown
  get fromFormats(): string[] {
    return ['csv', 'json', 'excel', 'pdf', 'txt', 'text'];
  }

  get toFormats(): string[] {
    const excluded = [this.selectedConversion.from];
    if (this.selectedConversion.from === 'text') excluded.push('text');
    return this.conversionOptions
      .filter(o => o.from === this.selectedConversion.from)
      .map(o => o.to);
  }

  // Update selected conversion when from format changes
  onFromFormatChange() {
    const option = this.conversionOptions.find(
      o => o.from === this.selectedConversion.from && o.to === this.toFormats[0]
    );
    if (option) {
      this.selectedConversion = option;
    }
    this.updateAcceptedFormats();
  }

  // Update accepted file formats
  updateAcceptedFormats() {
    const format = this.selectedConversion.from;
    switch (format) {
      case 'csv':
        this.acceptedFormats = '.csv';
        break;
      case 'json':
        this.acceptedFormats = '.json';
        break;
      case 'excel':
        this.acceptedFormats = '.xlsx,.xls';
        break;
      case 'pdf':
        this.acceptedFormats = '.pdf';
        break;
      case 'txt':
      case 'text':
        this.acceptedFormats = '.txt,.text';
        break;
      default:
        this.acceptedFormats = '*';
    }
  }

  // File selection
  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    // Reset state
    this.errorMessage = '';
    this.isComplete = false;
    this.convertedContent = null;
    this.convertedBlob = null;
    this.previewContent = '';
    this.previewLines = [];

    // Validate file format
    const fileName = file.name.toLowerCase();
    const fromFormat = this.selectedConversion.from;
    
    let isValid = false;
    if (fromFormat === 'csv' && fileName.endsWith('.csv')) isValid = true;
    else if (fromFormat === 'json' && fileName.endsWith('.json')) isValid = true;
    else if (fromFormat === 'excel' && (fileName.endsWith('.xlsx') || fileName.endsWith('.xls'))) isValid = true;
    else if (fromFormat === 'pdf' && fileName.endsWith('.pdf')) isValid = true;
    else if ((fromFormat === 'txt' || fromFormat === 'text') && fileName.endsWith('.txt')) isValid = true;

    if (!isValid) {
      this.errorMessage = `Please select a valid ${fromFormat.toUpperCase()} file`;
      return;
    }

    this.selectedFile = file;
    this.stats.originalSize = file.size;
  }

  // Perform conversion
  async convert() {
    if (!this.selectedFile) {
      this.errorMessage = 'Please select a file first';
      return;
    }

    this.isConverting = true;
    this.errorMessage = '';

    try {
      const content = await this.readFileContent(this.selectedFile);
      const contentStr = typeof content === 'string' ? content : new TextDecoder().decode(content as ArrayBuffer);
      
      switch (this.selectedConversion.from + '_' + this.selectedConversion.to) {
        case 'csv_json':
          this.convertCSVtoJSON(contentStr);
          break;
        case 'json_csv':
          this.convertJSONtoCSV(contentStr);
          break;
        case 'excel_csv':
          this.convertExcelToCSV(content);
          break;
        case 'csv_excel':
          this.convertCSVToExcel(contentStr);
          break;
        case 'json_excel':
          this.convertJSONToExcel(contentStr);
          break;
        case 'excel_json':
          await this.convertExcelToJSON(content);
          break;
        case 'pdf_txt':
          this.convertPDFToText(contentStr);
          break;
        case 'txt_pdf':
          await this.convertTextToPDF(contentStr);
          break;
        case 'pdf_csv':
          this.convertPDFToCSV(contentStr);
          break;
        case 'text_csv':
          this.convertTextToCSV(contentStr);
          break;
        default:
          throw new Error('Unsupported conversion');
      }

      this.isComplete = true;
    } catch (error: any) {
      this.errorMessage = 'Error converting file: ' + error.message;
      console.error(error);
    } finally {
      this.isConverting = false;
    }
  }

  // Read file content
  private readFileContent(file: File): Promise<string | ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result || '');
      reader.onerror = () => reject(reader.error);
      reader.readAsText(file);
    });
  }

  // CSV to JSON
  private convertCSVtoJSON(content: string) {
    const lines = content.trim().split('\n');
    if (lines.length === 0) throw new Error('Empty file');

    const headers = this.parseCSVLine(lines[0]);
    const data = [];

    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCSVLine(lines[i]);
      if (values.length === headers.length) {
        const row: any = {};
        headers.forEach((header, idx) => {
          row[header] = values[idx];
        });
        data.push(row);
      }
    }

    this.convertedContent = JSON.stringify(data, null, 2);
    this.outputFilename = this.selectedFile?.name.replace(/\.[^/.]+$/, '') + '.json';
    this.convertedBlob = new Blob([this.convertedContent], { type: 'application/json' });
    this.stats.convertedSize = this.convertedBlob.size;
    this.stats.recordCount = data.length;
    this.previewContent = this.convertedContent.substring(0, 2000);
    this.previewLines = this.previewContent.split('\n');
  }

  // JSON to CSV
  private convertJSONtoCSV(content: string) {
    const data = JSON.parse(content);
    if (!Array.isArray(data)) throw new Error('JSON must be an array');

    if (data.length === 0) throw new Error('Empty array');

    const headers = Object.keys(data[0]);
    const csvLines = [headers.join(',')];

    data.forEach((row: any) => {
      const values = headers.map(h => {
        const val = row[h];
        if (val === null || val === undefined) return '';
        const str = String(val);
        return str.includes(',') || str.includes('"') ? `"${str}"` : str;
      });
      csvLines.push(values.join(','));
    });

    this.convertedContent = csvLines.join('\n');
    this.outputFilename = this.selectedFile?.name.replace(/\.[^/.]+$/, '') + '.csv';
    this.convertedBlob = new Blob([this.convertedContent], { type: 'text/csv' });
    this.stats.convertedSize = this.convertedBlob.size;
    this.stats.recordCount = data.length;
    this.previewContent = this.convertedContent.substring(0, 2000);
    this.previewLines = this.previewContent.split('\n');
  }

  // Excel to CSV (simplified - reads first sheet)
  private convertExcelToCSV(content: string | ArrayBuffer) {
    const text = typeof content === 'string' ? content : new TextDecoder().decode(content);
    this.convertCSVtoJSON(text);
    this.outputFilename = this.selectedFile?.name.replace(/\.[^/.]+$/, '') + '.csv';
  }

  // CSV to Excel (output as CSV with .xlsx extension for simplicity)
  private convertCSVToExcel(content: string) {
    // For simplicity, output as CSV (full Excel would require xlsx library)
    this.convertCSVtoJSON(JSON.stringify(this.parseCSVToArray(content)));
    this.outputFilename = this.selectedFile?.name.replace(/\.[^/.]+$/, '') + '.xlsx';
    this.convertedBlob = new Blob([content], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    this.stats.convertedSize = this.convertedBlob.size;
  }

  // JSON to Excel
  private convertJSONToExcel(content: string) {
    // For simplicity, convert to CSV
    this.convertJSONtoCSV(content);
    this.outputFilename = this.selectedFile?.name.replace(/\.[^/.]+$/, '') + '.xlsx';
  }

  // Excel to JSON
  private async convertExcelToJSON(content: string | ArrayBuffer) {
    const text = typeof content === 'string' ? content : new TextDecoder().decode(content);
    this.convertCSVtoJSON(text);
  }

  // PDF to Text
  private convertPDFToText(content: string) {
    // For simplicity, extract text content
    // In production, use pdf.js
    const text = content.replace(/[^\x20-\x7E\n]/g, ' ');
    this.convertedContent = text;
    this.outputFilename = this.selectedFile?.name.replace(/\.[^/.]+$/, '') + '.txt';
    this.convertedBlob = new Blob([text], { type: 'text/plain' });
    this.stats.convertedSize = this.convertedBlob.size;
    this.stats.recordCount = text.split('\n').length;
    this.previewContent = text.substring(0, 2000);
    this.previewLines = this.previewContent.split('\n');
  }

  // Text to PDF (simplified - outputs as text file)
  private async convertTextToPDF(content: string) {
    this.convertedContent = content;
    this.outputFilename = this.selectedFile?.name.replace(/\.[^/.]+$/, '') + '.pdf';
    this.convertedBlob = new Blob([content], { type: 'application/pdf' });
    this.stats.convertedSize = this.convertedBlob.size;
    this.stats.recordCount = content.split('\n').length;
    this.previewContent = content.substring(0, 2000);
    this.previewLines = this.previewContent.split('\n');
  }

  // PDF to CSV
  private convertPDFToCSV(content: string) {
    this.convertPDFToText(content);
    this.outputFilename = this.selectedFile?.name.replace(/\.[^/.]+$/, '') + '.csv';
    // Try to parse as CSV
    try {
      const data = this.parseCSVToArray(content);
      const csv = this.arrayToCSV(data);
      this.convertedContent = csv;
      this.convertedBlob = new Blob([csv], { type: 'text/csv' });
      this.stats.convertedSize = this.convertedBlob.size;
      this.stats.recordCount = data.length;
      this.previewContent = csv.substring(0, 2000);
      this.previewLines = this.previewContent.split('\n');
    } catch {
      // Keep as text if parsing fails
    }
  }

  // Text to CSV
  private convertTextToCSV(content: string) {
    // Assume tab or comma separated
    const lines = content.trim().split('\n');
    const data = lines.map(line => {
      if (line.includes('\t')) return line.split('\t');
      if (line.includes(',')) return this.parseCSVLine(line);
      return [line];
    });
    
    // If single column, create CSV with line numbers
    if (data[0].length === 1) {
      const csv = 'id,text\n' + data.map((row, i) => `${i + 1},"${row[0]}"`).join('\n');
      this.convertedContent = csv;
    } else {
      this.convertedContent = this.arrayToCSV(data);
    }
    
    this.outputFilename = this.selectedFile?.name.replace(/\.[^/.]+$/, '') + '.csv';
    this.convertedBlob = new Blob([this.convertedContent], { type: 'text/csv' });
    this.stats.convertedSize = this.convertedBlob.size;
    this.stats.recordCount = data.length;
    this.previewContent = this.convertedContent.substring(0, 2000);
    this.previewLines = this.previewContent.split('\n');
  }

  // Helper: Parse CSV line
  private parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  }

  // Helper: Parse CSV to array
  private parseCSVToArray(content: string): any[] {
    const lines = content.trim().split('\n');
    if (lines.length === 0) return [];
    
    const headers = this.parseCSVLine(lines[0]);
    const data = [];

    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCSVLine(lines[i]);
      if (values.length > 0) {
        const row: any = {};
        headers.forEach((header, idx) => {
          row[header] = values[idx] || '';
        });
        data.push(row);
      }
    }
    return data;
  }

  // Helper: Array to CSV
  private arrayToCSV(data: any[]): string {
    if (data.length === 0) return '';
    const headers = Object.keys(data[0]);
    const lines = [headers.join(',')];
    
    data.forEach(row => {
      const values = headers.map(h => {
        const val = row[h];
        if (val === null || val === undefined) return '';
        const str = String(val);
        return str.includes(',') || str.includes('"') ? `"${str}"` : str;
      });
      lines.push(values.join(','));
    });
    
    return lines.join('\n');
  }

  // Download converted file
  download() {
    if (!this.convertedBlob) return;
    
    const url = window.URL.createObjectURL(this.convertedBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = this.outputFilename;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  // Reset
  reset() {
    this.selectedFile = null;
    this.isComplete = false;
    this.convertedContent = null;
    this.convertedBlob = null;
    this.previewContent = '';
    this.previewLines = [];
    this.errorMessage = '';
    this.stats = { originalSize: 0, convertedSize: 0, recordCount: 0 };
  }

  // Format file size
  formatSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Navigation
  goBack() {
    this.router.navigate(['/home']);
  }
}
