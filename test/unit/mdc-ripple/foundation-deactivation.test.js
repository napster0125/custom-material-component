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

import td from 'testdouble';
import lolex from 'lolex';

import {testFoundation, captureHandlers} from './helpers';
import {cssClasses, strings, numbers} from '../../../packages/mdc-ripple/constants';
import {getCorrectEventName} from '../../../packages/mdc-animation';

const windowObj = td.object({
  document: {
    createElement: (str) => ({
      style: {
        animation: 'none',
        transition: 'none',
      },
    }),
  },
});

suite('MDCRippleFoundation - Deactivation logic');

testFoundation('runs deactivation UX on touchend after touchstart', ({foundation, adapter, mockRaf}) => {
  const handlers = captureHandlers(adapter);
  foundation.init();
  mockRaf.flush();

  handlers.touchstart();
  mockRaf.flush();
  handlers.touchend({changedTouches: [{pageX: 0, pageY: 0}]});
  mockRaf.flush();

  td.verify(adapter.removeClass(cssClasses.BG_ACTIVE));
  td.verify(adapter.addClass(cssClasses.BG_BOUNDED_ACTIVE_FILL));
  td.verify(adapter.addClass(cssClasses.FG_BOUNDED_ACTIVE_FILL));

  // Test removal of classes on end event
  handlers[getCorrectEventName(windowObj, 'transitionend')]();
  mockRaf.flush();
  td.verify(adapter.removeClass(cssClasses.BG_BOUNDED_ACTIVE_FILL), {times: 2});
  handlers[getCorrectEventName(windowObj, 'animationend')]();
  mockRaf.flush();
  td.verify(adapter.removeClass(cssClasses.FG_BOUNDED_ACTIVE_FILL), {times: 2});
});

testFoundation('runs deactivation UX on pointerup after pointerdown', ({foundation, adapter, mockRaf}) => {
  const handlers = captureHandlers(adapter);
  foundation.init();
  mockRaf.flush();

  handlers.pointerdown();
  mockRaf.flush();
  handlers.pointerup({pageX: 0, pageY: 0});
  mockRaf.flush();

  td.verify(adapter.removeClass(cssClasses.BG_ACTIVE));
  td.verify(adapter.addClass(cssClasses.BG_BOUNDED_ACTIVE_FILL));
  td.verify(adapter.addClass(cssClasses.FG_BOUNDED_ACTIVE_FILL));
});

testFoundation('runs deactivation UX on mouseup after mousedown', ({foundation, adapter, mockRaf}) => {
  const handlers = captureHandlers(adapter);
  foundation.init();
  mockRaf.flush();

  handlers.mousedown();
  mockRaf.flush();
  handlers.mouseup({pageX: 0, pageY: 0});
  mockRaf.flush();

  td.verify(adapter.removeClass(cssClasses.BG_ACTIVE));
  td.verify(adapter.addClass(cssClasses.BG_BOUNDED_ACTIVE_FILL));
  td.verify(adapter.addClass(cssClasses.FG_BOUNDED_ACTIVE_FILL));
});

testFoundation('runs deactivation UX on public deactivate() call', ({foundation, adapter, mockRaf}) => {
  foundation.init();
  mockRaf.flush();

  foundation.activate();
  mockRaf.flush();
  foundation.deactivate();
  mockRaf.flush();

  td.verify(adapter.removeClass(cssClasses.BG_ACTIVE));
  td.verify(adapter.addClass(cssClasses.BG_BOUNDED_ACTIVE_FILL));
  td.verify(adapter.addClass(cssClasses.FG_BOUNDED_ACTIVE_FILL));
});

testFoundation('only re-activates when there are no additional pointer events to be processed',
    ({foundation, adapter, mockRaf}) => {
  const handlers = captureHandlers(adapter);
  foundation.init();
  mockRaf.flush();

  // Simulate Android 6 / Chrome latest event flow.
  handlers.pointerdown();
  mockRaf.flush();
  handlers.touchstart();
  mockRaf.flush();

  handlers.pointerup({pageX: 0, pageY: 0});
  mockRaf.flush();

  // At this point, the deactivation UX should have run, since the initial activation was triggered by
  // a pointerdown event.
  td.verify(adapter.removeClass(cssClasses.BG_ACTIVE), {times: 1});
  td.verify(adapter.addClass(cssClasses.BG_BOUNDED_ACTIVE_FILL), {times: 1});
  td.verify(adapter.addClass(cssClasses.FG_BOUNDED_ACTIVE_FILL), {times: 1});

  handlers.touchend({changedTouches: [{pageX: 0, pageY: 0}]});
  mockRaf.flush();

  // Verify that deactivation UX has not been run redundantly
  td.verify(adapter.removeClass(cssClasses.BG_ACTIVE), {times: 1});
  td.verify(adapter.addClass(cssClasses.BG_BOUNDED_ACTIVE_FILL), {times: 1});
  td.verify(adapter.addClass(cssClasses.FG_BOUNDED_ACTIVE_FILL), {times: 1});

  handlers.mousedown();
  mockRaf.flush();

  // Verify that activation only happened once, at pointerdown
  td.verify(adapter.addClass(cssClasses.BG_ACTIVE), {times: 1});

  handlers.mouseup({pageX: 0, pageY: 0});
  mockRaf.flush();

  // Finally, verify that since mouseup happened, we can re-activate the ripple.
  handlers.mousedown();
  mockRaf.flush();

  td.verify(adapter.addClass(cssClasses.BG_ACTIVE), {times: 2});
});

testFoundation('sets FG position from the coords to the center within surface on pointer deactivation',
    ({foundation, adapter, mockRaf}) => {
  const handlers = captureHandlers(adapter);
  const left = 50;
  const top = 50;
  const width = 200;
  const height = 100;
  const maxSize = Math.max(width, height);
  const initialSize = maxSize * numbers.INITIAL_ORIGIN_SCALE;
  const pageX = 100;
  const pageY = 75;

  td.when(adapter.computeBoundingRect()).thenReturn({width, height, left, top});
  foundation.init();
  mockRaf.flush();

  handlers.mousedown();
  mockRaf.flush();
  handlers.mouseup({pageX, pageY});
  mockRaf.flush();

  const startPosition = {
    x: pageX - left - (initialSize / 2),
    y: pageY - top - (initialSize / 2),
  };

  const endPosition = {
    x: (width / 2) - (initialSize / 2),
    y: (height / 2) - (initialSize / 2),
  };

  td.verify(adapter.updateCssVariable(strings.VAR_FG_TRANSLATE_START,
      `${startPosition.x}px, ${startPosition.y}px`));
  td.verify(adapter.updateCssVariable(strings.VAR_FG_TRANSLATE_END,
      `${endPosition.x}px, ${endPosition.y}px`));
});

testFoundation('takes scroll offset into account when computing position', ({foundation, adapter, mockRaf}) => {
  const handlers = captureHandlers(adapter);
  const left = 50;
  const top = 50;
  const width = 200;
  const height = 100;
  const x = 25;
  const y = 25;
  const maxSize = Math.max(width, height);
  const initialSize = maxSize * numbers.INITIAL_ORIGIN_SCALE;
  const pageX = 100;
  const pageY = 75;

  td.when(adapter.computeBoundingRect()).thenReturn({width, height, left, top});
  td.when(adapter.getWindowPageOffset()).thenReturn({x, y});
  foundation.init();
  mockRaf.flush();

  handlers.mousedown();
  mockRaf.flush();
  handlers.mouseup({pageX, pageY});
  mockRaf.flush();

  const startPosition = {
    x: pageX - left - x - (initialSize / 2),
    y: pageY - top - y - (initialSize / 2),
  };

  const endPosition = {
    x: (width / 2) - (initialSize / 2),
    y: (height / 2) - (initialSize / 2),
  };

  td.verify(adapter.updateCssVariable(strings.VAR_FG_TRANSLATE_START,
      `${startPosition.x}px, ${startPosition.y}px`));
  td.verify(adapter.updateCssVariable(strings.VAR_FG_TRANSLATE_END,
      `${endPosition.x}px, ${endPosition.y}px`));
});

testFoundation('sets unbounded FG position to center on non-pointer deactivation', ({foundation, adapter, mockRaf}) => {
  const handlers = captureHandlers(adapter);
  const left = 50;
  const top = 50;
  const width = 200;
  const height = 100;
  const maxSize = Math.max(width, height);
  const initialSize = maxSize * numbers.INITIAL_ORIGIN_SCALE;

  td.when(adapter.computeBoundingRect()).thenReturn({width, height, left, top});
  td.when(adapter.isSurfaceActive()).thenReturn(true, false);
  foundation.init();
  mockRaf.flush();

  handlers.keydown();
  mockRaf.flush();
  handlers.keyup();
  mockRaf.flush();

  const position = {
    x: (width / 2) - (initialSize / 2),
    y: (height / 2) - (initialSize / 2),
  };

  td.verify(adapter.updateCssVariable(strings.VAR_FG_TRANSLATE_START,
      `${position.x}px, ${position.y}px`));
  td.verify(adapter.updateCssVariable(strings.VAR_FG_TRANSLATE_END,
      `${position.x}px, ${position.y}px`));
});

testFoundation('triggers unbounded deactivation based on time it took to activate',
    ({foundation, adapter, mockRaf}) => {
  const clock = lolex.install();
  const handlers = captureHandlers(adapter);
  const size = 100;
  td.when(adapter.isUnbounded()).thenReturn(true);
  td.when(adapter.computeBoundingRect()).thenReturn({width: size, height: size, left: 0, top: 0});
  foundation.init();
  mockRaf.flush();

  handlers.mousedown({pageX: 0, pageY: 0});
  mockRaf.flush();

  const baseElapsedTime = 20;

  clock.tick(baseElapsedTime + numbers.FG_TRANSFORM_DELAY_MS);

  handlers.mouseup();
  mockRaf.flush();

  const surfaceDiameter = Math.sqrt(Math.pow(size, 2) + Math.pow(size, 2));
  const initialSize = size * numbers.INITIAL_ORIGIN_SCALE;
  const maxRadius = surfaceDiameter + numbers.PADDING;
  const fgScale = maxRadius / initialSize;
  const xfDuration = 1000 * Math.sqrt(maxRadius / 1024);

  const scaleVal = baseElapsedTime / xfDuration * fgScale;
  td.verify(adapter.updateCssVariable(strings.VAR_FG_APPROX_XF, `scale(${scaleVal})`));
  td.verify(adapter.updateCssVariable(
    strings.VAR_FG_UNBOUNDED_TRANSFORM_DURATION, `${numbers.UNBOUNDED_TRANSFORM_DURATION_MS}ms`
  ));
  const opacity = ((baseElapsedTime + numbers.FG_TRANSFORM_DELAY_MS) / numbers.ACTIVE_OPACITY_DURATION_MS);
  const opacityDuration = 1000 * opacity / numbers.OPACITY_DURATION_DIVISOR;
  td.verify(
    adapter.updateCssVariable(strings.VAR_FG_UNBOUNDED_OPACITY_DURATION, `${opacityDuration}ms`)
  );
  clock.uninstall();
});

testFoundation('clamps opacity duration to minimum value for unbounded deactivation',
    ({foundation, adapter, mockRaf}) => {
  const clock = lolex.install();
  const handlers = captureHandlers(adapter);
  td.when(adapter.isUnbounded()).thenReturn(true);
  foundation.init();
  mockRaf.flush();

  handlers.mousedown({pageX: 0, pageY: 0});
  mockRaf.flush();
  clock.tick(10);
  handlers.mouseup();
  mockRaf.flush();

  td.verify(
    adapter.updateCssVariable(strings.VAR_FG_UNBOUNDED_OPACITY_DURATION, '200ms')
  );
  clock.uninstall();
});

testFoundation('clamps opacity duration to max value for unbounded deactivation', ({foundation, adapter, mockRaf}) => {
  const clock = lolex.install();
  const handlers = captureHandlers(adapter);
  td.when(adapter.isUnbounded()).thenReturn(true);
  foundation.init();
  mockRaf.flush();

  handlers.mousedown({pageX: 0, pageY: 0});
  mockRaf.flush();
  clock.tick(1000);
  handlers.mouseup();
  mockRaf.flush();

  const about333ms = td.matchers.argThat((duration) => {
    const ms = parseFloat(duration);
    return ms.toFixed(2) === '333.33';
  });
  td.verify(
    adapter.updateCssVariable(strings.VAR_FG_UNBOUNDED_OPACITY_DURATION, about333ms)
  );
  clock.uninstall();
});

testFoundation('toggles unbounded activation classes', ({foundation, adapter, mockRaf}) => {
  const clock = lolex.install();
  const handlers = captureHandlers(adapter);
  td.when(adapter.isUnbounded()).thenReturn(true);
  foundation.init();
  mockRaf.flush();

  handlers.mousedown({pageX: 0, pageY: 0});
  mockRaf.flush();
  clock.tick(100);
  handlers.mouseup();
  mockRaf.flush();

  td.verify(adapter.addClass(cssClasses.FG_UNBOUNDED_DEACTIVATION));
  td.verify(adapter.removeClass(cssClasses.FG_UNBOUNDED_ACTIVATION));
  clock.tick(/* past opacity duration */300);
  td.verify(adapter.removeClass(cssClasses.FG_UNBOUNDED_DEACTIVATION));
  clock.uninstall();
});

testFoundation('cancels unbounded deactivation class removal on deactivation', ({foundation, adapter, mockRaf}) => {
  const clock = lolex.install();
  const handlers = captureHandlers(adapter);
  td.when(adapter.isUnbounded()).thenReturn(true);
  foundation.init();
  mockRaf.flush();

  handlers.mousedown({pageX: 0, pageY: 0});
  mockRaf.flush();
  clock.tick(100);
  handlers.mouseup();
  mockRaf.flush();

  handlers.mousedown();
  mockRaf.flush();
  clock.tick(/* past opacity duration */300);
  // Verify this is only called twice on both initial activations, but not as part of a deactivation timeout.
  td.verify(adapter.removeClass(cssClasses.FG_UNBOUNDED_DEACTIVATION), {times: 2});
  clock.uninstall();
});

testFoundation('ensures pointer event deactivation occurs even if activation rAF not run',
    ({foundation, adapter, mockRaf}) => {
  const clock = lolex.install();
  const handlers = captureHandlers(adapter);
  td.when(adapter.isUnbounded()).thenReturn(true);
  foundation.init();
  mockRaf.flush();

  handlers.mousedown({pageX: 0, pageY: 0});
  mockRaf.pendingFrames.shift();
  clock.tick(100);
  handlers.mouseup();
  mockRaf.flush();

  td.verify(adapter.addClass(cssClasses.FG_UNBOUNDED_DEACTIVATION));
  clock.uninstall();
});
