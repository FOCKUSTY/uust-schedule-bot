// src/telegram/utils/string-builder.ts

import { escapeHtml } from './escape-html';

export class StringBuilder {
  private parts: string[] = [];

  public append(text: string): this {
    this.parts.push(escapeHtml(text));
    return this;
  }

  public appendLine(text: string = ''): this {
    this.parts.push(escapeHtml(text) + '\n');
    return this;
  }

  public bold(text: string): this {
    this.parts.push(`<b>${escapeHtml(text)}</b>`);
    return this;
  }

  public italic(text: string): this {
    this.parts.push(`<i>${escapeHtml(text)}</i>`);
    return this;
  }

  public underline(text: string): this {
    this.parts.push(`<u>${escapeHtml(text)}</u>`);
    return this;
  }

  public strikethrough(text: string): this {
    this.parts.push(`<s>${escapeHtml(text)}</s>`);
    return this;
  }

  public code(text: string): this {
    this.parts.push(`<code>${escapeHtml(text)}</code>`);
    return this;
  }

  public pre(text: string): this {
    this.parts.push(`<pre>${escapeHtml(text)}</pre>`);
    return this;
  }

  public quote(text: string): this {
    this.parts.push(`<blockquote>${escapeHtml(text)}</blockquote>`);
    return this;
  }

  public spoiler(text: string): this {
    this.parts.push(`<tg-spoiler>${escapeHtml(text)}</tg-spoiler>`);
    return this;
  }

  public link(url: string, text?: string): this {
    const displayText = text ?? url;
    this.parts.push(`<a href="${url}">${escapeHtml(displayText)}</a>`);
    return this;
  }

  /**
   * Добавляет произвольную строку без экранирования.
   * Использовать осторожно, только с проверенным HTML.
   */
  public appendRaw(html: string): this {
    this.parts.push(html);
    return this;
  }

  /**
   * Добавляет произвольную строку с переводом строки без экранирования.
   */
  public appendRawLine(html: string = ''): this {
    this.parts.push(html + '\n');
    return this;
  }

  public newLine(): this {
    this.parts.push('\n');
    return this;
  }

  public toString(): string {
    return this.parts.join('');
  }

  public clear(): void {
    this.parts = [];
  }
}