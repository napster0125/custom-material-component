/**
 * @license
 * Copyright 2020 Google Inc.
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

import {checkNumTimesSpyCalledWithArgs, createMockAdapter, verifyDefaultAdapter} from '../../../testing/helpers/foundation';
import {cssClasses, numbers, strings} from '../constants';
import {MDCSelectFoundation} from '../foundation';

const LABEL_WIDTH = 100;

describe('MDCSelectFoundation', () => {
  it('exports cssClasses', () => {
    expect(MDCSelectFoundation.cssClasses).toEqual(cssClasses);
  });

  it('exports numbers', () => {
    expect(MDCSelectFoundation.numbers).toEqual(numbers);
  });

  it('exports strings', () => {
    expect(MDCSelectFoundation.strings).toEqual(strings);
  });

  it('default adapter returns a complete adapter implementation', () => {
    verifyDefaultAdapter(MDCSelectFoundation, [
      'addClass',
      'removeClass',
      'hasClass',
      'activateBottomLine',
      'deactivateBottomLine',
      'getSelectedMenuItem',
      'hasLabel',
      'floatLabel',
      'getLabelWidth',
      'hasOutline',
      'notchOutline',
      'closeOutline',
      'setRippleCenter',
      'notifyChange',
      'setSelectedText',
      'isSelectedTextFocused',
      'getSelectedTextAttr',
      'setSelectedTextAttr',
      'openMenu',
      'closeMenu',
      'getAnchorElement',
      'setMenuAnchorElement',
      'setMenuAnchorCorner',
      'setMenuWrapFocus',
      'setAttributeAtIndex',
      'removeAttributeAtIndex',
      'focusMenuItemAtIndex',
      'getMenuItemCount',
      'getMenuItemValues',
      'getMenuItemTextAtIndex',
      'getMenuItemAttr',
      'addClassAtIndex',
      'removeClassAtIndex',
    ]);
  });

  function setupTest(hasLeadingIcon = true, hasHelperText = false) {
    const mockAdapter = createMockAdapter(MDCSelectFoundation);
    const leadingIcon = jasmine.createSpyObj('leadingIcon', [
      'setDisabled', 'setAriaLabel', 'setContent', 'registerInteractionHandler',
      'deregisterInteractionHandler', 'handleInteraction'
    ]);
    const helperText = jasmine.createSpyObj('helperText', [
      'setContent',
      'setPersistent',
      'setValidation',
      'showToScreenReader',
      'setValidity',
    ]);
    const listItem = jasmine.createSpy('listItem');
    const foundationMap = {
      leadingIcon: hasLeadingIcon ? leadingIcon : undefined,
      helperText: hasHelperText ? helperText : undefined,
    };

    mockAdapter.getSelectedMenuItem.and.returnValue(listItem);
    mockAdapter.hasLabel.and.returnValue(true);

    const foundation = new MDCSelectFoundation(mockAdapter, foundationMap);
    return {foundation, mockAdapter, leadingIcon, helperText};
  }

  it('#getDisabled() returns true if disabled', () => {
    const {foundation} = setupTest();
    foundation.setDisabled(true);
    expect(foundation.getDisabled()).toEqual(true);
  });

  it('#getDisabled() returns false if not disabled', () => {
    const {foundation} = setupTest();
    foundation.setDisabled(false);
    expect(foundation.getDisabled()).toEqual(false);
  });

  it('#setDisabled(true) calls adapter.addClass', () => {
    const {mockAdapter, foundation} = setupTest();
    foundation.setDisabled(true);
    expect(mockAdapter.addClass).toHaveBeenCalledWith(cssClasses.DISABLED);
  });

  it('#setDisabled(false) calls adapter.removeClass', () => {
    const {mockAdapter, foundation} = setupTest();
    foundation.setDisabled(false);
    expect(mockAdapter.removeClass).toHaveBeenCalledWith(cssClasses.DISABLED);
  });

  it('#setDisabled sets disabled on leading icon', () => {
    const {foundation, leadingIcon} = setupTest();
    foundation.setDisabled(true);
    expect(leadingIcon.setDisabled).toHaveBeenCalledWith(true);
  });

  it('#notchOutline updates the width of the outline element', () => {
    const {foundation, mockAdapter} = setupTest();
    mockAdapter.hasOutline.and.returnValue(true);
    mockAdapter.getLabelWidth.and.returnValue(LABEL_WIDTH);

    foundation.notchOutline(true);
    expect(mockAdapter.notchOutline)
        .toHaveBeenCalledWith(LABEL_WIDTH * numbers.LABEL_SCALE);
  });

  it('#notchOutline does nothing if no outline is present', () => {
    const {foundation, mockAdapter} = setupTest();
    mockAdapter.hasOutline.and.returnValue(false);
    mockAdapter.getLabelWidth.and.returnValue(LABEL_WIDTH);

    foundation.notchOutline(true);
    expect(mockAdapter.notchOutline)
        .not.toHaveBeenCalledWith(jasmine.anything());
  });

  it('#notchOutline width is set to 0 if no label is present', () => {
    const {foundation, mockAdapter} = setupTest();
    mockAdapter.hasOutline.and.returnValue(true);
    mockAdapter.getLabelWidth.and.returnValue(0);

    foundation.notchOutline(true);
    expect(mockAdapter.notchOutline).toHaveBeenCalledWith(0);
    expect(mockAdapter.notchOutline).toHaveBeenCalledTimes(1);
  });

  it('#notchOutline(false) closes the outline', () => {
    const {foundation, mockAdapter} = setupTest();
    mockAdapter.hasOutline.and.returnValue(true);
    mockAdapter.getLabelWidth.and.returnValue(LABEL_WIDTH);

    foundation.notchOutline(false);
    expect(mockAdapter.closeOutline).toHaveBeenCalled();
  });

  it('#notchOutline does not close the notch if the select is still focused',
     () => {
       const {foundation, mockAdapter} = setupTest();
       mockAdapter.hasOutline.and.returnValue(true);
       mockAdapter.hasClass.withArgs(cssClasses.FOCUSED).and.returnValue(true);
       mockAdapter.getLabelWidth.and.returnValue(LABEL_WIDTH);

       foundation.notchOutline(false);
       expect(mockAdapter.closeOutline).not.toHaveBeenCalled();
     });

  it(`#handleMenuOpened adds ${cssClasses.ACTIVATED} class name`, () => {
    const {foundation, mockAdapter} = setupTest();
    mockAdapter.getMenuItemValues.and.returnValue(['foo', 'bar']);
    foundation.handleMenuOpened();
    expect(mockAdapter.addClass).toHaveBeenCalledWith(cssClasses.ACTIVATED);
    expect(mockAdapter.addClass).toHaveBeenCalledTimes(1);
  });

  it('#handleMenuOpened focuses last selected element', () => {
    const {foundation, mockAdapter} = setupTest();
    mockAdapter.getMenuItemValues.and.returnValue(['foo', 'bar']);
    (foundation as any).selectedIndex_ = 2;
    foundation.handleMenuOpened();
    expect(mockAdapter.focusMenuItemAtIndex).toHaveBeenCalledWith(2);
    expect(mockAdapter.focusMenuItemAtIndex).toHaveBeenCalledTimes(1);
  });

  it(`#handleMenuClosed removes ${cssClasses.ACTIVATED} class name`, () => {
    const {foundation, mockAdapter} = setupTest();
    foundation.handleMenuClosed();
    checkNumTimesSpyCalledWithArgs(
        mockAdapter.removeClass, [cssClasses.ACTIVATED], 1);
  });

  it('#handleMenuClosed sets isMenuOpen_ to false', () => {
    const {foundation} = setupTest();
    foundation.handleMenuClosed();
    expect((foundation as any).isMenuOpen_).toBe(false);
  });

  it('#handleMenuClosed set aria-expanded attribute to false', () => {
    const {foundation, mockAdapter} = setupTest();
    foundation.handleMenuClosed();
    expect(mockAdapter.setSelectedTextAttr)
        .toHaveBeenCalledWith('aria-expanded', 'false');
  });

  it('#handleChange calls adapter.floatLabel(true) when there is a value',
     () => {
       const {foundation, mockAdapter} = setupTest();
       mockAdapter.getMenuItemAttr
           .withArgs(jasmine.anything(), strings.VALUE_ATTR)
           .and.returnValue('value');

       foundation.handleChange();
       expect(mockAdapter.floatLabel).toHaveBeenCalledWith(true);
       expect(mockAdapter.floatLabel).toHaveBeenCalledTimes(1);
     });

  it('#handleChange calls adapter.floatLabel(false) when there is no value and the select is not focused',
     () => {
       const {foundation, mockAdapter} = setupTest();
       mockAdapter.getMenuItemAttr
           .withArgs(jasmine.anything(), strings.VALUE_ATTR)
           .and.returnValue('');

       foundation.handleChange();
       expect(mockAdapter.floatLabel).toHaveBeenCalledWith(false);
       expect(mockAdapter.floatLabel).toHaveBeenCalledTimes(1);
     });

  it('#handleChange does not call adapter.floatLabel(false) when there is no value if the select is focused',
     () => {
       const {foundation, mockAdapter} = setupTest();
       mockAdapter.getMenuItemAttr
           .withArgs(jasmine.anything(), strings.VALUE_ATTR)
           .and.returnValue('');
       mockAdapter.hasClass.withArgs(cssClasses.FOCUSED).and.returnValue(true);

       foundation.handleChange();
       expect(mockAdapter.floatLabel).not.toHaveBeenCalledWith(false);
     });

  it('#handleChange does not call adapter.floatLabel() when no label is present',
     () => {
       const {foundation, mockAdapter} = setupTest();
       mockAdapter.hasLabel.and.returnValue(false);

       foundation.handleChange();
       expect(mockAdapter.floatLabel)
           .not.toHaveBeenCalledWith(jasmine.anything());
     });

  it('#handleChange calls foundation.notchOutline(true) when there is a value',
     () => {
       const {foundation, mockAdapter} = setupTest();
       foundation.notchOutline = jasmine.createSpy('');
       mockAdapter.getMenuItemAttr
           .withArgs(jasmine.anything(), strings.VALUE_ATTR)
           .and.returnValue('value');

       foundation.handleChange();
       expect(foundation.notchOutline).toHaveBeenCalledWith(true);
       expect(foundation.notchOutline).toHaveBeenCalledTimes(1);
     });

  it('#handleChange calls foundation.notchOutline(false) when there is no value',
     () => {
       const {foundation, mockAdapter} = setupTest();
       foundation.notchOutline = jasmine.createSpy('');
       mockAdapter.getMenuItemAttr
           .withArgs(jasmine.anything(), strings.VALUE_ATTR)
           .and.returnValue('');

       foundation.handleChange();
       expect(foundation.notchOutline).toHaveBeenCalledWith(false);
       expect(foundation.notchOutline).toHaveBeenCalledTimes(1);
     });

  it('#handleChange does not call foundation.notchOutline() when there is no label',
     () => {
       const {foundation, mockAdapter} = setupTest();
       foundation.notchOutline = jasmine.createSpy('');
       mockAdapter.hasLabel.and.returnValue(false);

       foundation.handleChange();
       expect(foundation.notchOutline)
           .not.toHaveBeenCalledWith(jasmine.anything());
     });

  it('#handleChange calls adapter.notifyChange() if didChange is true', () => {
    const {foundation, mockAdapter} = setupTest();
    mockAdapter.getMenuItemAttr.withArgs(jasmine.anything(), strings.VALUE_ATTR)
        .and.returnValue('value');

    foundation.handleChange();
    expect(mockAdapter.notifyChange).toHaveBeenCalledWith(jasmine.anything());
    expect(mockAdapter.notifyChange).toHaveBeenCalledTimes(1);
  });

  it('#handleFocus calls adapter.floatLabel(true)', () => {
    const {foundation, mockAdapter} = setupTest();

    foundation.handleFocus();
    expect(mockAdapter.floatLabel).toHaveBeenCalledWith(true);
    expect(mockAdapter.floatLabel).toHaveBeenCalledTimes(1);
  });

  it('#handleFocus does not call adapter.floatLabel() if no label is present',
     () => {
       const {foundation, mockAdapter} = setupTest();
       mockAdapter.hasLabel.and.returnValue(false);

       foundation.handleFocus();
       expect(mockAdapter.floatLabel)
           .not.toHaveBeenCalledWith(jasmine.anything());
     });

  it('#handleFocus calls foundation.notchOutline(true)', () => {
    const {foundation} = setupTest();
    foundation.notchOutline = jasmine.createSpy('');
    foundation.handleFocus();
    expect(foundation.notchOutline).toHaveBeenCalledWith(true);
    expect(foundation.notchOutline).toHaveBeenCalledTimes(1);
  });

  it('#handleFocus does not call foundation.notchOutline() if no label is present',
     () => {
       const {foundation, mockAdapter} = setupTest();
       foundation.notchOutline = jasmine.createSpy('');
       mockAdapter.hasLabel.and.returnValue(false);

       foundation.handleFocus();
       expect(foundation.notchOutline)
           .not.toHaveBeenCalledWith(jasmine.anything());
     });

  it('#handleFocus calls adapter.activateBottomLine()', () => {
    const {foundation, mockAdapter} = setupTest();
    foundation.handleFocus();
    expect(mockAdapter.activateBottomLine).toHaveBeenCalledTimes(1);
  });

  it('#handleFocus calls helperText.showToScreenReader', () => {
    const hasIcon = true;
    const hasHelperText = true;
    const {foundation, helperText} = setupTest(hasIcon, hasHelperText);
    foundation.handleFocus();
    expect(helperText.showToScreenReader).toHaveBeenCalledTimes(1);
  });

  it('#handleFocus calls adapter.activateBottomLine() if isMenuOpen_=true',
     () => {
       const {foundation, mockAdapter} = setupTest();
       (foundation as any).isMenuOpen_ = true;
       foundation.handleFocus();
       expect(mockAdapter.activateBottomLine).toHaveBeenCalledTimes(1);
     });

  it('#handleBlur calls foundation.updateLabel_()', () => {
    const {foundation} = setupTest();
    (foundation as any).updateLabel_ = jasmine.createSpy('');
    foundation.handleBlur();
    expect((foundation as any).updateLabel_).toHaveBeenCalledTimes(1);
  });

  it('#handleBlur calls adapter.deactivateBottomLine()', () => {
    const {foundation, mockAdapter} = setupTest();
    foundation.handleBlur();
    expect(mockAdapter.deactivateBottomLine).toHaveBeenCalledTimes(1);
  });

  it('#handleBlur does not call deactivateBottomLine if isMenuOpen_=true',
     () => {
       const {foundation, mockAdapter} = setupTest();
       (foundation as any).isMenuOpen_ = true;
       foundation.handleBlur();
       expect(mockAdapter.deactivateBottomLine).not.toHaveBeenCalled();
     });

  it('#handleBlur calls helperText.setValidity(true) if menu is not open',
     () => {
       const hasIcon = true;
       const hasHelperText = true;
       const {foundation, mockAdapter, helperText} =
           setupTest(hasIcon, hasHelperText);
       mockAdapter.hasClass.withArgs(cssClasses.REQUIRED).and.returnValue(true);
       mockAdapter.getMenuItemAttr
           .withArgs(jasmine.anything(), strings.VALUE_ATTR)
           .and.returnValue('foo');
       (foundation as any).selectedIndex_ = 0;
       foundation.handleBlur();
       expect(helperText.setValidity).toHaveBeenCalledWith(true);
       expect(helperText.setValidity).toHaveBeenCalledTimes(1);
     });

  it('#handleClick does nothing if isMenuOpen_=true', () => {
    const {foundation, mockAdapter} = setupTest();
    (foundation as any).isMenuOpen_ = true;
    foundation.handleClick(0);
    expect(mockAdapter.setRippleCenter).not.toHaveBeenCalledWith(0);
  });

  it('#handleClick sets the ripple center if isMenuOpen_=false', () => {
    const {foundation, mockAdapter} = setupTest();
    (foundation as any).isMenuOpen_ = false;
    foundation.handleClick(0);
    expect(mockAdapter.setRippleCenter).toHaveBeenCalledWith(0);
    expect(mockAdapter.setRippleCenter).toHaveBeenCalledTimes(1);
  });

  it('#handleClick opens the menu if the select is focused and isMenuOpen_=false',
     () => {
       const {foundation, mockAdapter} = setupTest();
       mockAdapter.hasClass.withArgs(cssClasses.FOCUSED).and.returnValue(true);
       (foundation as any).isMenuOpen_ = false;
       foundation.handleClick(0);
       expect(mockAdapter.openMenu).toHaveBeenCalledTimes(1);
     });

  it('#handleClick sets the aria-expanded', () => {
    const {foundation, mockAdapter} = setupTest();
    foundation.handleClick(0);
    expect(mockAdapter.setSelectedTextAttr)
        .toHaveBeenCalledWith('aria-expanded', 'true');
  });

  it('#handleKeydown calls adapter.openMenu if valid keys are pressed, menu is not open and select is focused',
     () => {
       const {foundation, mockAdapter} = setupTest();
       const preventDefault = jasmine.createSpy('');
       const event = {key: 'Enter', preventDefault} as any;
       mockAdapter.hasClass.withArgs('mdc-select--focused')
           .and.returnValue(true);
       foundation.handleKeydown(event);
       event.key = 'Space';
       (foundation as any).isMenuOpen_ = false;
       foundation.handleKeydown(event);
       event.key = 'ArrowUp';
       (foundation as any).isMenuOpen_ = false;
       foundation.handleKeydown(event);
       event.key = 'ArrowDown';
       (foundation as any).isMenuOpen_ = false;
       foundation.handleKeydown(event);
       event.key = '';
       event.keyCode = 13;  // Enter
       (foundation as any).isMenuOpen_ = false;
       foundation.handleKeydown(event);
       event.keyCode = 32;  // Space
       (foundation as any).isMenuOpen_ = false;
       foundation.handleKeydown(event);
       event.keyCode = 38;  // Up
       (foundation as any).isMenuOpen_ = false;
       foundation.handleKeydown(event);
       event.keyCode = 40;  // Down
       (foundation as any).isMenuOpen_ = false;
       foundation.handleKeydown(event);
       expect(mockAdapter.openMenu).toHaveBeenCalledTimes(8);
       checkNumTimesSpyCalledWithArgs(
           mockAdapter.setSelectedTextAttr, ['aria-expanded', 'true'], 8);
       expect(preventDefault).toHaveBeenCalledTimes(8);
     });

  it('#handleKeydown does not call adapter.openMenu if Enter/Space key is pressed, and select is not focused',
     () => {
       const {foundation, mockAdapter} = setupTest();
       const preventDefault = jasmine.createSpy('');
       const event = {key: 'Enter', preventDefault} as any;
       mockAdapter.hasClass.withArgs('mdc-select--focused')
           .and.returnValue(false);
       foundation.handleKeydown(event);
       event.key = 'Space';
       foundation.handleKeydown(event);
       event.key = 'ArrowUp';
       foundation.handleKeydown(event);
       event.key = 'ArrowDown';
       foundation.handleKeydown(event);
       event.key = '';
       event.keyCode = 13;  // Enter
       foundation.handleKeydown(event);
       event.keyCode = 32;  // Space
       foundation.handleKeydown(event);
       event.keyCode = 38;  // Up
       foundation.handleKeydown(event);
       event.keyCode = 40;  // Down
       foundation.handleKeydown(event);
       expect(mockAdapter.openMenu).not.toHaveBeenCalled();
       expect(preventDefault).not.toHaveBeenCalled();
     });

  it('#handleKeydown does not call adapter.openMenu if menu is opened', () => {
    const {foundation, mockAdapter} = setupTest();
    const preventDefault = jasmine.createSpy('');
    const event = {key: 'Enter', preventDefault} as any;
    (foundation as any).isMenuOpen_ = true;
    foundation.handleKeydown(event);
    event.key = 'Space';
    foundation.handleKeydown(event);
    event.key = 'ArrowUp';
    foundation.handleKeydown(event);
    event.key = 'ArrowDown';
    foundation.handleKeydown(event);
    event.key = '';
    event.keyCode = 13;  // Enter
    foundation.handleKeydown(event);
    event.keyCode = 32;  // Space
    foundation.handleKeydown(event);
    event.keyCode = 38;  // Up
    foundation.handleKeydown(event);
    event.keyCode = 40;  // Down
    foundation.handleKeydown(event);
    expect(mockAdapter.openMenu).not.toHaveBeenCalled();
    expect(preventDefault).not.toHaveBeenCalled();
  });

  it('#layout calls notchOutline(true) if value is not an empty string', () => {
    const {foundation, mockAdapter} = setupTest();
    foundation.notchOutline = jasmine.createSpy('');
    mockAdapter.getMenuItemAttr.withArgs(jasmine.anything(), strings.VALUE_ATTR)
        .and.returnValue(' ');
    foundation.layout();
    expect(foundation.notchOutline).toHaveBeenCalledWith(true);
    expect(foundation.notchOutline).toHaveBeenCalledTimes(1);
  });

  it('#layout calls notchOutline(false) if value is an empty string', () => {
    const {foundation} = setupTest();
    foundation.notchOutline = jasmine.createSpy('');
    foundation.layout();
    expect(foundation.notchOutline).toHaveBeenCalledWith(false);
    expect(foundation.notchOutline).toHaveBeenCalledTimes(1);
  });

  it('#layout does not call notchOutline() if label does not exist', () => {
    const {foundation, mockAdapter} = setupTest();
    foundation.notchOutline = jasmine.createSpy('');
    mockAdapter.hasLabel.and.returnValue(false);
    foundation.layout();
    expect(foundation.notchOutline)
        .not.toHaveBeenCalledWith(jasmine.anything());
  });

  it('#setLeadingIconAriaLabel sets the aria-label of the leading icon element',
     () => {
       const {foundation, leadingIcon} = setupTest();
       foundation.setLeadingIconAriaLabel('foo');
       expect(leadingIcon.setAriaLabel).toHaveBeenCalledWith('foo');
       expect(leadingIcon.setAriaLabel).toHaveBeenCalledTimes(1);
     });

  it('#setLeadingIconContent sets the content of the leading icon element',
     () => {
       const {foundation, leadingIcon} = setupTest();
       foundation.setLeadingIconContent('foo');
       expect(leadingIcon.setContent).toHaveBeenCalledWith('foo');
       expect(leadingIcon.setContent).toHaveBeenCalledTimes(1);
     });

  it('#setLeadingIconAriaLabel does nothing if the leading icon element is undefined',
     () => {
       const hasLeadingIcon = false;
       const {foundation, leadingIcon} = setupTest(hasLeadingIcon);
       expect(() => foundation.setLeadingIconAriaLabel).not.toThrow();
       expect(leadingIcon.setAriaLabel).not.toHaveBeenCalledWith('foo');
     });

  it('#setLeadingIconContent does nothing if the leading icon element is undefined',
     () => {
       const hasLeadingIcon = false;
       const {foundation, leadingIcon} = setupTest(hasLeadingIcon);
       expect(() => foundation.setLeadingIconContent).not.toThrow();
       expect(leadingIcon.setContent).not.toHaveBeenCalledWith('foo');
     });

  it('#setHelperTextContent sets the content of the helper text element',
     () => {
       const hasIcon = false;
       const hasHelperText = true;
       const {foundation, helperText} = setupTest(hasIcon, hasHelperText);
       foundation.setHelperTextContent('foo');
       expect(helperText.setContent).toHaveBeenCalledWith('foo');
     });

  it('#setHelperTextContent does not throw an error if there is no helperText element',
     () => {
       const hasIcon = false;
       const hasHelperText = false;
       const {foundation} = setupTest(hasIcon, hasHelperText);
       expect(() => foundation.setHelperTextContent).not.toThrow();
     });

  it('#setSelectedIndex', () => {
    const {foundation, mockAdapter} = setupTest();
    mockAdapter.getMenuItemTextAtIndex.withArgs(0).and.returnValue('foo');
    mockAdapter.getMenuItemTextAtIndex.withArgs(1).and.returnValue('bar');
    mockAdapter.getMenuItemCount.and.returnValue(3);

    foundation.setSelectedIndex(1);
    expect(mockAdapter.addClassAtIndex)
        .toHaveBeenCalledWith(1, cssClasses.SELECTED_ITEM_CLASS);
    expect(mockAdapter.setAttributeAtIndex)
        .toHaveBeenCalledWith(1, strings.ARIA_SELECTED_ATTR, 'true');

    foundation.setSelectedIndex(0);
    expect(mockAdapter.removeClassAtIndex)
        .toHaveBeenCalledWith(1, cssClasses.SELECTED_ITEM_CLASS);
    expect(mockAdapter.removeAttributeAtIndex)
        .toHaveBeenCalledWith(1, strings.ARIA_SELECTED_ATTR);
    expect(mockAdapter.addClassAtIndex)
        .toHaveBeenCalledWith(0, cssClasses.SELECTED_ITEM_CLASS);
    expect(mockAdapter.setAttributeAtIndex)
        .toHaveBeenCalledWith(0, strings.ARIA_SELECTED_ATTR, 'true');

    foundation.setSelectedIndex(-1);
    expect(mockAdapter.removeClassAtIndex)
        .toHaveBeenCalledWith(0, cssClasses.SELECTED_ITEM_CLASS);
    expect(mockAdapter.removeAttributeAtIndex)
        .toHaveBeenCalledWith(0, strings.ARIA_SELECTED_ATTR);
  });

  it('#setValid true sets aria-invalid to false and removes invalid class',
     () => {
       const {foundation, mockAdapter} = setupTest();
       foundation.setValid(true);
       expect(mockAdapter.setSelectedTextAttr)
           .toHaveBeenCalledWith('aria-invalid', 'false');
       expect(mockAdapter.removeClass).toHaveBeenCalledWith(cssClasses.INVALID);
     });

  it('#setValid false sets aria-invalid to true and adds invalid class', () => {
    const {foundation, mockAdapter} = setupTest();
    foundation.setValid(false);
    expect(mockAdapter.setSelectedTextAttr)
        .toHaveBeenCalledWith('aria-invalid', 'true');
    expect(mockAdapter.addClass).toHaveBeenCalledWith(cssClasses.INVALID);
  });

  it('#isValid returns false if no index is selected', () => {
    const {foundation, mockAdapter} = setupTest();
    mockAdapter.hasClass.withArgs(cssClasses.REQUIRED).and.returnValue(true);
    mockAdapter.hasClass.withArgs(cssClasses.DISABLED).and.returnValue(false);
    (foundation as any).selectedIndex_ = -1;

    expect(foundation.isValid()).toBe(false);
  });

  it('#isValid returns false if first index is selected and has an empty value',
     () => {
       const {foundation, mockAdapter} = setupTest();
       mockAdapter.hasClass.withArgs(cssClasses.REQUIRED).and.returnValue(true);
       mockAdapter.hasClass.withArgs(cssClasses.DISABLED)
           .and.returnValue(false);
       mockAdapter.getMenuItemAttr
           .withArgs(jasmine.anything(), strings.VALUE_ATTR)
           .and.returnValue('');
       (foundation as any).selectedIndex_ = 0;

       expect(foundation.isValid()).toBe(false);
     });

  it('#isValid returns true if index is selected and has value', () => {
    const {foundation, mockAdapter} = setupTest();
    mockAdapter.hasClass.withArgs(cssClasses.REQUIRED).and.returnValue(true);
    mockAdapter.hasClass.withArgs(cssClasses.DISABLED).and.returnValue(false);
    mockAdapter.getMenuItemAttr.withArgs(jasmine.anything(), strings.VALUE_ATTR)
        .and.returnValue('foo');
    (foundation as any).selectedIndex_ = 0;

    expect(foundation.isValid()).toBe(true);
  });

  it('#setRequired adds/removes ${cssClasses.REQUIRED} class name', () => {
    const {foundation, mockAdapter} = setupTest();
    foundation.setRequired(true);
    expect(mockAdapter.addClass).toHaveBeenCalledWith(cssClasses.REQUIRED);
    expect(mockAdapter.addClass).toHaveBeenCalledTimes(1);
    foundation.setRequired(false);
    expect(mockAdapter.removeClass).toHaveBeenCalledWith(cssClasses.REQUIRED);
    expect(mockAdapter.removeClass).toHaveBeenCalledTimes(1);
  });

  it('#setRequired sets aria-required through adapter', () => {
    const {foundation, mockAdapter} = setupTest();
    foundation.setRequired(true);
    expect(mockAdapter.setSelectedTextAttr)
        .toHaveBeenCalledWith('aria-required', 'true');
    foundation.setRequired(false);
    expect(mockAdapter.setSelectedTextAttr)
        .toHaveBeenCalledWith('aria-required', 'false');
  });

  it('#getRequired returns true if aria-required is true', () => {
    const {foundation, mockAdapter} = setupTest();
    mockAdapter.getSelectedTextAttr.withArgs('aria-required')
        .and.returnValue('true');
    expect(foundation.getRequired()).toBe(true);
  });

  it('#getRequired returns false if aria-required is false', () => {
    const {foundation, mockAdapter} = setupTest();
    mockAdapter.getSelectedTextAttr.withArgs('aria-required')
        .and.returnValue('false');
    expect(foundation.getRequired()).toBe(false);
  });

  it('#init calls adapter methods', () => {
    const {foundation, mockAdapter} = setupTest();
    mockAdapter.getAnchorElement.and.returnValue(true);
    foundation.init();
    expect(mockAdapter.setMenuWrapFocus).toHaveBeenCalledWith(false);
    expect(mockAdapter.setMenuAnchorElement)
        .toHaveBeenCalledWith(jasmine.anything());
    expect(mockAdapter.setMenuAnchorCorner)
        .toHaveBeenCalledWith(jasmine.anything());
  });
});
