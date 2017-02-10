/**
 * Copyright 2016 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import test from 'tape';
import domEvents from 'dom-events';
import td from 'testdouble';

import {MDCComponent} from '../../../packages/mdc-base';

class FakeComponent extends MDCComponent {
  get root() {
    return this.root_;
  }

  get foundation() {
    return this.foundation_;
  }

  getDefaultFoundation() {
    return td.object({
      isDefaultFoundation: true,
      init: () => {},
      rootElementAtTimeOfCall: this.root_,
    });
  }

  initialize(...args) {
    this.initializeArgs = args;
    this.initializeComesBeforeFoundation = !this.foundation_;
  }

  initialSyncWithDOM() {
    this.synced = true;
  }
}

test('provides a static attachTo() method that returns a basic instance with the specified root', (t) => {
  const root = document.createElement('div');
  const b = MDCComponent.attachTo(root);
  t.true(b instanceof MDCComponent);
  t.end();
});

test('takes a root node constructor param and assigns it to the "root_" property', (t) => {
  const root = document.createElement('div');
  const f = new FakeComponent(root);
  t.equal(f.root, root);
  t.end();
});

test('takes an optional foundation constructor param and assigns it to the "foundation_" property', (t) => {
  const root = document.createElement('div');
  const foundation = {init: () => {}};
  const f = new FakeComponent(root, foundation);
  t.equal(f.foundation, foundation);
  t.end();
});

test('assigns the result of "getDefaultFoundation()" to "foundation_" by default', (t) => {
  const root = document.createElement('div');
  const f = new FakeComponent(root);
  t.true(f.foundation.isDefaultFoundation);
  t.end();
});

test("calls the foundation's init() method within the constructor", (t) => {
  const root = document.createElement('div');
  const foundation = td.object({init: () => {}});
  // Testing side effects of constructor
  // eslint-disable-next-line no-new
  new FakeComponent(root, foundation);
  t.doesNotThrow(() => td.verify(foundation.init()));
  t.end();
});

test('throws an error if getDefaultFoundation() is not overridden', (t) => {
  const root = document.createElement('div');
  t.throws(() => new MDCComponent(root));
  t.end();
});

test('calls initialSyncWithDOM() when initialized', (t) => {
  const root = document.createElement('div');
  const f = new FakeComponent(root);
  t.true(f.synced);
  t.end();
});

test('provides a default initialSyncWithDOM() no-op if none provided by subclass', (t) => {
  t.doesNotThrow(MDCComponent.prototype.initialSyncWithDOM.bind({}));
  t.end();
});

test("provides a default destroy() method which calls the foundation's destroy() method", (t) => {
  const root = document.createElement('div');
  const foundation = td.object({init: () => {}, destroy: () => {}});
  const f = new FakeComponent(root, foundation);
  f.destroy();
  t.doesNotThrow(() => td.verify(foundation.destroy()));
  t.end();
});

test('#initialize is called within constructor and passed any additional positional component args', (t) => {
  const f = new FakeComponent(document.createElement('div'), /* foundation */ undefined, 'foo', 42);
  t.deepEqual(f.initializeArgs, ['foo', 42]);
  t.end();
});

test('#initialize is called before getDefaultFoundation()', (t) => {
  const f = new FakeComponent(document.createElement('div'));
  t.true(f.initializeComesBeforeFoundation);
  t.end();
});

test('#listen adds an event listener to the root element', (t) => {
  const root = document.createElement('div');
  const f = new FakeComponent(root);
  const handler = td.func('eventHandler');
  f.listen('FakeComponent:customEvent', handler);
  domEvents.emit(root, 'FakeComponent:customEvent');
  t.doesNotThrow(() => td.verify(handler(td.matchers.anything())));
  t.end();
});

test('#unlisten removes an event listener from the root element', (t) => {
  const root = document.createElement('div');
  const f = new FakeComponent(root);
  const handler = td.func('eventHandler');
  root.addEventListener('FakeComponent:customEvent', handler);
  f.unlisten('FakeComponent:customEvent', handler);
  domEvents.emit(root, 'FakeComponent:customEvent');
  t.doesNotThrow(() => td.verify(handler(td.matchers.anything()), {times: 0}));
  t.end();
});

test('#emit dispatches a custom event with the supplied data', (t) => {
  const root = document.createElement('div');
  const f = new FakeComponent(root);
  const handler = td.func('eventHandler');
  let evt = null;
  td.when(handler(td.matchers.isA(Object))).thenDo((evt_) => {
    evt = evt_;
  });
  const data = {evtData: true};
  const type = 'customeventtype';

  root.addEventListener(type, handler);
  f.emit(type, data);
  t.true(evt !== null);
  t.equal(evt.type, type);
  t.deepEqual(evt.detail, data);
  t.end();
});

test('(regression) ensures that this.root_ is available for use within getDefaultFoundation()', (t) => {
  const root = document.createElement('div');
  const f = new FakeComponent(root);
  t.equal(f.foundation.rootElementAtTimeOfCall, root);
  t.end();
});
