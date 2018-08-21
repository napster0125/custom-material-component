/**
 * @license
 * Copyright 2016 Google Inc.
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

import {assert} from 'chai';
import td from 'testdouble';

import {setupFoundationTest} from '../helpers/setup';
import {verifyDefaultAdapter} from '../helpers/foundation';

import MDCSelectFoundation from '../../../packages/mdc-select/foundation';
import {cssClasses, strings, numbers} from '../../../packages/mdc-select/constants';

suite('MDCSelectFoundation');

test('exports cssClasses', () => {
  assert.deepEqual(MDCSelectFoundation.cssClasses, cssClasses);
});

test('exports numbers', () => {
  assert.deepEqual(MDCSelectFoundation.numbers, numbers);
});

test('exports strings', () => {
  assert.deepEqual(MDCSelectFoundation.strings, strings);
});

test('default adapter returns a complete adapter implementation', () => {
  verifyDefaultAdapter(MDCSelectFoundation, [
    'addClass', 'removeClass', 'hasClass', 'floatLabel', 'activateBottomLine',
    'deactivateBottomLine', 'getValue',
    'isRtl', 'hasLabel', 'getLabelWidth', 'hasOutline',
    'notchOutline', 'closeOutline',
  ]);
});

function setupTest() {
  const {mockAdapter, foundation} = setupFoundationTest(MDCSelectFoundation);
  td.when(mockAdapter.getValue()).thenReturn('');
  return {mockAdapter, foundation};
}

test('#updateDisabledStyle(true) calls adapter.addClass', () => {
  const {mockAdapter, foundation} = setupTest();
  foundation.updateDisabledStyle(true);
  td.verify(mockAdapter.addClass(MDCSelectFoundation.cssClasses.DISABLED));
});

test('#updateDisabledStyle(false) calls adapter.removeClass', () => {
  const {mockAdapter, foundation} = setupTest();
  foundation.updateDisabledStyle(false);
  td.verify(mockAdapter.removeClass(MDCSelectFoundation.cssClasses.DISABLED));
});

test('#notchOutline updates the SVG path of the outline element', () => {
  const {foundation, mockAdapter} = setupTest();
  td.when(mockAdapter.getLabelWidth()).thenReturn(30);
  td.when(mockAdapter.hasLabel()).thenReturn(true);
  td.when(mockAdapter.hasOutline()).thenReturn(true);
  td.when(mockAdapter.isRtl()).thenReturn(false);

  foundation.notchOutline(true);
  td.verify(mockAdapter.notchOutline(30 * numbers.LABEL_SCALE, false));
});

test('#notchOutline does nothing if no outline is present', () => {
  const {foundation, mockAdapter} = setupTest();
  td.when(mockAdapter.hasOutline()).thenReturn(false);
  td.when(mockAdapter.hasLabel()).thenReturn(true);

  foundation.notchOutline(true);
  td.verify(mockAdapter.notchOutline(td.matchers.anything()), {times: 0});
});

test('#notchOutline does nothing if no label is present', () => {
  const {foundation, mockAdapter} = setupTest();
  td.when(mockAdapter.hasOutline()).thenReturn(true);
  td.when(mockAdapter.hasLabel()).thenReturn(false);

  foundation.notchOutline(true);
  td.verify(mockAdapter.notchOutline(td.matchers.anything()), {times: 0});
});

test('#notchOutline calls updates notched outline to return to idle state when ' +
  'openNotch is false', () => {
  const {foundation, mockAdapter} = setupTest();
  td.when(mockAdapter.hasLabel()).thenReturn(true);
  td.when(mockAdapter.hasOutline()).thenReturn(true);

  foundation.notchOutline(false);
  td.verify(mockAdapter.closeOutline());
});

test('#handleChange calls adapter.floatLabel(true) when there is a value', () => {
  const {foundation, mockAdapter} = setupTest();
  td.when(mockAdapter.getValue()).thenReturn('value');

  foundation.handleChange();
  td.verify(mockAdapter.floatLabel(true), {times: 1});
});

test('#handleChange calls adapter.floatLabel(false) when there is no value', () => {
  const {foundation, mockAdapter} = setupTest();
  td.when(mockAdapter.getValue()).thenReturn('');

  foundation.handleChange();
  td.verify(mockAdapter.floatLabel(false), {times: 1});
});

test('#handleChange calls foundation.notchOutline(true) when there is a value', () => {
  const {foundation, mockAdapter} = setupTest();
  foundation.notchOutline = td.func();
  td.when(mockAdapter.getValue()).thenReturn('value');

  foundation.handleChange();
  td.verify(foundation.notchOutline(true), {times: 1});
});

test('#handleChange calls foundation.notchOutline(false) when there is no value', () => {
  const {foundation, mockAdapter} = setupTest();
  foundation.notchOutline = td.func();
  td.when(mockAdapter.getValue()).thenReturn('');

  foundation.handleChange();
  td.verify(foundation.notchOutline(false), {times: 1});
});

test('#handleFocus calls adapter.floatLabel(true)', () => {
  const {foundation, mockAdapter} = setupTest();

  foundation.handleFocus();
  td.verify(mockAdapter.floatLabel(true), {times: 1});
});

test('#handleFocus calls foundation.notchOutline(true)', () => {
  const {foundation} = setupTest();
  foundation.notchOutline = td.func();
  foundation.handleFocus();
  td.verify(foundation.notchOutline(true), {times: 1});
});

test('#handleFocus calls adapter.activateBottomLine()', () => {
  const {foundation, mockAdapter} = setupTest();
  foundation.handleFocus();
  td.verify(mockAdapter.activateBottomLine(), {times: 1});
});

test('#handleBlur calls foundation.handleChange()', () => {
  const {foundation} = setupTest();
  foundation.handleChange = td.func();
  foundation.handleBlur();
  td.verify(foundation.handleChange(), {times: 1});
});

test('#handleBlur calls adapter.deactivateBottomLine()', () => {
  const {foundation, mockAdapter} = setupTest();
  foundation.handleBlur();
  td.verify(mockAdapter.deactivateBottomLine(), {times: 1});
});
