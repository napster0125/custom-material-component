/**
 * @license
 * Copyright 2019 Google Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

import {MDCComponent} from '@material/base/component';
import {SpecificEventListener} from '@material/base/types';
import {MDCCheckbox, MDCCheckboxFactory} from '@material/checkbox/component';
import {closest} from '@material/dom/ponyfill';

import {MDCDataTableAdapter} from './adapter';
import {cssClasses, dataAttributes, events, selectors} from './constants';
import {MDCDataTableFoundation} from './foundation';
import {MDCDataTableRowSelectionChangedEventDetail} from './types';

/**
 * Implementation of `MDCDataTableFoundation`
 */
export class MDCDataTable extends MDCComponent<MDCDataTableFoundation> {
  static attachTo(root: Element): MDCDataTable {
    return new MDCDataTable(root);
  }

  private headerRowCheckbox!: MDCCheckbox;
  private rowCheckboxList!: MDCCheckbox[];
  private checkboxFactory!: MDCCheckboxFactory;
  private headerRow!: HTMLElement;
  private content!: HTMLElement;
  private handleHeaderRowCheckboxChange!: SpecificEventListener<'change'>;
  private handleRowCheckboxChange!: SpecificEventListener<'change'>;
  private headerRowClickListener!:
      SpecificEventListener<'click'>;  // Assigned in `initialSyncWithDOM()`

  initialize(checkboxFactory: MDCCheckboxFactory = (el: Element) => new MDCCheckbox(el)) {
    this.checkboxFactory = checkboxFactory;
  }

  initialSyncWithDOM() {
    this.headerRow =
        this.root.querySelector(`.${cssClasses.HEADER_ROW}`) as HTMLElement;
    this.handleHeaderRowCheckboxChange = () =>
        this.foundation.handleHeaderRowCheckboxChange();
    this.headerRow.addEventListener(
        'change', this.handleHeaderRowCheckboxChange);

    this.headerRowClickListener = (event) => {
      this.handleHeaderRowClick(event);
    };
    this.headerRow.addEventListener('click', this.headerRowClickListener);

    this.content =
        this.root.querySelector(`.${cssClasses.CONTENT}`) as HTMLElement;
    this.handleRowCheckboxChange = (event) =>
        this.foundation.handleRowCheckboxChange(event);
    this.content.addEventListener('change', this.handleRowCheckboxChange);

    this.layout();
  }

  /**
   * Re-initializes header row checkbox and row checkboxes when selectable rows are added or removed from table.
   */
  layout() {
    this.foundation.layout();
  }

  /**
   * @return Returns array of header row cell elements.
   */
  getHeaderCells(): Element[] {
    return [].slice.call(this.root.querySelectorAll(selectors.HEADER_CELL));
  }

  /**
   * @return Returns array of row elements.
   */
  getRows(): Element[] {
    return this.foundation.getRows();
  }

  /**
   * @return Returns array of selected row ids.
   */
  getSelectedRowIds(): Array<string|null> {
    return this.foundation.getSelectedRowIds();
  }

  /**
   * Sets selected row ids. Overwrites previously selected rows.
   * @param rowIds Array of row ids that needs to be selected.
   */
  setSelectedRowIds(rowIds: string[]) {
    this.foundation.setSelectedRowIds(rowIds);
  }

  destroy() {
    this.headerRow.removeEventListener(
        'change', this.handleHeaderRowCheckboxChange);
    this.headerRow.removeEventListener('click', this.headerRowClickListener);
    this.content.removeEventListener('change', this.handleRowCheckboxChange);

    this.headerRowCheckbox.destroy();
    this.rowCheckboxList.forEach((checkbox) => {
      checkbox.destroy();
    });
  }

  getDefaultFoundation() {
    // DO NOT INLINE this variable. For backward compatibility, foundations take a Partial<MDCFooAdapter>.
    // To ensure we don't accidentally omit any methods, we need a separate, strongly typed adapter variable.
    // tslint:disable:object-literal-sort-keys Methods should be in the same order as the adapter interface.
    const adapter: MDCDataTableAdapter = {
      addClass: (className) => {
        this.root.classList.add(className);
      },
      removeClass: (className) => {
        this.root.classList.remove(className);
      },
      getHeaderCellElements: () => this.getHeaderCells(),
      getHeaderCellCount: () => this.getHeaderCells().length,
      getAttributeByHeaderCellIndex: (index, attribute) => {
        return this.getHeaderCells()[index].getAttribute(attribute);
      },
      setAttributeByHeaderCellIndex: (index, attribute, value) => {
        this.getHeaderCells()[index].setAttribute(attribute, value);
      },
      setClassNameByHeaderCellIndex: (index, className) => {
        this.getHeaderCells()[index].classList.add(className);
      },
      removeClassNameByHeaderCellIndex: (index, className) => {
        this.getHeaderCells()[index].classList.remove(className);
      },
      notifySortAction: (data) => {
        this.emit(events.SORTED, data, /** shouldBubble */ true);
      },
      getTableBodyHeight: () => {
        const tableBody =
            this.root.querySelector<HTMLElement>(selectors.CONTENT);

        if (!tableBody) {
          throw new Error('MDCDataTable: Table body element not found.');
        }

        return `${tableBody.getBoundingClientRect().height}px`;
      },
      getTableHeaderHeight: () => {
        const tableHeader =
            this.root.querySelector<HTMLElement>(selectors.HEADER_ROW);

        if (!tableHeader) {
          throw new Error('MDCDataTable: Table header element not found.');
        }

        return `${tableHeader.getBoundingClientRect().height}px`;
      },
      setProgressIndicatorStyles: (styles) => {
        const progressIndicator =
            this.root.querySelector<HTMLElement>(selectors.PROGRESS_INDICATOR);

        if (!progressIndicator) {
          throw new Error(
              'MDCDataTable: Progress indicator element not found.');
        }

        Object.assign(progressIndicator.style, styles);
      },
      addClassAtRowIndex: (rowIndex: number, className: string) => {
        this.getRows()[rowIndex].classList.add(className);
      },
      getRowCount: () => this.getRows().length,
      getRowElements:
          () => [].slice.call(this.root.querySelectorAll(selectors.ROW)),
      getRowIdAtIndex: (rowIndex: number) =>
          this.getRows()[rowIndex].getAttribute(dataAttributes.ROW_ID),
      getRowIndexByChildElement: (el: Element) => {
        return this.getRows().indexOf(
            (closest(el, selectors.ROW) as HTMLElement));
      },
      getSelectedRowCount: () =>
          this.root.querySelectorAll(selectors.ROW_SELECTED).length,
      isCheckboxAtRowIndexChecked: (rowIndex: number) =>
          this.rowCheckboxList[rowIndex].checked,
      isHeaderRowCheckboxChecked: () => this.headerRowCheckbox.checked,
      isRowsSelectable: () => !!this.root.querySelector(selectors.ROW_CHECKBOX),
      notifyRowSelectionChanged:
          (data: MDCDataTableRowSelectionChangedEventDetail) => {
            this.emit(
                events.ROW_SELECTION_CHANGED, {
                  row: this.getRowByIndex(data.rowIndex),
                  rowId: this.getRowIdByIndex(data.rowIndex),
                  rowIndex: data.rowIndex,
                  selected: data.selected,
                },
                /** shouldBubble */ true);
          },
      notifySelectedAll: () => {
        this.emit(events.SELECTED_ALL, {}, /** shouldBubble */ true);
      },
      notifyUnselectedAll: () => {
        this.emit(events.UNSELECTED_ALL, {}, /** shouldBubble */ true);
      },
      registerHeaderRowCheckbox: () => {
        if (this.headerRowCheckbox) {
          this.headerRowCheckbox.destroy();
        }

        const checkboxEl =
            (this.root.querySelector(selectors.HEADER_ROW_CHECKBOX) as
             HTMLElement);
        this.headerRowCheckbox = this.checkboxFactory(checkboxEl);
      },
      registerRowCheckboxes: () => {
        if (this.rowCheckboxList) {
          this.rowCheckboxList.forEach((checkbox) => {
            checkbox.destroy();
          });
        }

        this.rowCheckboxList = [];
        this.getRows().forEach((rowEl) => {
          const checkbox = this.checkboxFactory(
              (rowEl.querySelector(selectors.ROW_CHECKBOX) as HTMLElement));
          this.rowCheckboxList.push(checkbox);
        });
      },
      removeClassAtRowIndex: (rowIndex: number, className: string) => {
        this.getRows()[rowIndex].classList.remove(className);
      },
      setAttributeAtRowIndex:
          (rowIndex: number, attr: string, value: string) => {
            this.getRows()[rowIndex].setAttribute(attr, value);
          },
      setHeaderRowCheckboxChecked: (checked: boolean) => {
        this.headerRowCheckbox.checked = checked;
      },
      setHeaderRowCheckboxIndeterminate: (indeterminate: boolean) => {
        this.headerRowCheckbox.indeterminate = indeterminate;
      },
      setRowCheckboxCheckedAtIndex: (rowIndex: number, checked: boolean) => {
        this.rowCheckboxList[rowIndex].checked = checked;
      },
    };
    return new MDCDataTableFoundation(adapter);
  }

  private getRowByIndex(index: number): Element {
    return this.getRows()[index];
  }

  private getRowIdByIndex(index: number): string|null {
    return this.getRowByIndex(index).getAttribute(dataAttributes.ROW_ID);
  }

  private handleHeaderRowClick(event: Event): void {
    const headerCell =
        closest(event.target as Element, selectors.HEADER_CELL_WITH_SORT) as
        HTMLElement;

    if (!headerCell) {
      return;
    }

    const columnId = headerCell.getAttribute(dataAttributes.COLUMN_ID);
    const columnIndex = this.getHeaderCells().indexOf(headerCell);
    if (columnIndex === -1) {
      return;
    }

    this.foundation.handleSortAction({columnId, columnIndex, headerCell});
  }
}
