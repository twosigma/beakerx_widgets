/*
 *  Copyright 2018 TWO SIGMA OPEN SOURCE, LLC
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

import { ButtonModel as JupyterButtonModel, ButtonView as JupyterButtonView } from '@jupyter-widgets/controls';
import { BEAKERX_MODULE_VERSION } from '../version';
import { BeakerXApi } from '../utils/api';

export class RESTButtonModel extends JupyterButtonModel {
  defaults() {
    return {
      ...super.defaults(),
      _view_name: 'RESTButtonView',
      _model_name: 'RESTButtonModel',
      _model_module: 'beakerx',
      _view_module: 'beakerx',
      _model_module_version: BEAKERX_MODULE_VERSION,
      _view_module_version: BEAKERX_MODULE_VERSION,
    };
  }
}

export class RESTButtonView extends JupyterButtonView {
  private api: BeakerXApi;
  private url: string;

  initialize(parameters) {
    super.initialize(parameters);
    this.url = this.model.get('url');
    this.setApi();
  }

  update() {
    super.update();
    this.url = this.model.get('url');
  }

  private setApi() {
    let baseUrl;

    if (this.api) {
      return;
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const coreutils = require('@jupyterlab/coreutils');
      coreutils.PageConfig.getOption('pageUrl');
      baseUrl = coreutils.PageConfig.getBaseUrl();
    } catch (e) {
      baseUrl = `${window.location.origin}/`;
    }

    this.api = new BeakerXApi(baseUrl);
  }

  events(): { [e: string]: string } {
    return { click: '_handle_REST_click' };
  }

  /**
   * Handles when the button is clicked.
   */
  _handle_REST_click(event) {
    event.preventDefault();
    const data = { url: this.url };
    this.api.restService(data).catch((err) => {
      console.log(err);
    });
  }
}
