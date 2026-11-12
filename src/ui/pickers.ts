import { FuzzySuggestModal, Modal, type App } from "obsidian";
import { BOOKS, type BookInfo } from "../core/books";

export class BookPickerModal extends FuzzySuggestModal<BookInfo> {
  constructor(app: App, private readonly onPick: (book: BookInfo) => void) {
    super(app);
    this.setPlaceholder("Search Bible books...");
  }
  getItems(): BookInfo[] { return BOOKS; }
  getItemText(book: BookInfo): string { return book.name; }
  onChooseItem(book: BookInfo): void { this.onPick(book); }
}
export class ChapterPickerModal extends Modal {
  constructor(app: App, private readonly book: BookInfo, private readonly count: number, private readonly onPick: (chapter: number) => void) {
    super(app);
  }
  onOpen(): void {
    this.contentEl.empty();
    this.contentEl.addClass("versedock", "vd-picker-modal");
    this.contentEl.createEl("h2", { text: this.book.name });
    const grid = this.contentEl.createDiv({ cls: "vd-chapter-grid" });
    for (let c = 1; c <= this.count; c++) {
      const btn = grid.createEl("button", { cls: "vd-chapter", text: String(c), attr: { type: "button", "aria-label": "Chapter " + c } });
      btn.addEventListener("click", () => { this.close(); this.onPick(c); });
    }
  }
  onClose(): void { this.contentEl.empty(); }
}
