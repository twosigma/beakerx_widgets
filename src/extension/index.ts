/*
 *  Copyright 2017 TWO SIGMA OPEN SOURCE, LLC
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *         http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

// This file contains the javascript that is run when the notebook is loaded.
// It contains some requirejs configuration and the `load_ipython_extension`
// which is required for any notebook extension.

import { extendHighlightModes, extendWithLineComment } from './codeEditor';
import { registerFeature } from './UIOptionsHelper';
import { enableInitializationCellsFeature } from './initializationCells';
import { AutoTranslation } from './autoTranslation';
import { installHandler as installKernelHandler } from './kernel';
import { displayHTML } from './htmlOutput';
import { bkCoreManager } from '../utils/bk/bkCoreManager';

/* eslint-disable @typescript-eslint/no-var-requires */
const configmod = require('services/config');
const utils = require('base/js/utils');
const Jupyter = require('base/js/namespace');
const events = require('base/js/events');
const plotApi = require('../plots/plotsrc/_js/plotApi');
const big = require('big.js');
const tocUtils = require('./tableOfContents/index');
/* eslint-enable @typescript-eslint/no-var-requires */

window['Big'] = big;

const base_url = utils.get_body_data('baseUrl');

new configmod.ConfigSection('notebook', { base_url: base_url });

const MOD_NAME = 'init_cell';
const log_prefix = `[${MOD_NAME}]`;
let options = {
  // updated from server's config & nb metadata
  run_on_kernel_ready: true,
};

registerFeature(base_url);

function callback_notebook_loaded() {
  enableInitializationCellsFeature(options);
  tocUtils.toc_init();
  installKernelHandler();
}

function extendWindowObject() {
  if (!window) {
    return;
  }

  const plotApiList = plotApi.list();
  const bkObject = bkCoreManager.getBkApp().getBeakerObject();
  const beakerxInstance = {
    ...plotApiList,
    displayHTML,
    prefs: bkObject.beakerObj.prefs,
  };

  if (window.beakerx.keys().length == 0) {
    window.beakerx = AutoTranslation.proxify(beakerxInstance);
  }
}

function setupNotebook() {
  if (Jupyter.NotebookList) {
    return; // Notebook not loaded
  }

  Jupyter.notebook.config.loaded
    .then(
      () => {
        options = { ...options, ...Jupyter.notebook.config.data[MOD_NAME] };
      },
      (reason) => {
        console.warn(log_prefix, 'error loading config:', reason);
      },
    )
    .then(() => {
      Jupyter.notebook._fully_loaded
        ? callback_notebook_loaded()
        : events.on('notebook_loaded.Notebook', callback_notebook_loaded);
    })
    .catch((reason) => {
      console.error(log_prefix, 'unhandled error:', reason);
    });

  extendWithLineComment(Jupyter, CodeMirror);
  extendHighlightModes(Jupyter);
}

export function load_ipython_extension(): void {
  extendWindowObject();
  setupNotebook();
}
