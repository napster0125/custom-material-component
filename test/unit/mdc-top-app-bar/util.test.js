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

import {assert} from 'chai';
import * as util from '../../../packages/mdc-top-app-bar/util';

suite('MDCTopAppBar - util');

test('applyPassive returns an options object for browsers that support passive event listeners', () => {
  const mockWindow = {
    document: {
      addEventListener: function(name, method, options) {
        return options.passive;
      },
    },
  };
  assert.deepEqual(util.applyPassive(mockWindow, true), {passive: true});
});

test('applyPassive returns false for browsers that do not support passive event listeners', () => {
  const mockWindow = {
    document: {
      addEventListener: function() {
        throw new Error();
      },
    },
  };
  assert.isFalse(util.applyPassive(mockWindow, true));
});
