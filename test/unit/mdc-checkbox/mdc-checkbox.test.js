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
import bel from 'bel';
import domEvents from 'dom-events';
import td from 'testdouble';

import {supportsCssVariables} from '../../../packages/mdc-ripple/util';
import {createMockRaf} from '../helpers/raf';
import {MDCCheckbox} from '../../../packages/mdc-checkbox';
import {strings} from '../../../packages/mdc-checkbox/constants';
import {getCorrectEventName} from '../../../packages/mdc-animation';
import {getMatchesProperty} from '../../../packages/mdc-ripple/util';

function getFixture() {
  return bel`
    <div class="mdc-checkbox">
      <input type="checkbox"
             class="mdc-checkbox__native-control"
             id="my-checkbox"
             aria-labelledby="my-checkbox-label"/>
      <div class="mdc-checkbox__frame"></div>
      <div class="mdc-checkbox__background">
        <svg version="1.1"
             class="mdc-checkbox__checkmark"
             viewBox="0 0 24 24">
          <path class="mdc-checkbox__checkmark__path"
                fill="none"
                stroke="white"
                d="M4.1,12.7 9,17.6 20.3,6.3"/>
        </svg>
        <div class="mdc-checkbox__mixedmark"></div>
      </div>
    </div>
  `;
}

function setupTest() {
  const root = getFixture();
  const component = new MDCCheckbox(root);
  return {root, component};
}

if (supportsCssVariables(window)) {
  test('#constructor initializes the root element with a ripple', (t) => {
    const raf = createMockRaf();
    const {root} = setupTest();
    raf.flush();
    t.true(root.classList.contains('mdc-ripple-upgraded'));
    raf.restore();
    t.end();
  });

  test('#destroy removes the ripple', (t) => {
    const raf = createMockRaf();
    const {root, component} = setupTest();
    raf.flush();
    component.destroy();
    raf.flush();
    t.false(root.classList.contains('mdc-ripple-upgraded'));
    raf.restore();
    t.end();
  });

  test('(regression) activates ripple on keydown when the input element surface is active', (t) => {
    const raf = createMockRaf();
    const {root} = setupTest();
    const input = root.querySelector('input');
    raf.flush();

    const fakeMatches = td.func('.matches');
    td.when(fakeMatches(':active')).thenReturn(true);
    input[getMatchesProperty(HTMLElement.prototype)] = fakeMatches;

    t.true(root.classList.contains('mdc-ripple-upgraded'));
    domEvents.emit(input, 'keydown');
    raf.flush();

    t.true(root.classList.contains('mdc-ripple-upgraded--background-active'));
    raf.restore();
    t.end();
  });
}

test('attachTo initializes and returns a MDCCheckbox instance', (t) => {
  t.true(MDCCheckbox.attachTo(getFixture()) instanceof MDCCheckbox);
  t.end();
});

test('get/set checked updates the checked property on the native checkbox element', (t) => {
  const {root, component} = setupTest();
  const cb = root.querySelector(strings.NATIVE_CONTROL_SELECTOR);
  component.checked = true;
  t.true(cb.checked);
  t.equal(component.checked, cb.checked);
  t.end();
});

test('get/set indeterminate updates the indeterminate property on the native checkbox element', (t) => {
  const {root, component} = setupTest();
  const cb = root.querySelector(strings.NATIVE_CONTROL_SELECTOR);
  component.indeterminate = true;
  t.true(cb.indeterminate);
  t.equal(component.indeterminate, cb.indeterminate);
  t.end();
});

test('get/set disabled updates the indeterminate property on the native checkbox element', (t) => {
  const {root, component} = setupTest();
  const cb = root.querySelector(strings.NATIVE_CONTROL_SELECTOR);
  component.disabled = true;
  t.true(cb.disabled);
  t.equal(component.disabled, cb.disabled);
  t.end();
});

test('adapter#addClass adds a class to the root element', (t) => {
  const {root, component} = setupTest();
  component.getDefaultFoundation().adapter_.addClass('foo');
  t.true(root.classList.contains('foo'));
  t.end();
});

test('adapter#removeClass removes a class from the root element', (t) => {
  const {root, component} = setupTest();
  root.classList.add('foo');
  component.getDefaultFoundation().adapter_.removeClass('foo');
  t.false(root.classList.contains('foo'));
  t.end();
});

test('adapter#registerAnimationEndHandler adds an animation end event listener on the root element', (t) => {
  const {root, component} = setupTest();
  const handler = td.func('animationEndHandler');
  component.getDefaultFoundation().adapter_.registerAnimationEndHandler(handler);
  domEvents.emit(root, getCorrectEventName(window, 'animationend'));

  t.doesNotThrow(() => td.verify(handler(td.matchers.anything())));
  t.end();
});

test('adapter#deregisterAnimationEndHandler removes an animation end event listener on the root el', (t) => {
  const {root, component} = setupTest();
  const handler = td.func('animationEndHandler');
  const animEndEvtName = getCorrectEventName(window, 'animationend');
  root.addEventListener(animEndEvtName, handler);

  component.getDefaultFoundation().adapter_.deregisterAnimationEndHandler(handler);
  domEvents.emit(root, animEndEvtName);

  t.doesNotThrow(() => td.verify(handler(td.matchers.anything()), {times: 0}));
  t.end();
});

test('adapter#registerChangeHandler adds a change event listener to the native checkbox element', (t) => {
  const {root, component} = setupTest();
  const nativeCb = root.querySelector(strings.NATIVE_CONTROL_SELECTOR);
  const handler = td.func('changeHandler');

  component.getDefaultFoundation().adapter_.registerChangeHandler(handler);
  domEvents.emit(nativeCb, 'change');

  t.doesNotThrow(() => td.verify(handler(td.matchers.anything())));
  t.end();
});

test('adapter#deregisterChangeHandler adds a change event listener to the native checkbox element', (t) => {
  const {root, component} = setupTest();
  const nativeCb = root.querySelector(strings.NATIVE_CONTROL_SELECTOR);
  const handler = td.func('changeHandler');
  nativeCb.addEventListener('change', handler);

  component.getDefaultFoundation().adapter_.deregisterChangeHandler(handler);
  domEvents.emit(nativeCb, 'change');

  t.doesNotThrow(() => td.verify(handler(td.matchers.anything()), {times: 0}));
  t.end();
});

test('adapter#getNativeControl returns the native checkbox element', (t) => {
  const {root, component} = setupTest();
  const nativeCb = root.querySelector(strings.NATIVE_CONTROL_SELECTOR);
  t.equal(component.getDefaultFoundation().adapter_.getNativeControl(), nativeCb);
  t.end();
});

test('adapter#forceLayout touches "offsetWidth" on the root in order to force layout', (t) => {
  const {root, component} = setupTest();
  const mockGetter = td.func('.offsetWidth');
  Object.defineProperty(root, 'offsetWidth', {
    get: mockGetter,
    set() {},
    enumerable: false,
    configurable: true,
  });

  component.getDefaultFoundation().adapter_.forceLayout();
  t.doesNotThrow(() => td.verify(mockGetter()));
  t.end();
});

test('adapter#isAttachedToDOM returns true when root is attached to DOM', (t) => {
  const {root, component} = setupTest();
  document.body.appendChild(root);
  t.true(component.getDefaultFoundation().adapter_.isAttachedToDOM());
  document.body.removeChild(root);
  t.end();
});

test('adapter#isAttachedToDOM returns false when root is not attached to DOM', (t) => {
  const {component} = setupTest();
  t.false(component.getDefaultFoundation().adapter_.isAttachedToDOM());
  t.end();
});
