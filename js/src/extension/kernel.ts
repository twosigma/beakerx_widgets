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

import {registerCommTargets} from './comm';
import {BeakerXApi} from "../utils/api";

export function installHandler() {
  const kernel = Jupyter.notebook.kernel;

  registerCommTargets(kernel);

  Jupyter.notebook.events.on('kernel_interrupting.Kernel', () => {
    interrupt();
  });
}

function interrupt() {
  if (Jupyter.notebook.kernel.info_reply.url_to_interrupt) {
    interruptToKernel(Jupyter.notebook.kernel.info_reply.url_to_interrupt);
  }
}

function interruptToKernel(url_to_interrupt: string) {
  new BeakerXInterruptRestHandler().post({"url": url_to_interrupt})
}

class BeakerXInterruptRestHandler {

  private readonly api: BeakerXApi;

  constructor() {
    if (this.api) {
      return;
    }

    let baseUrl;

    try {
      const coreutils = require('@jupyterlab/coreutils');
      coreutils.PageConfig.getOption('pageUrl');
      baseUrl = coreutils.PageConfig.getBaseUrl();
    } catch (e) {
      baseUrl = `${window.location.origin}/`;
    }

    this.api = new BeakerXApi(baseUrl);
  }

  public post(data) {
    this.api
      .restService(data)
      .catch((err) => {
        console.log(err)
      });
  }

}
