/**
 * Copyright 2016 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import test from 'tape';
import lolex from 'lolex';
import td from 'testdouble';
import {captureHandlers, verifyDefaultAdapter} from '../helpers/foundation';
import {setupFoundationTest} from '../helpers/setup';
import {createMockRaf} from '../helpers/raf';
import MDCSimpleMenuFoundation from '../../../packages/mdc-menu/simple/foundation';
import {cssClasses, strings, numbers} from '../../../packages/mdc-menu/simple/constants';

function setupTest(isCssVarsSupported = true) {
  const {foundation, mockAdapter} = setupFoundationTest(MDCSimpleMenuFoundation);
  const size = {width: 500, height: 200};
  const itemYParams = {top: 100, height: 20};
  td.when(mockAdapter.hasClass('mdc-simple-menu')).thenReturn(true);
  td.when(mockAdapter.hasClass('mdc-simple-menu--open')).thenReturn(false);
  td.when(mockAdapter.hasNecessaryDom()).thenReturn(true);
  td.when(mockAdapter.getNumberOfItems()).thenReturn(1);
  td.when(mockAdapter.getInnerDimensions()).thenReturn(size);
  td.when(mockAdapter.getYParamsForItemAtIndex(0)).thenReturn(itemYParams);

  return {foundation, mockAdapter};
}

function testFoundation(desc, runTests) {
  test(desc, t => {
    const {mockAdapter, foundation} = setupTest();
    const mockRaf = createMockRaf();
    // eslint-tape-plugin complains when we reference an unknown member on t,
    // so we disable that so we can supplement t.
    // eslint-disable-next-line tape/use-t-well
    t.data = {mockAdapter, foundation, mockRaf};

    // Override end so that animation frame functions are always restored.
    const {end} = t;
    t.end = function(...args) {
      mockRaf.restore();
      end.apply(t, args);
    };
    runTests(t, {mockAdapter, foundation, mockRaf});
  });
}

test('exports strings', t => {
  t.deepEqual(MDCSimpleMenuFoundation.strings, strings);
  t.end();
});

test('exports cssClasses', t => {
  t.deepEqual(MDCSimpleMenuFoundation.cssClasses, cssClasses);
  t.end();
});

test('exports numbers', t => {
  t.deepEqual(MDCSimpleMenuFoundation.numbers, numbers);
  t.end();
});

test('defaultAdapter returns a complete adapter implementation', t => {
  verifyDefaultAdapter(MDCSimpleMenuFoundation, [
    'addClass', 'removeClass', 'hasClass', 'hasNecessaryDom', 'getInnerDimensions', 'hasAnchor',
    'getAnchorDimensions', 'getWindowDimensions', 'setScale', 'setInnerScale', 'getNumberOfItems',
    'registerInteractionHandler', 'deregisterInteractionHandler', 'registerDocumentClickHandler',
    'deregisterDocumentClickHandler', 'getYParamsForItemAtIndex', 'setTransitionDelayForItemAtIndex',
    'getIndexForEventTarget', 'notifySelected', 'notifyCancel', 'saveFocus', 'restoreFocus', 'isFocused', 'focus',
    'getFocusedItemIndex', 'focusItemAtIndex', 'isRtl', 'setTransformOrigin', 'setPosition'
  ], t);
  t.end();
});

test('#init throws error when the root class is not present', t => {
  const mockAdapter = td.object(MDCSimpleMenuFoundation.defaultAdapter);
  td.when(mockAdapter.hasClass('mdc-simple-menu')).thenReturn(false);

  const foundation = new MDCSimpleMenuFoundation(mockAdapter);
  t.throws(() => foundation.init());
  t.end();
});

test('#init throws error when the necessary DOM is not present', t => {
  const mockAdapter = td.object(MDCSimpleMenuFoundation.defaultAdapter);
  td.when(mockAdapter.hasClass('mdc-simple-menu')).thenReturn(true);
  td.when(mockAdapter.hasNecessaryDom()).thenReturn(false);

  const foundation = new MDCSimpleMenuFoundation(mockAdapter);
  t.throws(() => foundation.init());
  t.end();
});

testFoundation('#open adds the animation class to start an animation', t => {
  const {foundation, mockAdapter, mockRaf} = t.data;

  foundation.open();
  mockRaf.flush();
  mockRaf.flush();
  t.doesNotThrow(() => td.verify(mockAdapter.addClass('mdc-simple-menu--animating')));
  t.end();
});

testFoundation('#open adds the open class to the menu', t => {
  const {foundation, mockAdapter, mockRaf} = t.data;
  td.when(mockAdapter.hasClass('mdc-simple-menu--open-from-bottom-right')).thenReturn(true);

  foundation.open();
  mockRaf.flush();
  mockRaf.flush();
  t.doesNotThrow(() => td.verify(mockAdapter.addClass('mdc-simple-menu--open')));
  t.end();
});

testFoundation('#open removes the animation class at the end of the animation', t => {
  const {foundation, mockAdapter, mockRaf} = t.data;
  const {now} = window.performance;
  const mockNow = td.func('window.performance.now');
  window.performance.now = mockNow;

  td.when(mockNow()).thenReturn(0);
  td.when(mockAdapter.hasClass('mdc-simple-menu--open-from-top-right')).thenReturn(true);

  foundation.open();
  mockRaf.flush();
  mockRaf.flush();
  t.doesNotThrow(() => td.verify(mockAdapter.addClass('mdc-simple-menu--animating')), 'sanity check');

  td.when(mockNow()).thenReturn(500);
  mockRaf.flush();
  t.doesNotThrow(() => td.verify(mockAdapter.removeClass('mdc-simple-menu--animating')));

  window.performance.now = now;
  t.end();
});

testFoundation('#open focuses the menu at the end of the animation', t => {
  const {foundation, mockAdapter, mockRaf} = t.data;
  const {now} = window.performance;
  const mockNow = td.func('window.performance.now');
  window.performance.now = mockNow;

  td.when(mockNow()).thenReturn(0);

  foundation.open();
  mockRaf.flush();
  mockRaf.flush();

  td.when(mockNow()).thenReturn(500);
  mockRaf.flush();
  t.doesNotThrow(() => td.verify(mockAdapter.focus()));

  window.performance.now = now;
  t.end();
});

testFoundation('#open anchors the menu on the top left in LTR, given enough room', t => {
  const {foundation, mockAdapter, mockRaf} = t.data;
  const {now} = window.performance;
  const mockNow = td.func('window.performance.now');
  window.performance.now = mockNow;

  td.when(mockAdapter.hasAnchor()).thenReturn(true);
  td.when(mockAdapter.isRtl()).thenReturn(false);
  td.when(mockAdapter.getInnerDimensions()).thenReturn({height: 200, width: 100});
  td.when(mockAdapter.getWindowDimensions()).thenReturn({height: 1000, width: 1000});
  td.when(mockAdapter.getAnchorDimensions()).thenReturn({
    height: 20, width: 40, top: 20, bottom: 40, left: 20, right: 60
  });
  td.when(mockNow()).thenReturn(0);

  foundation.open();
  mockRaf.flush();
  mockRaf.flush();

  td.when(mockNow()).thenReturn(500);
  mockRaf.flush();
  t.doesNotThrow(() => td.verify(mockAdapter.setTransformOrigin('top left')));
  t.doesNotThrow(() => td.verify(mockAdapter.setPosition({left: '0', top: '0'})));

  window.performance.now = now;
  t.end();
});

testFoundation('#open anchors the menu on the top right in LTR when close to the right edge', t => {
  const {foundation, mockAdapter, mockRaf} = t.data;
  const {now} = window.performance;
  const mockNow = td.func('window.performance.now');
  window.performance.now = mockNow;

  td.when(mockAdapter.hasAnchor()).thenReturn(true);
  td.when(mockAdapter.isRtl()).thenReturn(false);
  td.when(mockAdapter.getInnerDimensions()).thenReturn({height: 200, width: 100});
  td.when(mockAdapter.getWindowDimensions()).thenReturn({height: 1000, width: 1000});
  td.when(mockAdapter.getAnchorDimensions()).thenReturn({
    height: 20, width: 40, top: 20, bottom: 40, left: 950, right: 990
  });
  td.when(mockNow()).thenReturn(0);

  foundation.open();
  mockRaf.flush();
  mockRaf.flush();

  td.when(mockNow()).thenReturn(500);
  mockRaf.flush();
  t.doesNotThrow(() => td.verify(mockAdapter.setTransformOrigin('top right')));
  t.doesNotThrow(() => td.verify(mockAdapter.setPosition({right: '0', top: '0'})));

  window.performance.now = now;
  t.end();
});

testFoundation('#open anchors the menu on the top right in RTL, given enough room', t => {
  const {foundation, mockAdapter, mockRaf} = t.data;
  const {now} = window.performance;
  const mockNow = td.func('window.performance.now');
  window.performance.now = mockNow;

  td.when(mockAdapter.hasAnchor()).thenReturn(true);
  td.when(mockAdapter.isRtl()).thenReturn(true);
  td.when(mockAdapter.getInnerDimensions()).thenReturn({height: 200, width: 100});
  td.when(mockAdapter.getWindowDimensions()).thenReturn({height: 1000, width: 1000});
  td.when(mockAdapter.getAnchorDimensions()).thenReturn({
    height: 20, width: 40, top: 20, bottom: 40, left: 500, right: 540
  });
  td.when(mockNow()).thenReturn(0);

  foundation.open();
  mockRaf.flush();
  mockRaf.flush();

  td.when(mockNow()).thenReturn(500);
  mockRaf.flush();
  t.doesNotThrow(() => td.verify(mockAdapter.setTransformOrigin('top right')));
  t.doesNotThrow(() => td.verify(mockAdapter.setPosition({right: '0', top: '0'})));

  window.performance.now = now;
  t.end();
});

testFoundation('#open anchors the menu on the top left in RTL when close to the left edge', t => {
  const {foundation, mockAdapter, mockRaf} = t.data;
  const {now} = window.performance;
  const mockNow = td.func('window.performance.now');
  window.performance.now = mockNow;

  td.when(mockAdapter.hasAnchor()).thenReturn(true);
  td.when(mockAdapter.isRtl()).thenReturn(true);
  td.when(mockAdapter.getInnerDimensions()).thenReturn({height: 200, width: 100});
  td.when(mockAdapter.getWindowDimensions()).thenReturn({height: 1000, width: 1000});
  td.when(mockAdapter.getAnchorDimensions()).thenReturn({
    height: 20, width: 40, top: 20, bottom: 40, left: 10, right: 50
  });
  td.when(mockNow()).thenReturn(0);

  foundation.open();
  mockRaf.flush();
  mockRaf.flush();

  td.when(mockNow()).thenReturn(500);
  mockRaf.flush();
  t.doesNotThrow(() => td.verify(mockAdapter.setTransformOrigin('top left')));
  t.doesNotThrow(() => td.verify(mockAdapter.setPosition({left: '0', top: '0'})));

  window.performance.now = now;
  t.end();
});

testFoundation('#open anchors the menu on the bottom left in LTR when close to the bottom edge', t => {
  const {foundation, mockAdapter, mockRaf} = t.data;
  const {now} = window.performance;
  const mockNow = td.func('window.performance.now');
  window.performance.now = mockNow;

  td.when(mockAdapter.hasAnchor()).thenReturn(true);
  td.when(mockAdapter.isRtl()).thenReturn(false);
  td.when(mockAdapter.getInnerDimensions()).thenReturn({height: 200, width: 100});
  td.when(mockAdapter.getWindowDimensions()).thenReturn({height: 1000, width: 1000});
  td.when(mockAdapter.getAnchorDimensions()).thenReturn({
    height: 20, width: 40, top: 900, bottom: 920, left: 10, right: 50
  });
  td.when(mockNow()).thenReturn(0);

  foundation.open();
  mockRaf.flush();
  mockRaf.flush();

  td.when(mockNow()).thenReturn(500);
  mockRaf.flush();
  t.doesNotThrow(() => td.verify(mockAdapter.setTransformOrigin('bottom left')));
  t.doesNotThrow(() => td.verify(mockAdapter.setPosition({left: '0', bottom: '0'})));

  window.performance.now = now;
  t.end();
});

testFoundation('#close adds the animation class to start an animation', t => {
  const {foundation, mockAdapter, mockRaf} = t.data;

  foundation.close();
  mockRaf.flush();
  mockRaf.flush();
  t.doesNotThrow(() => td.verify(mockAdapter.addClass('mdc-simple-menu--animating')));
  t.end();
});

testFoundation('#close removes the open class from the menu', t => {
  const {foundation, mockAdapter, mockRaf} = t.data;
  td.when(mockAdapter.hasClass('mdc-simple-menu--open')).thenReturn(true);
  td.when(mockAdapter.hasClass('mdc-simple-menu--open-from-bottom-left')).thenReturn(true);

  foundation.close();
  mockRaf.flush();
  mockRaf.flush();
  t.doesNotThrow(() => td.verify(mockAdapter.removeClass('mdc-simple-menu--open')));
  t.end();
});

testFoundation('#close removes the animation class at the end of the animation', t => {
  const {foundation, mockAdapter, mockRaf} = t.data;
  const {now} = window.performance;
  const mockNow = td.func('window.performance.now');
  window.performance.now = mockNow;

  td.when(mockNow()).thenReturn(0);
  td.when(mockAdapter.hasClass('mdc-simple-menu--open')).thenReturn(true);
  td.when(mockAdapter.hasClass('mdc-simple-menu--open-from-bottom-right')).thenReturn(true);

  foundation.close();
  mockRaf.flush();
  mockRaf.flush();
  t.doesNotThrow(() => td.verify(mockAdapter.addClass('mdc-simple-menu--animating')), 'sanity check');

  td.when(mockNow()).thenReturn(500);
  mockRaf.flush();
  t.doesNotThrow(() => td.verify(mockAdapter.removeClass('mdc-simple-menu--animating')));

  window.performance.now = now;
  t.end();
});

test('#isOpen returns true when the menu is open', t => {
  const {foundation} = setupTest();

  foundation.open();
  t.true(foundation.isOpen());
  t.end();
});

test('#isOpen returns false when the menu is closed', t => {
  const {foundation} = setupTest();

  foundation.close();
  t.false(foundation.isOpen());
  t.end();
});

test('#isOpen returns true when the menu is initiated with the open class present', t => {
  const {foundation, mockAdapter} = setupTest();
  td.when(mockAdapter.hasClass('mdc-simple-menu--open')).thenReturn(true);

  foundation.init();
  t.true(foundation.isOpen());
  t.end();
});

test('#isOpen returns false when the menu is initiated without the open class present', t => {
  const {foundation, mockAdapter} = setupTest();
  td.when(mockAdapter.hasClass('mdc-simple-menu--open')).thenReturn(false);

  foundation.init();
  t.false(foundation.isOpen());
  t.end();
});

test('on click notifies user of selection after allowing time for selection UX to run', t => {
  const {foundation, mockAdapter} = setupTest();
  const handlers = captureHandlers(mockAdapter, 'registerInteractionHandler');
  const clock = lolex.install();
  const target = {};
  const expectedIndex = 2;
  td.when(mockAdapter.getIndexForEventTarget(target)).thenReturn(expectedIndex);

  foundation.init();
  handlers.click({target});
  t.doesNotThrow(
    () => td.verify(mockAdapter.notifySelected(td.matchers.anything()), {times: 0}),
    'No notification before delay for selection UX'
  );

  clock.tick(numbers.SELECTED_TRIGGER_DELAY);
  t.doesNotThrow(() => td.verify(mockAdapter.notifySelected({index: expectedIndex})));

  clock.uninstall();
  t.end();
});

test('on click closes the menu', t => {
  const {foundation, mockAdapter} = setupTest();
  const handlers = captureHandlers(mockAdapter, 'registerInteractionHandler');
  const clock = lolex.install();
  const raf = createMockRaf();
  const target = {};
  td.when(mockAdapter.getIndexForEventTarget(target)).thenReturn(0);

  foundation.init();
  handlers.click({target});
  clock.tick(numbers.SELECTED_TRIGGER_DELAY);
  raf.flush();
  t.doesNotThrow(() => td.verify(mockAdapter.removeClass(cssClasses.OPEN)));

  raf.restore();
  clock.uninstall();
  t.end();
});

test('on click does not trigger selected if non menu item clicked', t => {
  const {foundation, mockAdapter} = setupTest();
  const handlers = captureHandlers(mockAdapter, 'registerInteractionHandler');
  const clock = lolex.install();
  const target = {};
  td.when(mockAdapter.getIndexForEventTarget(target)).thenReturn(-1);

  foundation.init();
  handlers.click({target});
  clock.tick(numbers.SELECTED_TRIGGER_DELAY);
  t.doesNotThrow(() => td.verify(mockAdapter.notifySelected(td.matchers.anything()), {times: 0}));

  clock.uninstall();
  t.end();
});

test('on click does not trigger selected if selection is already queued up', t => {
  const {foundation, mockAdapter} = setupTest();
  const handlers = captureHandlers(mockAdapter, 'registerInteractionHandler');
  const clock = lolex.install();
  const target = {};
  td.when(mockAdapter.getIndexForEventTarget(target)).thenReturn(0, 1);

  foundation.init();
  handlers.click({target});
  handlers.click({target});
  clock.tick(numbers.SELECTED_TRIGGER_DELAY);
  t.doesNotThrow(() => td.verify(mockAdapter.notifySelected({index: 0}), {times: 1}));

  clock.uninstall();
  t.end();
});

test('on ctrl+spacebar keyup does nothing', t => {
  const {foundation, mockAdapter} = setupTest();
  const handlers = captureHandlers(mockAdapter, 'registerInteractionHandler');
  const target = {};
  const expectedIndex = 2;
  td.when(mockAdapter.getIndexForEventTarget(target)).thenReturn(expectedIndex);

  foundation.init();
  handlers.keyup({target, key: 'Space', ctrlKey: true});
  t.doesNotThrow(
    () => td.verify(mockAdapter.getIndexForEventTarget(target), {times: 0}),
    'Nothing is done on the item'
  );
  t.end();
});

test('on spacebar keyup notifies user of selection after allowing time for selection UX to run', t => {
  const {foundation, mockAdapter} = setupTest();
  const handlers = captureHandlers(mockAdapter, 'registerInteractionHandler');
  const clock = lolex.install();
  const target = {};
  const expectedIndex = 2;
  td.when(mockAdapter.getIndexForEventTarget(target)).thenReturn(expectedIndex);

  foundation.init();
  handlers.keyup({target, key: 'Space'});
  t.doesNotThrow(
    () => td.verify(mockAdapter.notifySelected(td.matchers.anything()), {times: 0}),
    'No notification before delay for selection UX'
  );

  clock.tick(numbers.SELECTED_TRIGGER_DELAY);
  t.doesNotThrow(() => td.verify(mockAdapter.notifySelected({index: expectedIndex})));

  clock.uninstall();
  t.end();
});

test('on spacebar keyup closes the menu', t => {
  const {foundation, mockAdapter} = setupTest();
  const handlers = captureHandlers(mockAdapter, 'registerInteractionHandler');
  const clock = lolex.install();
  const raf = createMockRaf();
  const target = {};
  td.when(mockAdapter.getIndexForEventTarget(target)).thenReturn(0);

  foundation.init();
  handlers.keyup({target, key: 'Space'});
  clock.tick(numbers.SELECTED_TRIGGER_DELAY);
  raf.flush();
  t.doesNotThrow(() => td.verify(mockAdapter.removeClass(cssClasses.OPEN)));

  raf.restore();
  clock.uninstall();
  t.end();
});

test('on spacebar keyup does not trigger selected if non menu item clicked', t => {
  const {foundation, mockAdapter} = setupTest();
  const handlers = captureHandlers(mockAdapter, 'registerInteractionHandler');
  const clock = lolex.install();
  const target = {};
  td.when(mockAdapter.getIndexForEventTarget(target)).thenReturn(-1);

  foundation.init();
  handlers.keyup({target, key: 'Space'});
  clock.tick(numbers.SELECTED_TRIGGER_DELAY);
  t.doesNotThrow(() => td.verify(mockAdapter.notifySelected(td.matchers.anything()), {times: 0}));

  clock.uninstall();
  t.end();
});

test('on spacebar keyup does not trigger selected if selection is already queued up', t => {
  const {foundation, mockAdapter} = setupTest();
  const handlers = captureHandlers(mockAdapter, 'registerInteractionHandler');
  const clock = lolex.install();
  const target = {};
  td.when(mockAdapter.getIndexForEventTarget(target)).thenReturn(0, 1);

  foundation.init();
  handlers.keyup({target, key: 'Space'});
  handlers.keyup({target, key: 'Space'});
  clock.tick(numbers.SELECTED_TRIGGER_DELAY);
  t.doesNotThrow(() => td.verify(mockAdapter.notifySelected({index: 0}), {times: 1}));

  clock.uninstall();
  t.end();
});

test('on spacebar keyup does works if DOM3 keyboard events are not supported', t => {
  const {foundation, mockAdapter} = setupTest();
  const handlers = captureHandlers(mockAdapter, 'registerInteractionHandler');
  const clock = lolex.install();
  const target = {};
  td.when(mockAdapter.getIndexForEventTarget(target)).thenReturn(0);

  foundation.init();
  handlers.keyup({target, keyCode: 32});
  clock.tick(numbers.SELECTED_TRIGGER_DELAY);
  t.doesNotThrow(() => td.verify(mockAdapter.notifySelected({index: 0})));

  clock.uninstall();
  t.end();
});

test('on enter keyup notifies user of selection after allowing time for selection UX to run', t => {
  const {foundation, mockAdapter} = setupTest();
  const handlers = captureHandlers(mockAdapter, 'registerInteractionHandler');
  const clock = lolex.install();
  const target = {};
  const expectedIndex = 2;
  td.when(mockAdapter.getIndexForEventTarget(target)).thenReturn(expectedIndex);

  foundation.init();
  handlers.keyup({target, key: 'Enter'});
  t.doesNotThrow(
    () => td.verify(mockAdapter.notifySelected(td.matchers.anything()), {times: 0}),
    'No notification before delay for selection UX'
  );

  clock.tick(numbers.SELECTED_TRIGGER_DELAY);
  t.doesNotThrow(() => td.verify(mockAdapter.notifySelected({index: expectedIndex})));

  clock.uninstall();
  t.end();
});

test('on enter keyup closes the menu', t => {
  const {foundation, mockAdapter} = setupTest();
  const handlers = captureHandlers(mockAdapter, 'registerInteractionHandler');
  const clock = lolex.install();
  const raf = createMockRaf();
  const target = {};
  td.when(mockAdapter.getIndexForEventTarget(target)).thenReturn(0);

  foundation.init();
  handlers.keyup({target, key: 'Enter'});
  clock.tick(numbers.SELECTED_TRIGGER_DELAY);
  raf.flush();
  t.doesNotThrow(() => td.verify(mockAdapter.removeClass(cssClasses.OPEN)));

  raf.restore();
  clock.uninstall();
  t.end();
});

test('on enter keyup does not trigger selected if non menu item clicked', t => {
  const {foundation, mockAdapter} = setupTest();
  const handlers = captureHandlers(mockAdapter, 'registerInteractionHandler');
  const clock = lolex.install();
  const target = {};
  td.when(mockAdapter.getIndexForEventTarget(target)).thenReturn(-1);

  foundation.init();
  handlers.keyup({target, key: 'Enter'});
  clock.tick(numbers.SELECTED_TRIGGER_DELAY);
  t.doesNotThrow(() => td.verify(mockAdapter.notifySelected(td.matchers.anything()), {times: 0}));

  clock.uninstall();
  t.end();
});

test('on enter keyup does not trigger selected if selection is already queued up', t => {
  const {foundation, mockAdapter} = setupTest();
  const handlers = captureHandlers(mockAdapter, 'registerInteractionHandler');
  const clock = lolex.install();
  const target = {};
  td.when(mockAdapter.getIndexForEventTarget(target)).thenReturn(0, 1);

  foundation.init();
  handlers.keyup({target, key: 'Enter'});
  handlers.keyup({target, key: 'Enter'});
  clock.tick(numbers.SELECTED_TRIGGER_DELAY);
  t.doesNotThrow(() => td.verify(mockAdapter.notifySelected({index: 0}), {times: 1}));

  clock.uninstall();
  t.end();
});

test('on enter keyup does works if DOM3 keyboard events are not supported', t => {
  const {foundation, mockAdapter} = setupTest();
  const handlers = captureHandlers(mockAdapter, 'registerInteractionHandler');
  const clock = lolex.install();
  const target = {};
  td.when(mockAdapter.getIndexForEventTarget(target)).thenReturn(0);

  foundation.init();
  handlers.keyup({target, keyCode: 13});
  clock.tick(numbers.SELECTED_TRIGGER_DELAY);
  t.doesNotThrow(() => td.verify(mockAdapter.notifySelected({index: 0})));

  clock.uninstall();
  t.end();
});

test('on escape keyup closes the menu and sends cancel event', t => {
  const {foundation, mockAdapter} = setupTest();
  const handlers = captureHandlers(mockAdapter, 'registerInteractionHandler');
  const clock = lolex.install();
  const raf = createMockRaf();
  const target = {};
  td.when(mockAdapter.getIndexForEventTarget(target)).thenReturn(0);

  foundation.init();
  handlers.keyup({target, key: 'Escape'});
  clock.tick(numbers.SELECTED_TRIGGER_DELAY);
  raf.flush();
  t.doesNotThrow(() => td.verify(mockAdapter.removeClass(cssClasses.OPEN)));
  t.doesNotThrow(() => td.verify(mockAdapter.notifyCancel()));

  raf.restore();
  clock.uninstall();
  t.end();
});

test('on Ctrl+Tab keydown does nothing', t => {
  const {foundation, mockAdapter} = setupTest();
  const handlers = captureHandlers(mockAdapter, 'registerInteractionHandler');
  const target = {};
  td.when(mockAdapter.getNumberOfItems()).thenReturn(3);
  td.when(mockAdapter.getFocusedItemIndex()).thenReturn(2);

  foundation.init();
  handlers.keydown({target, key: 'Tab', ctrlKey: true, preventDefault: () => {}});
  t.doesNotThrow(
    () => td.verify(mockAdapter.getIndexForEventTarget(target), {times: 0}),
    'Nothing is done on the item'
  );

  t.end();
});

test('on Tab keydown on the last element, it moves to the first', t => {
  const {foundation, mockAdapter} = setupTest();
  const handlers = captureHandlers(mockAdapter, 'registerInteractionHandler');
  const clock = lolex.install();
  const raf = createMockRaf();
  const target = {};
  td.when(mockAdapter.getNumberOfItems()).thenReturn(3);
  td.when(mockAdapter.getFocusedItemIndex()).thenReturn(2);

  foundation.init();
  handlers.keydown({target, key: 'Tab', preventDefault: () => {}});
  clock.tick(numbers.SELECTED_TRIGGER_DELAY);
  raf.flush();
  t.doesNotThrow(() => td.verify(mockAdapter.focusItemAtIndex(0)));

  raf.restore();
  clock.uninstall();
  t.end();
});

test('on Shift+Tab keydown on the first element, it moves to the last', t => {
  const {foundation, mockAdapter} = setupTest();
  const handlers = captureHandlers(mockAdapter, 'registerInteractionHandler');
  const clock = lolex.install();
  const raf = createMockRaf();
  const target = {};
  td.when(mockAdapter.getNumberOfItems()).thenReturn(3);
  td.when(mockAdapter.getFocusedItemIndex()).thenReturn(0);

  foundation.init();
  handlers.keydown({target, key: 'Tab', shiftKey: true, preventDefault: () => {}});
  clock.tick(numbers.SELECTED_TRIGGER_DELAY);
  raf.flush();
  t.doesNotThrow(() => td.verify(mockAdapter.focusItemAtIndex(2)));

  raf.restore();
  clock.uninstall();
  t.end();
});

test('on ArrowDown keydown on the last element, it moves to the first', t => {
  const {foundation, mockAdapter} = setupTest();
  const handlers = captureHandlers(mockAdapter, 'registerInteractionHandler');
  const clock = lolex.install();
  const raf = createMockRaf();
  const target = {};
  td.when(mockAdapter.getNumberOfItems()).thenReturn(3);
  td.when(mockAdapter.getFocusedItemIndex()).thenReturn(2);

  foundation.init();
  handlers.keydown({target, key: 'ArrowDown', preventDefault: () => {}});
  clock.tick(numbers.SELECTED_TRIGGER_DELAY);
  raf.flush();
  t.doesNotThrow(() => td.verify(mockAdapter.focusItemAtIndex(0)));

  raf.restore();
  clock.uninstall();
  t.end();
});

test('on ArrowDown keydown on the first element, it moves to the second', t => {
  const {foundation, mockAdapter} = setupTest();
  const handlers = captureHandlers(mockAdapter, 'registerInteractionHandler');
  const clock = lolex.install();
  const raf = createMockRaf();
  const target = {};
  td.when(mockAdapter.getNumberOfItems()).thenReturn(3);
  td.when(mockAdapter.getFocusedItemIndex()).thenReturn(0);

  foundation.init();
  handlers.keydown({target, key: 'ArrowDown', preventDefault: () => {}});
  clock.tick(numbers.SELECTED_TRIGGER_DELAY);
  raf.flush();
  t.doesNotThrow(() => td.verify(mockAdapter.focusItemAtIndex(1)));

  raf.restore();
  clock.uninstall();
  t.end();
});

test('on ArrowDown keydown prevents default on the event', t => {
  const {foundation, mockAdapter} = setupTest();
  const handlers = captureHandlers(mockAdapter, 'registerInteractionHandler');
  const clock = lolex.install();
  const raf = createMockRaf();
  const target = {};
  const preventDefault = td.func('event.preventDefault');
  td.when(mockAdapter.getNumberOfItems()).thenReturn(3);
  td.when(mockAdapter.getFocusedItemIndex()).thenReturn(0);

  foundation.init();
  handlers.keydown({target, key: 'ArrowDown', preventDefault});
  clock.tick(numbers.SELECTED_TRIGGER_DELAY);
  raf.flush();
  t.doesNotThrow(() => td.verify(preventDefault()));

  raf.restore();
  clock.uninstall();
  t.end();
});

test('on ArrowUp keydown on the first element, it moves to the last', t => {
  const {foundation, mockAdapter} = setupTest();
  const handlers = captureHandlers(mockAdapter, 'registerInteractionHandler');
  const clock = lolex.install();
  const raf = createMockRaf();
  const target = {};
  td.when(mockAdapter.getNumberOfItems()).thenReturn(3);
  td.when(mockAdapter.getFocusedItemIndex()).thenReturn(0);

  foundation.init();
  handlers.keydown({target, key: 'ArrowUp', preventDefault: () => {}});
  clock.tick(numbers.SELECTED_TRIGGER_DELAY);
  raf.flush();
  t.doesNotThrow(() => td.verify(mockAdapter.focusItemAtIndex(2)));

  raf.restore();
  clock.uninstall();
  t.end();
});

test('on ArrowUp keydown on the last element, it moves to the previous', t => {
  const {foundation, mockAdapter} = setupTest();
  const handlers = captureHandlers(mockAdapter, 'registerInteractionHandler');
  const clock = lolex.install();
  const raf = createMockRaf();
  const target = {};
  td.when(mockAdapter.getNumberOfItems()).thenReturn(3);
  td.when(mockAdapter.getFocusedItemIndex()).thenReturn(2);

  foundation.init();
  handlers.keydown({target, key: 'ArrowUp', preventDefault: () => {}});
  clock.tick(numbers.SELECTED_TRIGGER_DELAY);
  raf.flush();
  t.doesNotThrow(() => td.verify(mockAdapter.focusItemAtIndex(1)));

  raf.restore();
  clock.uninstall();
  t.end();
});

test('on ArrowUp keydown prevents default on the event', t => {
  const {foundation, mockAdapter} = setupTest();
  const handlers = captureHandlers(mockAdapter, 'registerInteractionHandler');
  const clock = lolex.install();
  const raf = createMockRaf();
  const target = {};
  const preventDefault = td.func('event.preventDefault');
  td.when(mockAdapter.getNumberOfItems()).thenReturn(3);
  td.when(mockAdapter.getFocusedItemIndex()).thenReturn(2);

  foundation.init();
  handlers.keydown({target, key: 'ArrowUp', preventDefault});
  clock.tick(numbers.SELECTED_TRIGGER_DELAY);
  raf.flush();
  t.doesNotThrow(() => td.verify(preventDefault()));

  raf.restore();
  clock.uninstall();
  t.end();
});

test('on spacebar keydown prevents default on the event', t => {
  const {foundation, mockAdapter} = setupTest();
  const handlers = captureHandlers(mockAdapter, 'registerInteractionHandler');
  const clock = lolex.install();
  const raf = createMockRaf();
  const target = {};
  const preventDefault = td.func('event.preventDefault');
  td.when(mockAdapter.getNumberOfItems()).thenReturn(3);
  td.when(mockAdapter.getFocusedItemIndex()).thenReturn(2);

  foundation.init();
  handlers.keydown({target, key: 'Space', preventDefault});
  clock.tick(numbers.SELECTED_TRIGGER_DELAY);
  raf.flush();
  t.doesNotThrow(() => td.verify(preventDefault()));

  raf.restore();
  clock.uninstall();
  t.end();
});

testFoundation('should cancel animation after destroy', t => {
  const {foundation, mockAdapter, mockRaf} = t.data;
  foundation.init();
  mockRaf.flush();
  foundation.open();
  foundation.destroy();
  mockRaf.flush();
  mockRaf.flush();

  t.doesNotThrow(() => td.verify(mockAdapter.setScale(td.matchers.anything(), td.matchers.anything()), {times: 0}));
  t.end();
});
