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

import {install as installClock} from '../helpers/clock';
import {verifyDefaultAdapter} from '../helpers/foundation';
import {setupFoundationTest} from '../helpers/setup';
import {MDCToolbarFoundation} from '../../../packages/mdc-toolbar/foundation';

const {cssClasses, numbers} = MDCToolbarFoundation;

suite('MDCToolbarFoundation');

test('exports strings', () => {
  assert.isOk('strings' in MDCToolbarFoundation);
});

test('exports cssClasses', () => {
  assert.isOk('cssClasses' in MDCToolbarFoundation);
});

test('exports numbers', () => {
  assert.isOk('numbers' in MDCToolbarFoundation);
});

test('defaultAdapter returns a complete adapter implementation', () => {
  verifyDefaultAdapter(MDCToolbarFoundation, [
    'hasClass', 'addClass', 'removeClass', 'registerScrollHandler',
    'deregisterScrollHandler', 'registerResizeHandler', 'deregisterResizeHandler',
    'getViewportWidth', 'getViewportScrollY', 'getOffsetHeight',
    'getFirstRowElementOffsetHeight', 'notifyChange', 'setStyle',
    'setStyleForTitleElement', 'setStyleForFlexibleRowElement',
    'setStyleForFixedAdjustElement',
  ]);
});

const setupTest = () => setupFoundationTest(MDCToolbarFoundation);
const approximate = (value, expected, delta) => {
  return Math.abs(value - expected) < delta;
};

const createMockHandlers = (foundation, mockAdapter, clock) => {
  let resizeHandler;
  let scrollHandler;
  td.when(mockAdapter.registerScrollHandler(td.matchers.isA(Function))).thenDo((fn) => {
    scrollHandler = fn;
  });
  td.when(mockAdapter.registerResizeHandler(td.matchers.isA(Function))).thenDo((fn) => {
    resizeHandler = fn;
  });
  foundation.init();
  clock.runToFrame();
  td.reset();
  return {resizeHandler, scrollHandler};
};

test('#init calls component event registrations', () => {
  const {foundation, mockAdapter} = setupTest();

  foundation.init();
  td.verify(mockAdapter.registerResizeHandler(td.matchers.isA(Function)));
  td.verify(mockAdapter.registerScrollHandler(td.matchers.isA(Function)));
});

test('#destroy calls component event deregistrations', () => {
  const {foundation, mockAdapter} = setupTest();
  const clock = installClock();
  const {resizeHandler, scrollHandler} = createMockHandlers(foundation, mockAdapter, clock);

  foundation.destroy();
  td.verify(mockAdapter.deregisterResizeHandler(resizeHandler));
  td.verify(mockAdapter.deregisterScrollHandler(scrollHandler));
});

test('#updateAdjustElementStyles adjust margin-top for fixed toolbar', () => {
  const {foundation, mockAdapter} = setupTest();

  td.when(mockAdapter.hasClass(cssClasses.FIXED)).thenReturn(true);
  foundation.init();
  foundation.updateAdjustElementStyles();

  td.verify(mockAdapter.setStyleForFixedAdjustElement('margin-top', td.matchers.isA(String)));
});

test('#updateAdjustElementStyles adjust margin-top for fixed last row only toolbar', () => {
  const {foundation, mockAdapter} = setupTest();

  td.when(mockAdapter.hasClass(cssClasses.FIXED)).thenReturn(true);
  td.when(mockAdapter.hasClass(cssClasses.FIXED_LASTROW)).thenReturn(true);
  foundation.init();
  foundation.updateAdjustElementStyles();

  td.verify(mockAdapter.setStyleForFixedAdjustElement('margin-top', td.matchers.isA(String)));
});

test('#updateAdjustElementStyles does not adjust margin-top for non-fixed toolbar', () => {
  const {foundation, mockAdapter} = setupTest();

  foundation.init();
  foundation.updateAdjustElementStyles();

  td.verify(mockAdapter.setStyleForFixedAdjustElement('margin-top', td.matchers.anything()), {times: 0});
});

test('on scroll debounces calls within the same frame', () => {
  const {foundation, mockAdapter} = setupTest();
  const clock = installClock();
  const {scrollHandler} = createMockHandlers(foundation, mockAdapter, clock);

  scrollHandler();
  scrollHandler();
  scrollHandler();
  assert.equal(clock.countTimers(), 1);
});

test('on scroll resets debounce latch when scroll frame is run', () => {
  const {foundation, mockAdapter} = setupTest();
  const clock = installClock();
  const {scrollHandler} = createMockHandlers(foundation, mockAdapter, clock);

  scrollHandler();
  clock.runToFrame();
  scrollHandler();

  assert.equal(clock.countTimers(), 1);
});

test('on scroll handles no flexible height case', () => {
  const {foundation, mockAdapter} = setupTest();
  const clock = installClock();

  setDeviceDesktop(mockAdapter);
  td.when(mockAdapter.getFirstRowElementOffsetHeight()).thenReturn(numbers.TOOLBAR_ROW_HEIGHT);
  td.when(mockAdapter.getOffsetHeight()).thenReturn(numbers.TOOLBAR_ROW_HEIGHT);
  const {scrollHandler} = createMockHandlers(foundation, mockAdapter, clock);

  td.when(mockAdapter.getViewportScrollY()).thenReturn(1);

  scrollHandler();
  clock.runToFrame();

  td.verify(mockAdapter.notifyChange({
    flexibleExpansionRatio: td.matchers.argThat((flexExpansionRatio) => approximate(flexExpansionRatio, 0, 0.001))}));
});

const scrollEventMock =
  (foundation, mockAdapter, clock, {isOutOfThreshold=false, flexExpansionRatio=0} = {}) => {
    setDeviceDesktop(mockAdapter);
    td.when(mockAdapter.getFirstRowElementOffsetHeight()).thenReturn(numbers.TOOLBAR_ROW_HEIGHT * 3);
    td.when(mockAdapter.getOffsetHeight()).thenReturn(numbers.TOOLBAR_ROW_HEIGHT * 4);
    const {scrollHandler} = createMockHandlers(foundation, mockAdapter, clock);

    const flexibleExpansionHeight = numbers.TOOLBAR_ROW_HEIGHT * 2;
    const maxTranslateYDistance = numbers.TOOLBAR_ROW_HEIGHT;
    const scrollThreshold = flexibleExpansionHeight + maxTranslateYDistance;

    if (flexExpansionRatio > 0) {
      td.when(mockAdapter.getViewportScrollY()).thenReturn((1 - flexExpansionRatio) * flexibleExpansionHeight);
    } else {
      if (isOutOfThreshold) {
        td.when(mockAdapter.getViewportScrollY()).thenReturn(scrollThreshold + 1);
      } else {
        td.when(mockAdapter.getViewportScrollY()).thenReturn(scrollThreshold - 1);
      }
    }

    scrollHandler();
    clock.runToFrame();
  };

test('on scroll will not execute if we scrolled out of Threshold the first time', () => {
  const {foundation, mockAdapter} = setupTest();
  const clock = installClock();

  scrollEventMock(foundation, mockAdapter, clock, {isOutOfThreshold: true});

  td.verify(mockAdapter.notifyChange({flexibleExpansionRatio: td.matchers.isA(Number)}));
});

test('on scroll will not execute if we scrolled out of Threshold the second time', () => {
  const {foundation, mockAdapter} = setupTest();
  const clock = installClock();

  scrollEventMock(foundation, mockAdapter, clock, {isOutOfThreshold: true});
  td.reset();
  scrollEventMock(foundation, mockAdapter, clock, {isOutOfThreshold: true});

  td.verify(mockAdapter.notifyChange({flexibleExpansionRatio: td.matchers.isA(Number)}), {times: 0});
});

test('on scroll will execute if we have not scrolled out of Threshold', () => {
  const {foundation, mockAdapter} = setupTest();
  const clock = installClock();

  scrollEventMock(foundation, mockAdapter, clock);

  td.verify(mockAdapter.notifyChange({flexibleExpansionRatio: td.matchers.isA(Number)}));
});

test('on scroll takes correct action for scrollable flexible header when flexible space fully expaned', () => {
  const {foundation, mockAdapter} = setupTest();
  const clock = installClock();

  td.when(mockAdapter.hasClass(cssClasses.TOOLBAR_ROW_FLEXIBLE)).thenReturn(true);
  scrollEventMock(foundation, mockAdapter, clock, {flexExpansionRatio: 1});

  td.verify(mockAdapter.notifyChange({
    flexibleExpansionRatio: td.matchers.argThat((flexExpansionRatio) => approximate(flexExpansionRatio, 1, 0.001))}));
  td.verify(mockAdapter.removeClass(cssClasses.FLEXIBLE_MAX));
  td.verify(mockAdapter.removeClass(cssClasses.FLEXIBLE_MIN));
  td.verify(mockAdapter.addClass(cssClasses.FLEXIBLE_MAX));
  td.verify(mockAdapter.addClass(cssClasses.FLEXIBLE_MIN), {times: 0});
  td.verify(mockAdapter.setStyle('transform', td.matchers.anything()), {times: 0});
  td.verify(mockAdapter.setStyleForFlexibleRowElement('height', td.matchers.anything()), {times: 0});
  td.verify(mockAdapter.setStyleForTitleElement('transform', td.matchers.anything()), {times: 0});
  td.verify(mockAdapter.setStyleForTitleElement('font-size', td.matchers.anything()), {times: 0});
});

test('on scroll take correct action for scrollable flexible header when flexible space shrinked', () => {
  const {foundation, mockAdapter} = setupTest();
  const clock = installClock();

  td.when(mockAdapter.hasClass(cssClasses.TOOLBAR_ROW_FLEXIBLE)).thenReturn(true);
  scrollEventMock(foundation, mockAdapter, clock, {flexExpansionRatio: 0});

  td.verify(mockAdapter.notifyChange({
    flexibleExpansionRatio: td.matchers.argThat((flexExpansionRatio) => approximate(flexExpansionRatio, 0, 0.001))}));
  td.verify(mockAdapter.removeClass(cssClasses.FLEXIBLE_MAX));
  td.verify(mockAdapter.removeClass(cssClasses.FLEXIBLE_MIN));
  td.verify(mockAdapter.addClass(cssClasses.FLEXIBLE_MIN));
  td.verify(mockAdapter.addClass(cssClasses.FLEXIBLE_MAX), {times: 0});
  td.verify(mockAdapter.setStyle('transform', td.matchers.anything()), {times: 0});
  td.verify(mockAdapter.setStyleForFlexibleRowElement('height', td.matchers.anything()), {times: 0});
  td.verify(mockAdapter.setStyleForTitleElement('transform', td.matchers.anything()), {times: 0});
  td.verify(mockAdapter.setStyleForTitleElement('font-size', td.matchers.anything()), {times: 0});
});

test('on scroll take correct action for scrollable flexible header when flexible space in transition', () => {
  const {foundation, mockAdapter} = setupTest();
  const clock = installClock();

  td.when(mockAdapter.hasClass(cssClasses.TOOLBAR_ROW_FLEXIBLE)).thenReturn(true);
  scrollEventMock(foundation, mockAdapter, clock, {flexExpansionRatio: 0.5});

  td.verify(mockAdapter.notifyChange({
    flexibleExpansionRatio: td.matchers.argThat((flexExpansionRatio) => approximate(flexExpansionRatio, 0.5, 0.001))}));
  td.verify(mockAdapter.removeClass(cssClasses.FLEXIBLE_MAX));
  td.verify(mockAdapter.removeClass(cssClasses.FLEXIBLE_MIN));
  td.verify(mockAdapter.addClass(cssClasses.FLEXIBLE_MAX), {times: 0});
  td.verify(mockAdapter.addClass(cssClasses.FLEXIBLE_MIN), {times: 0});
  td.verify(mockAdapter.setStyle('transform', td.matchers.anything()), {times: 0});
  td.verify(mockAdapter.setStyleForFlexibleRowElement('height', td.matchers.anything()), {times: 0});
  td.verify(mockAdapter.setStyleForTitleElement('transform', td.matchers.anything()), {times: 0});
  td.verify(mockAdapter.setStyleForTitleElement('font-size', td.matchers.anything()), {times: 0});
});

test('on scroll take correct action for fixed flexible header when flexible space fully expaned', () => {
  const {foundation, mockAdapter} = setupTest();
  const clock = installClock();

  td.when(mockAdapter.hasClass(cssClasses.TOOLBAR_ROW_FLEXIBLE)).thenReturn(true);
  td.when(mockAdapter.hasClass(cssClasses.FIXED)).thenReturn(true);
  scrollEventMock(foundation, mockAdapter, clock, {flexExpansionRatio: 1});

  td.verify(mockAdapter.notifyChange({
    flexibleExpansionRatio: td.matchers.argThat((flexExpansionRatio) => approximate(flexExpansionRatio, 1, 0.001))}));
  td.verify(mockAdapter.removeClass(cssClasses.FLEXIBLE_MAX));
  td.verify(mockAdapter.removeClass(cssClasses.FLEXIBLE_MIN));
  td.verify(mockAdapter.addClass(cssClasses.FLEXIBLE_MAX));
  td.verify(mockAdapter.addClass(cssClasses.FLEXIBLE_MIN), {times: 0});
  td.verify(mockAdapter.setStyle('transform', td.matchers.anything()), {times: 0});
  td.verify(mockAdapter.setStyleForFlexibleRowElement('height', td.matchers.anything()));
  td.verify(mockAdapter.setStyleForTitleElement('transform', td.matchers.anything()), {times: 0});
  td.verify(mockAdapter.setStyleForTitleElement('font-size', td.matchers.anything()), {times: 0});
});

test('on scroll take correct action for fixed flexible header when flexible space shrinked', () => {
  const {foundation, mockAdapter} = setupTest();
  const clock = installClock();

  td.when(mockAdapter.hasClass(cssClasses.TOOLBAR_ROW_FLEXIBLE)).thenReturn(true);
  td.when(mockAdapter.hasClass(cssClasses.FIXED)).thenReturn(true);
  scrollEventMock(foundation, mockAdapter, clock, {flexExpansionRatio: 0});

  td.verify(mockAdapter.notifyChange({
    flexibleExpansionRatio: td.matchers.argThat((flexExpansionRatio) => approximate(flexExpansionRatio, 0, 0.001))}));
  td.verify(mockAdapter.removeClass(cssClasses.FLEXIBLE_MAX));
  td.verify(mockAdapter.removeClass(cssClasses.FLEXIBLE_MIN));
  td.verify(mockAdapter.addClass(cssClasses.FLEXIBLE_MIN));
  td.verify(mockAdapter.addClass(cssClasses.FLEXIBLE_MAX), {times: 0});
  td.verify(mockAdapter.setStyle('transform', td.matchers.anything()), {times: 0});
  td.verify(mockAdapter.setStyleForFlexibleRowElement('height', td.matchers.anything()));
  td.verify(mockAdapter.setStyleForTitleElement('transform', td.matchers.anything()), {times: 0});
  td.verify(mockAdapter.setStyleForTitleElement('font-size', td.matchers.anything()), {times: 0});
});

test('on scroll take correct action for fixed flexible header when flexible space in transition', () => {
  const {foundation, mockAdapter} = setupTest();
  const clock = installClock();

  td.when(mockAdapter.hasClass(cssClasses.TOOLBAR_ROW_FLEXIBLE)).thenReturn(true);
  td.when(mockAdapter.hasClass(cssClasses.FIXED)).thenReturn(true);
  scrollEventMock(foundation, mockAdapter, clock, {flexExpansionRatio: 0.5});

  td.verify(mockAdapter.notifyChange({
    flexibleExpansionRatio: td.matchers.argThat((flexExpansionRatio) => approximate(flexExpansionRatio, 0.5, 0.001))}));
  td.verify(mockAdapter.removeClass(cssClasses.FLEXIBLE_MAX));
  td.verify(mockAdapter.removeClass(cssClasses.FLEXIBLE_MIN));
  td.verify(mockAdapter.addClass(cssClasses.FLEXIBLE_MAX), {times: 0});
  td.verify(mockAdapter.addClass(cssClasses.FLEXIBLE_MIN), {times: 0});
  td.verify(mockAdapter.setStyle('transform', td.matchers.anything()), {times: 0});
  td.verify(mockAdapter.setStyleForFlexibleRowElement('height', td.matchers.anything()));
  td.verify(mockAdapter.setStyleForTitleElement('transform', td.matchers.anything()), {times: 0});
  td.verify(mockAdapter.setStyleForTitleElement('font-size', td.matchers.anything()), {times: 0});
});

test('on scroll take correct action for fixed last row flexible header when flexible space fully expaned', () => {
  const {foundation, mockAdapter} = setupTest();
  const clock = installClock();

  td.when(mockAdapter.hasClass(cssClasses.TOOLBAR_ROW_FLEXIBLE)).thenReturn(true);
  td.when(mockAdapter.hasClass(cssClasses.FIXED)).thenReturn(true);
  td.when(mockAdapter.hasClass(cssClasses.FIXED_LASTROW)).thenReturn(true);
  scrollEventMock(foundation, mockAdapter, clock, {flexExpansionRatio: 1});

  td.verify(mockAdapter.notifyChange({
    flexibleExpansionRatio: td.matchers.argThat((flexExpansionRatio) => approximate(flexExpansionRatio, 1, 0.001))}));
  td.verify(mockAdapter.removeClass(cssClasses.FLEXIBLE_MAX));
  td.verify(mockAdapter.removeClass(cssClasses.FLEXIBLE_MIN));
  td.verify(mockAdapter.addClass(cssClasses.FLEXIBLE_MAX));
  td.verify(mockAdapter.addClass(cssClasses.FLEXIBLE_MIN), {times: 0});
  td.verify(mockAdapter.setStyle('transform', td.matchers.anything()));
  td.verify(mockAdapter.setStyleForFlexibleRowElement('height', td.matchers.anything()));
  td.verify(mockAdapter.setStyleForTitleElement('transform', td.matchers.anything()), {times: 0});
  td.verify(mockAdapter.setStyleForTitleElement('font-size', td.matchers.anything()), {times: 0});
});

test('on scroll take correct action for fixed last row flexible header when flexible space shrinked', () => {
  const {foundation, mockAdapter} = setupTest();
  const clock = installClock();

  td.when(mockAdapter.hasClass(cssClasses.TOOLBAR_ROW_FLEXIBLE)).thenReturn(true);
  td.when(mockAdapter.hasClass(cssClasses.FIXED)).thenReturn(true);
  td.when(mockAdapter.hasClass(cssClasses.FIXED_LASTROW)).thenReturn(true);
  scrollEventMock(foundation, mockAdapter, clock, {flexExpansionRatio: 0});

  td.verify(mockAdapter.notifyChange({
    flexibleExpansionRatio: td.matchers.argThat((flexExpansionRatio) => approximate(flexExpansionRatio, 0, 0.001))}));
  td.verify(mockAdapter.removeClass(cssClasses.FLEXIBLE_MAX));
  td.verify(mockAdapter.removeClass(cssClasses.FLEXIBLE_MIN));
  td.verify(mockAdapter.addClass(cssClasses.FLEXIBLE_MIN));
  td.verify(mockAdapter.addClass(cssClasses.FLEXIBLE_MAX), {times: 0});
  td.verify(mockAdapter.setStyle('transform', td.matchers.anything()));
  td.verify(mockAdapter.setStyleForFlexibleRowElement('height', td.matchers.anything()));
  td.verify(mockAdapter.addClass(cssClasses.FIXED_AT_LAST_ROW), {times: 0});
  td.verify(mockAdapter.setStyleForTitleElement('transform', td.matchers.anything()), {times: 0});
  td.verify(mockAdapter.setStyleForTitleElement('font-size', td.matchers.anything()), {times: 0});
});

test('on scroll take correct action for fixed last row flexible header when other rows scrolled out already', () => {
  const {foundation, mockAdapter} = setupTest();
  const clock = installClock();

  td.when(mockAdapter.hasClass(cssClasses.TOOLBAR_ROW_FLEXIBLE)).thenReturn(true);
  td.when(mockAdapter.hasClass(cssClasses.FIXED)).thenReturn(true);
  td.when(mockAdapter.hasClass(cssClasses.FIXED_LASTROW)).thenReturn(true);
  scrollEventMock(foundation, mockAdapter, clock, {isOutOfThreshold: true});

  td.verify(mockAdapter.notifyChange({
    flexibleExpansionRatio: td.matchers.argThat((flexExpansionRatio) => approximate(flexExpansionRatio, 0, 0.001))}));
  td.verify(mockAdapter.removeClass(cssClasses.FLEXIBLE_MAX));
  td.verify(mockAdapter.removeClass(cssClasses.FLEXIBLE_MIN));
  td.verify(mockAdapter.addClass(cssClasses.FLEXIBLE_MIN));
  td.verify(mockAdapter.addClass(cssClasses.FLEXIBLE_MAX), {times: 0});
  td.verify(mockAdapter.setStyle('transform', td.matchers.anything()));
  td.verify(mockAdapter.setStyleForFlexibleRowElement('height', td.matchers.anything()));
  td.verify(mockAdapter.addClass(cssClasses.FIXED_AT_LAST_ROW));
  td.verify(mockAdapter.setStyleForTitleElement('transform', td.matchers.anything()), {times: 0});
  td.verify(mockAdapter.setStyleForTitleElement('font-size', td.matchers.anything()), {times: 0});
});

test('on scroll take correct action for fixed last row flexible header when flexible space in transition', () => {
  const {foundation, mockAdapter} = setupTest();
  const clock = installClock();

  td.when(mockAdapter.hasClass(cssClasses.TOOLBAR_ROW_FLEXIBLE)).thenReturn(true);
  td.when(mockAdapter.hasClass(cssClasses.FIXED)).thenReturn(true);
  td.when(mockAdapter.hasClass(cssClasses.FIXED_LASTROW)).thenReturn(true);
  scrollEventMock(foundation, mockAdapter, clock, {flexExpansionRatio: 0.5});

  td.verify(mockAdapter.notifyChange({
    flexibleExpansionRatio: td.matchers.argThat((flexExpansionRatio) => approximate(flexExpansionRatio, 0.5, 0.001))}));
  td.verify(mockAdapter.removeClass(cssClasses.FLEXIBLE_MAX));
  td.verify(mockAdapter.removeClass(cssClasses.FLEXIBLE_MIN));
  td.verify(mockAdapter.addClass(cssClasses.FLEXIBLE_MAX), {times: 0});
  td.verify(mockAdapter.addClass(cssClasses.FLEXIBLE_MIN), {times: 0});
  td.verify(mockAdapter.setStyle('transform', td.matchers.anything()));
  td.verify(mockAdapter.setStyleForFlexibleRowElement('height', td.matchers.anything()));
  td.verify(mockAdapter.setStyleForTitleElement('transform', td.matchers.anything()), {times: 0});
  td.verify(mockAdapter.setStyleForTitleElement('font-size', td.matchers.anything()), {times: 0});
});

test('on scroll take correct action for non-flexible scrollable header', () => {
  const {foundation, mockAdapter} = setupTest();
  const clock = installClock();

  scrollEventMock(foundation, mockAdapter, clock, {flexExpansionRatio: 0});

  td.verify(mockAdapter.notifyChange({
    flexibleExpansionRatio: td.matchers.argThat((flexExpansionRatio) => approximate(flexExpansionRatio, 0, 0.001))}));
  td.verify(mockAdapter.removeClass(cssClasses.FLEXIBLE_MAX));
  td.verify(mockAdapter.removeClass(cssClasses.FLEXIBLE_MIN));
  td.verify(mockAdapter.addClass(cssClasses.FLEXIBLE_MIN));
  td.verify(mockAdapter.addClass(cssClasses.FLEXIBLE_MAX), {times: 0});
  td.verify(mockAdapter.setStyle('transform', td.matchers.anything()), {times: 0});
  td.verify(mockAdapter.setStyleForFlexibleRowElement('height', td.matchers.anything()), {times: 0});
  td.verify(mockAdapter.setStyleForTitleElement('transform', td.matchers.anything()), {times: 0});
  td.verify(mockAdapter.setStyleForTitleElement('font-size', td.matchers.anything()), {times: 0});
});

test('on scroll take correct action for non-flexible fixed header', () => {
  const {foundation, mockAdapter} = setupTest();
  const clock = installClock();

  td.when(mockAdapter.hasClass(cssClasses.FIXED)).thenReturn(true);
  scrollEventMock(foundation, mockAdapter, clock, {flexExpansionRatio: 0});

  td.verify(mockAdapter.notifyChange({
    flexibleExpansionRatio: td.matchers.argThat((flexExpansionRatio) => approximate(flexExpansionRatio, 0, 0.001))}));
  td.verify(mockAdapter.removeClass(cssClasses.FLEXIBLE_MAX));
  td.verify(mockAdapter.removeClass(cssClasses.FLEXIBLE_MIN));
  td.verify(mockAdapter.addClass(cssClasses.FLEXIBLE_MIN));
  td.verify(mockAdapter.addClass(cssClasses.FLEXIBLE_MAX), {times: 0});
  td.verify(mockAdapter.setStyle('transform', td.matchers.anything()), {times: 0});
  td.verify(mockAdapter.setStyleForFlexibleRowElement('height', td.matchers.anything()), {times: 0});
  td.verify(mockAdapter.setStyleForTitleElement('transform', td.matchers.anything()), {times: 0});
  td.verify(mockAdapter.setStyleForTitleElement('font-size', td.matchers.anything()), {times: 0});
});

test('on scroll take correct action for non-flexible fixed last row only header', () => {
  const {foundation, mockAdapter} = setupTest();
  const clock = installClock();

  td.when(mockAdapter.hasClass(cssClasses.FIXED)).thenReturn(true);
  td.when(mockAdapter.hasClass(cssClasses.FIXED_LASTROW)).thenReturn(true);
  scrollEventMock(foundation, mockAdapter, clock, {flexExpansionRatio: 0});

  td.verify(mockAdapter.notifyChange({
    flexibleExpansionRatio: td.matchers.argThat((flexExpansionRatio) => approximate(flexExpansionRatio, 0, 0.001))}));
  td.verify(mockAdapter.removeClass(cssClasses.FLEXIBLE_MAX));
  td.verify(mockAdapter.removeClass(cssClasses.FLEXIBLE_MIN));
  td.verify(mockAdapter.addClass(cssClasses.FLEXIBLE_MIN));
  td.verify(mockAdapter.addClass(cssClasses.FLEXIBLE_MAX), {times: 0});
  td.verify(mockAdapter.setStyle('transform', td.matchers.anything()));
  td.verify(mockAdapter.setStyleForFlexibleRowElement('height', td.matchers.anything()), {times: 0});
  td.verify(mockAdapter.setStyleForTitleElement('transform', td.matchers.anything()), {times: 0});
  td.verify(mockAdapter.setStyleForTitleElement('font-size', td.matchers.anything()), {times: 0});
});

test('on scroll take correct action for flexible scrollable header with default behavior', () => {
  const {foundation, mockAdapter} = setupTest();
  const clock = installClock();

  td.when(mockAdapter.hasClass(cssClasses.TOOLBAR_ROW_FLEXIBLE)).thenReturn(true);
  td.when(mockAdapter.hasClass(cssClasses.FLEXIBLE_DEFAULT_BEHAVIOR)).thenReturn(true);
  scrollEventMock(foundation, mockAdapter, clock, {flexExpansionRatio: 0});

  td.verify(mockAdapter.setStyleForTitleElement('transform', td.matchers.anything()), {times: 0});
  td.verify(mockAdapter.setStyleForTitleElement('font-size', td.matchers.anything()));
});

test('on scroll take correct action for flexible fixed last row only header with default behavior', () => {
  const {foundation, mockAdapter} = setupTest();
  const clock = installClock();

  td.when(mockAdapter.hasClass(cssClasses.TOOLBAR_ROW_FLEXIBLE)).thenReturn(true);
  td.when(mockAdapter.hasClass(cssClasses.FIXED)).thenReturn(true);
  td.when(mockAdapter.hasClass(cssClasses.FIXED_LASTROW)).thenReturn(true);
  td.when(mockAdapter.hasClass(cssClasses.FLEXIBLE_DEFAULT_BEHAVIOR)).thenReturn(true);
  scrollEventMock(foundation, mockAdapter, clock, {flexExpansionRatio: 0});

  td.verify(mockAdapter.setStyleForTitleElement('font-size', td.matchers.anything()));
});

test('on scroll take correct action for flexible fixed header with default behavior', () => {
  const {foundation, mockAdapter} = setupTest();
  const clock = installClock();

  td.when(mockAdapter.hasClass(cssClasses.TOOLBAR_ROW_FLEXIBLE)).thenReturn(true);
  td.when(mockAdapter.hasClass(cssClasses.FIXED)).thenReturn(true);
  td.when(mockAdapter.hasClass(cssClasses.FLEXIBLE_DEFAULT_BEHAVIOR)).thenReturn(true);
  scrollEventMock(foundation, mockAdapter, clock, {flexExpansionRatio: 0});

  td.verify(mockAdapter.setStyleForTitleElement('font-size', td.matchers.anything()));
});

test('on resize debounces calls within the same frame', () => {
  const {foundation, mockAdapter} = setupTest();
  const clock = installClock();
  const {resizeHandler} = createMockHandlers(foundation, mockAdapter, clock);

  resizeHandler();
  resizeHandler();
  resizeHandler();
  assert.equal(clock.countTimers(), 1);
});

test('on resize resets debounce latch when checkRowHeight_ frame is run', () => {
  const {foundation, mockAdapter} = setupTest();
  const clock = installClock();
  const {resizeHandler} = createMockHandlers(foundation, mockAdapter, clock);

  resizeHandler();
  // Calling runToFrame twice because on resize also calls requestAnimationFrame
  clock.runToFrame();
  clock.runToFrame();
  resizeHandler();
  assert.equal(clock.countTimers(), 1);
});

const setDeviceDesktop = (mockAdapter, {isDesktop = true} = {}) => {
  const breakpoint = numbers.TOOLBAR_MOBILE_BREAKPOINT;
  td.when(mockAdapter.getViewportWidth()).thenReturn((isDesktop ? 1 : -1) + breakpoint);
};

test('on resize do not call update style if screen width does not go below breakpoint', () => {
  const {foundation, mockAdapter} = setupTest();
  const clock = installClock();
  const {resizeHandler} = createMockHandlers(foundation, mockAdapter, clock);

  foundation.updateAdjustElementStyles = td.function();

  setDeviceDesktop(mockAdapter);
  td.reset();

  resizeHandler();
  clock.runToFrame();

  td.verify(foundation.updateAdjustElementStyles(), {times: 0});
});

test('on resize call update style if screen width go below breakpoint', () => {
  const {foundation, mockAdapter} = setupTest();
  const clock = installClock();
  const {resizeHandler} = createMockHandlers(foundation, mockAdapter, clock);
  setDeviceDesktop(mockAdapter, {isDesktop: false});

  foundation.updateAdjustElementStyles = td.function();

  resizeHandler();
  clock.runToFrame();

  td.verify(foundation.updateAdjustElementStyles());
});
