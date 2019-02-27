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
import bel from 'bel';
import domEvents from 'dom-events';
import td from 'testdouble';
import {install as installClock} from '../helpers/clock';
import {supportsCssVariables} from '../../../packages/mdc-ripple/util';

import {MDCRipple, MDCRippleFoundation} from '../../../packages/mdc-ripple/index';
import {MDCSelect} from '../../../packages/mdc-select/index';
import {cssClasses, strings} from '../../../packages/mdc-select/constants';
import {MDCNotchedOutline} from '../../../packages/mdc-notched-outline/index';
import {MDCSelectIcon} from '../../../packages/mdc-select/icon/index';
import {MDCSelectHelperTextFoundation} from '../../../packages/mdc-select/helper-text/index';

const LABEL_WIDTH = 100;

class FakeLabel {
  constructor() {
    this.float = td.func('label.float');
    this.getWidth = td.func('label.getWidth');

    td.when(this.getWidth()).thenReturn(LABEL_WIDTH);
  }
}

class FakeBottomLine {
  constructor() {
    this.activate = td.func('bottomLine.activate');
    this.deactivate = td.func('bottomLine.deactivate');
    this.setRippleCenter = td.func('bottomLine.setRippleCenter');
  }
}

class FakeOutline {
  constructor() {
    this.destroy = td.func('.destroy');
    this.notch = td.func('.notch');
    this.closeNotch = td.func('.notch');
  }
}

class FakeIcon {
  constructor() {
    this.destroy = td.func('.destroy');
  }
}

class FakeHelperText {
  constructor() {
    this.destroy = td.func('.destroy');
  }
}

function getFixture() {
  return bel`
    <div class="mdc-select">
     <i class="material-icons mdc-select__icon">code</i>
     <select class="mdc-select__native-control">
        <option value="" disabled selected></option>
        <option value="orange">
          Orange
        </option>
        <option value="apple">
          Apple
        </option>
      </select>
      <label class="mdc-floating-label">Pick a Food Group</label>
      <div class="mdc-line-ripple"></div>
    </div>
\  `;
}

function getOutlineFixture() {
  return bel`
    <div class="mdc-select mdc-select--outlined">
      <i class="material-icons mdc-select__icon">code</i>
      <select class="mdc-select__native-control">
        <option value="orange">
          Orange
        </option>
        <option value="apple">
          Apple
        </option>
      </select>
      <div class="mdc-notched-outline">
        <div class="mdc-notched-outline__leading"></div>
        <div class="mdc-notched-outline__notch">
          <label class="mdc-floating-label">Pick a Food Group</label>
        </div>
        <div class="mdc-notched-outline__trailing"></div>
      </div>
    </div>
  `;
}

function getHelperTextFixture(root = getFixture()) {
  const containerDiv = document.createElement('div');
  root.querySelector('.mdc-select__native-control').setAttribute('aria-controls', 'test-helper-text');
  containerDiv.appendChild(root);
  containerDiv.appendChild(bel`<p class="mdc-select-helper-text" id="test-helper-text">Hello World</p>`);
  return containerDiv;
}

suite('MDCSelect');

test('attachTo returns a component instance', () => {
  assert.isOk(MDCSelect.attachTo(getFixture()) instanceof MDCSelect);
});

test('constructor throws an error when required elements are missing', () => {
  assert.throws(() => new MDCSelect(bel`<div class="mdc-select"></div>`), 'Missing required element');
});

function setupTest(hasOutline = false, hasLabel = true, hasHelperText = false) {
  const bottomLine = new FakeBottomLine();
  const label = new FakeLabel();
  const fixture = hasOutline ? getOutlineFixture() : getFixture();
  const container = hasHelperText ? getHelperTextFixture(fixture) : null;
  const nativeControl = fixture.querySelector('.mdc-select__native-control');
  const labelEl = fixture.querySelector('.mdc-floating-label');
  const bottomLineEl = fixture.querySelector('.mdc-line-ripple');
  const outline = new FakeOutline();
  const icon = new FakeIcon();
  const helperText = new FakeHelperText();

  if (!hasLabel) {
    labelEl.parentElement.removeChild(labelEl);
  }

  if (container) {
    document.body.appendChild(container);
  }

  const component = new MDCSelect(fixture, /* foundation */ undefined,
    () => label, () => bottomLine, () => outline, /* MDCMenu */ undefined, () => icon, () => helperText);

  return {fixture, nativeControl, label, labelEl, bottomLine, bottomLineEl, component, outline, icon, helperText,
    container};
}

test('#get/setSelectedIndex', () => {
  const {component} = setupTest();
  assert.equal(component.selectedIndex, 0);
  component.selectedIndex = 1;
  assert.equal(component.selectedIndex, 1);
});

test('#get/set disabled', () => {
  const {component} = setupTest();
  assert.isFalse(component.disabled);
  component.disabled = true;
  assert.isTrue(component.disabled);
});

test('#get/set required', () => {
  const {component, nativeControl} = setupTest();
  assert.isFalse(component.required);

  component.required = true;
  assert.isTrue(component.required);
  assert.isTrue(nativeControl.required);
});

test('#get value', () => {
  const {component} = setupTest();
  assert.equal(component.value, '');
  component.selectedIndex = 2;
  assert.equal(component.value, 'apple');
  component.selectedIndex = 1;
  assert.equal(component.value, 'orange');
});

test('#set value sets the value on the <select>', () => {
  const {component, nativeControl} = setupTest();
  component.value = 'orange';
  assert.equal(nativeControl.value, 'orange');
});

test('#set value calls foundation.handleChange', () => {
  const {component} = setupTest();
  component.foundation_.handleChange = td.func();
  component.value = 'orange';
  td.verify(component.foundation_.handleChange(true), {times: 1});
});

test('#set selectedIndex calls foundation.handleChange', () => {
  const {component} = setupTest();
  component.foundation_.handleChange = td.func();
  component.selectedIndex = 1;
  td.verify(component.foundation_.handleChange(true), {times: 1});
});

test('#set disabled calls foundation.setDisabled', () => {
  const {component} = setupTest();
  component.foundation_.setDisabled = td.func();
  component.disabled = true;
  td.verify(component.foundation_.setDisabled(true), {times: 1});
});

test('#set leadingIconAriaLabel calls foundation.setLeadingIconAriaLabel', () => {
  const {component} = setupTest();
  component.foundation_.setLeadingIconAriaLabel = td.func();
  component.leadingIconAriaLabel = true;
  td.verify(component.foundation_.setLeadingIconAriaLabel(true), {times: 1});
});

test('#set leadingIconContent calls foundation.setLeadingIconAriaLabel', () => {
  const {component} = setupTest();
  component.foundation_.setLeadingIconContent = td.func();
  component.leadingIconContent = 'hello_world';
  td.verify(component.foundation_.setLeadingIconContent('hello_world'), {times: 1});
});

test('#set helperTextContent calls foundation.setHelperTextContent', () => {
  const {component} = setupTest();
  component.foundation_.setHelperTextContent = td.func();
  component.helperTextContent = 'hello_world';
  td.verify(component.foundation_.setHelperTextContent('hello_world'), {times: 1});
});

test(`#initialize does not add the ${cssClasses.WITH_LEADING_ICON} class if there is no leading icon`, () => {
  const fixture = bel`
    <div class="mdc-select">
      <select class="mdc-select__native-control">
        <option value="orange">
          Orange
        </option>
        <option value="apple" selected>
          Apple
        </option>
      </select>
      <label class="mdc-floating-label">Pick a Food Group</label>
      <div class="mdc-line-ripple"></div>
    </div>
  `;
  const component = new MDCSelect(fixture, /* foundation */ undefined);
  assert.isFalse(fixture.classList.contains(cssClasses.WITH_LEADING_ICON));
  component.destroy();
});

test('#initialSyncWithDOM sets the selected index if an option has the selected attr', () => {
  const fixture = bel`
    <div class="mdc-select">
      <select class="mdc-select__native-control">
        <option value="orange">
          Orange
        </option>
        <option value="apple" selected>
          Apple
        </option>
      </select>
      <label class="mdc-floating-label">Pick a Food Group</label>
      <div class="mdc-line-ripple"></div>
    </div>
  `;
  const component = new MDCSelect(fixture, /* foundation */ undefined);
  assert.equal(component.selectedIndex, 1);
});

test('#initialSyncWithDOM disables the select if the disabled attr is found on the <select>', () => {
  const fixture = bel`
    <div class="mdc-select">
      <select class="mdc-select__native-control" disabled>
        <option value="orange">
          Orange
        </option>
        <option value="apple" selected>
          Apple
        </option>
      </select>
      <label class="mdc-floating-label"></label>
      <div class="mdc-line-ripple"></div>
    </div>
  `;
  const component = new MDCSelect(fixture);
  assert.isTrue(component.disabled);
});

test('adapter#addClass adds a class to the root element', () => {
  const {component, fixture} = setupTest();
  component.getDefaultFoundation().adapter_.addClass('foo');
  assert.isTrue(fixture.classList.contains('foo'));
});

test('adapter#removeClass removes a class from the root element', () => {
  const {component, fixture} = setupTest();
  fixture.classList.add('foo');
  component.getDefaultFoundation().adapter_.removeClass('foo');
  assert.isFalse(fixture.classList.contains('foo'));
});

test('adapter#hasClass returns true if a class exists on the root element', () => {
  const {component, fixture} = setupTest();
  fixture.classList.add('foo');
  assert.isTrue(component.getDefaultFoundation().adapter_.hasClass('foo'));
});

test('adapter_#floatLabel does not throw error if label does not exist', () => {
  const fixture = bel`
    <div class="mdc-select">
      <select class="mdc-select__native-control">
        <option value="orange">
          Orange
        </option>
        <option value="apple" selected>
          Apple
        </option>
      </select>
      <div class="mdc-line-ripple"></div>
    </div>
  `;
  const component = new MDCSelect(fixture);
  assert.doesNotThrow(
    () => component.getDefaultFoundation().adapter_.floatLabel('foo'));
});

test('adapter#activateBottomLine and adapter.deactivateBottomLine ' +
  'does not throw error if bottomLine does not exist', () => {
  const fixture = bel`
    <div class="mdc-select">
      <select class="mdc-select__native-control">
        <option value="orange">
          Orange
        </option>
        <option value="apple" selected>
          Apple
        </option>
      </select>
      <label class="mdc-floating-label"></label>
    </div>
  `;
  const component = new MDCSelect(fixture);
  assert.doesNotThrow(
    () => component.getDefaultFoundation().adapter_.activateBottomLine());
  assert.doesNotThrow(
    () => component.getDefaultFoundation().adapter_.deactivateBottomLine());
});

test('adapter#setDisabled sets the select to be disabled', () => {
  const {component, nativeControl} = setupTest();
  const adapter = component.getDefaultFoundation().adapter_;
  assert.isFalse(nativeControl.disabled);
  adapter.setDisabled(true);
  assert.isTrue(nativeControl.disabled);
  adapter.setDisabled(false);
  assert.isFalse(nativeControl.disabled);
});

test('adapter#setSelectedIndex sets the select selected index to the index specified', () => {
  const {component, nativeControl} = setupTest();
  const adapter = component.getDefaultFoundation().adapter_;
  adapter.setSelectedIndex(1);
  assert.equal(nativeControl.selectedIndex, 1);
  adapter.setSelectedIndex(2);
  assert.equal(nativeControl.selectedIndex, 2);
});

test('adapter#notifyChange emits event with index and value', () => {
  const {component, nativeControl} = setupTest();
  nativeControl.options[0].selected = false;
  nativeControl.options[1].selected = true;

  let detail;
  component.listen(strings.CHANGE_EVENT, (event) => {
    detail = event.detail;
  });

  const value = nativeControl.options[1].value;
  component.getDefaultFoundation().adapter_.notifyChange(value);
  assert.isDefined(detail);
  assert.equal(detail.index, 1);
  assert.equal(detail.value, value);
});

test('instantiates ripple', function() {
  if (!supportsCssVariables(window, true)) {
    this.skip(); // eslint-disable-line no-invalid-this
    return;
  }

  const fixture = getFixture();
  const clock = installClock();

  const component = MDCSelect.attachTo(fixture);
  clock.runToFrame();

  assert.instanceOf(component.ripple, MDCRipple);
  assert.isTrue(fixture.classList.contains(MDCRippleFoundation.cssClasses.ROOT));
});

test(`#constructor instantiates an outline on the ${cssClasses.OUTLINE_SELECTOR} element if present`, () => {
  const root = getOutlineFixture();
  const component = new MDCSelect(root);
  assert.instanceOf(component.outline_, MDCNotchedOutline);
});

test('handles ripple focus properly', function() {
  if (!supportsCssVariables(window, true)) {
    this.skip(); // eslint-disable-line no-invalid-this
    return;
  }

  const fixture = getFixture();
  const clock = installClock();

  MDCSelect.attachTo(fixture);
  clock.runToFrame();

  const nativeControl = fixture.querySelector('.mdc-select__native-control');

  domEvents.emit(nativeControl, 'focus');
  clock.runToFrame();

  assert.isTrue(fixture.classList.contains(MDCRippleFoundation.cssClasses.BG_FOCUSED));
});

test('#destroy removes the ripple', function() {
  if (!supportsCssVariables(window, true)) {
    this.skip(); // eslint-disable-line no-invalid-this
    return;
  }

  const fixture = getFixture();
  const clock = installClock();

  const component = new MDCSelect(fixture);
  clock.runToFrame();

  assert.isTrue(fixture.classList.contains(MDCRippleFoundation.cssClasses.ROOT));
  component.destroy();
  clock.runToFrame();

  assert.isFalse(fixture.classList.contains(MDCRippleFoundation.cssClasses.ROOT));
});

test('#destroy cleans up the outline if present', () => {
  const {component, outline} = setupTest();
  component.outline_ = outline;
  component.destroy();
  td.verify(outline.destroy());
});

test(`does not instantiate ripple when ${cssClasses.OUTLINED} class is present`, () => {
  const hasOutline = true;
  const {component} = setupTest(hasOutline);
  assert.isUndefined(component.ripple);
});

test('adapter#floatLabel adds a class to the label', () => {
  const {component, label} = setupTest();

  component.getDefaultFoundation().adapter_.floatLabel('foo');
  td.verify(label.float('foo'));
});

test('adapter#activateBottomLine adds active class to the bottom line', () => {
  const {component, bottomLine} = setupTest();

  component.getDefaultFoundation().adapter_.activateBottomLine();
  td.verify(bottomLine.activate());
});

test('adapter#deactivateBottomLine removes active class from the bottom line', () => {
  const {component, bottomLine} = setupTest();

  component.getDefaultFoundation().adapter_.deactivateBottomLine();
  td.verify(bottomLine.deactivate());
});

test('adapter#notchOutline proxies labelWidth to the outline', () => {
  const hasOutline = true;
  const {component, outline} = setupTest(hasOutline);

  component.getDefaultFoundation().adapter_.notchOutline(LABEL_WIDTH);
  td.verify(outline.notch(LABEL_WIDTH), {times: 1});
});

test('adapter#notchOutline does not proxy values to the outline if it does not exist', () => {
  const hasOutline = false;
  const {component, outline} = setupTest(hasOutline);

  component.getDefaultFoundation().adapter_.notchOutline(LABEL_WIDTH);
  td.verify(outline.notch(LABEL_WIDTH), {times: 0});
});

test('adapter#getLabelWidth returns the width of the label', () => {
  const {component} = setupTest();
  assert.equal(component.getDefaultFoundation().adapter_.getLabelWidth(), LABEL_WIDTH);
});

test('adapter#getLabelWidth returns 0 if the label does not exist', () => {
  const hasOutline = true;
  const hasLabel = false;
  const {component} = setupTest(hasOutline, hasLabel);

  assert.equal(component.getDefaultFoundation().adapter_.getLabelWidth(), 0);
});

test(`adapter#setValid applies ${cssClasses.INVALID} properly`, () => {
  const hasOutline = false;
  const hasLabel = true;
  const {component, fixture} = setupTest(hasOutline, hasLabel);
  const adapter = component.getDefaultFoundation().adapter_;

  adapter.setValid(false);
  assert.isTrue(fixture.classList.contains(cssClasses.INVALID));

  adapter.setValid(true);
  assert.isFalse(fixture.classList.contains(cssClasses.INVALID));
});

test('change event triggers foundation.handleChange(true)', () => {
  const {component, nativeControl} = setupTest();
  component.foundation_.handleChange = td.func();
  domEvents.emit(nativeControl, 'change');
  td.verify(component.foundation_.handleChange(true), {times: 1});
});

test('focus event triggers foundation.handleFocus()', () => {
  const {component, nativeControl} = setupTest();
  component.foundation_.handleFocus = td.func();
  domEvents.emit(nativeControl, 'focus');
  td.verify(component.foundation_.handleFocus(), {times: 1});
});

test('blur event triggers foundation.handleBlur()', () => {
  const {component, nativeControl} = setupTest();
  component.foundation_.handleBlur = td.func();
  domEvents.emit(nativeControl, 'blur');
  td.verify(component.foundation_.handleBlur(), {times: 1});
});

test('#destroy removes the change handler', () => {
  const {component, nativeControl} = setupTest();
  component.foundation_.handleChange = td.func();
  component.destroy();
  domEvents.emit(nativeControl, 'change');
  td.verify(component.foundation_.handleChange(true), {times: 0});
});

test('#destroy removes the focus handler', () => {
  const {component, nativeControl} = setupTest();
  component.foundation_.handleFocus = td.func();
  component.destroy();
  domEvents.emit(nativeControl, 'focus');
  td.verify(component.foundation_.handleFocus(), {times: 0});
});

test('#destroy removes the blur handler', () => {
  const {component, nativeControl} = setupTest();
  component.foundation_.handleBlur = td.func();
  component.destroy();
  domEvents.emit(nativeControl, 'blur');
  td.verify(component.foundation_.handleBlur(), {times: 0});
});

test('mousedown on the select sets the line ripple origin', () => {
  const {bottomLine, fixture} = setupTest();
  const event = document.createEvent('MouseEvent');
  const clientX = 200;
  const clientY = 200;
  // IE11 mousedown event.
  event.initMouseEvent('mousedown', true, true, window, 0, 0, 0, clientX, clientY, false, false, false, false, 0, null);
  fixture.querySelector('select').dispatchEvent(event);

  td.verify(bottomLine.setRippleCenter(200), {times: 1});
});

test('mousedown on the select does nothing if the it does not have a lineRipple', () => {
  const hasOutline = true;
  const {bottomLine, fixture} = setupTest(hasOutline);
  const event = document.createEvent('MouseEvent');
  const clientX = 200;
  const clientY = 200;
  // IE11 mousedown event.
  event.initMouseEvent('mousedown', true, true, window, 0, 0, 0, clientX, clientY, false, false, false, false, 0, null);
  fixture.querySelector('select').dispatchEvent(event);

  td.verify(bottomLine.setRippleCenter(200), {times: 0});
});

test('#destroy removes the mousedown listener', () => {
  const {bottomLine, component, fixture} = setupTest();
  const event = document.createEvent('MouseEvent');
  const clientX = 200;
  const clientY = 200;

  component.destroy();
  // IE11 mousedown event.
  event.initMouseEvent('mousedown', true, true, window, 0, 0, 0, clientX, clientY, false, false, false, false, 0, null);
  fixture.querySelector('select').dispatchEvent(event);

  td.verify(bottomLine.setRippleCenter(200), {times: 0});
});

test('keydown is not added to the native select when initialized', () => {
  const {component, fixture} = setupTest();
  component.foundation_.handleKeydown = td.func();
  document.body.appendChild(fixture);
  domEvents.emit(fixture.querySelector('.mdc-select__native-control'), 'keydown');
  td.verify(component.foundation_.handleKeydown(td.matchers.anything()), {times: 0});
  document.body.removeChild(fixture);
});

test('#constructor instantiates a leading icon if an icon element is present', () => {
  const root = getFixture();
  const component = new MDCSelect(root);
  assert.instanceOf(component.leadingIcon_, MDCSelectIcon);
});

test('#constructor instantiates the helper text if present', () => {
  const hasLabel = true;
  const hasOutline = false;
  const hasHelperText = true;
  const {container, component} = setupTest(hasLabel, hasOutline, hasHelperText);

  assert.instanceOf(component.helperText_, FakeHelperText);
  document.body.removeChild(container);
});

test('#constructor instantiates the helper text and passes the helper text foundation to MDCSelectFoundation', () => {
  const root = getFixture();
  const container = getHelperTextFixture(root);
  document.body.appendChild(container);
  const component = new MDCSelect(root);
  assert.instanceOf(component.getDefaultFoundation().helperText_, MDCSelectHelperTextFoundation);
  document.body.removeChild(container);
});

test('#constructor does not instantiate the helper text if the aria-controls id does not match an element', () => {
  const containerDiv = getHelperTextFixture();
  containerDiv.querySelector('.mdc-select-helper-text').id = 'hello-world';
  document.body.appendChild(containerDiv);

  const component = new MDCSelect(containerDiv.querySelector('.mdc-select'));

  assert.isUndefined(component.helperText_);
  document.body.removeChild(containerDiv);
});

test('#destroy destroys the helper text if it exists', () => {
  const hasLabel = true;
  const hasOutline = false;
  const hasHelperText = true;
  const {container, helperText, component} = setupTest(hasLabel, hasOutline, hasHelperText);

  component.destroy();
  td.verify(helperText.destroy(), {times: 1});
  document.body.removeChild(container);
});

test(`MutationObserver adds ${cssClasses.REQUIRED} class to the parent when required attribute is added`, (done) => {
  const hasLabel = true;
  const hasOutline = false;
  const hasHelperText = false;
  const {fixture, nativeControl} = setupTest(hasLabel, hasOutline, hasHelperText);
  assert.isFalse(fixture.classList.contains(cssClasses.REQUIRED));

  nativeControl.setAttribute('required', 'true');

  // MutationObservers are queued as microtasks and fire asynchronously
  setTimeout(() => {
    assert.isTrue(fixture.classList.contains(cssClasses.REQUIRED));
    done();
  }, 0);
});

test(`MutationObserver removes ${cssClasses.REQUIRED} class from the parent when required attr is removed`, (done) => {
  const hasLabel = true;
  const hasOutline = false;
  const hasHelperText = false;
  const {fixture, nativeControl} = setupTest(hasLabel, hasOutline, hasHelperText);

  nativeControl.setAttribute('required', 'true');
  setTimeout(() => {
    assert.isTrue(fixture.classList.contains(cssClasses.REQUIRED));

    fixture.querySelector(strings.NATIVE_CONTROL_SELECTOR).removeAttribute('required');
    setTimeout(() => {
      assert.isFalse(fixture.classList.contains(cssClasses.REQUIRED));
      done();
    }, 0);
  }, 0);
});
