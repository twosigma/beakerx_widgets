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

import { Kernel } from '@jupyterlab/services';
import { BEAKER_AUTOTRANSLATION } from './comm';

let comm: Kernel.IComm;

export class AutoTranslation {
  static readonly LOCK_PROXY = 'LOCK_PROXY';
  static readonly TABLE_FOCUSED = 'tableFocused';

  public static checkComm(kernelInstance: Kernel.IKernelConnection) {
    if (comm && !comm.isDisposed) {
      return comm;
    }

    comm = kernelInstance.createComm(BEAKER_AUTOTRANSLATION);
    comm.open();
  }

  public static proxify(beakerxInstance: any, kernelInstance): Record<string, unknown> {
    const handler = {
      get(obj, prop) {
        return prop in obj ? obj[prop] : undefined;
      },

      set: function (obj, prop, value) {
        obj[prop] = value;

        if (
          prop !== AutoTranslation.LOCK_PROXY &&
          prop !== AutoTranslation.TABLE_FOCUSED &&
          !window.beakerx[AutoTranslation.LOCK_PROXY]
        ) {
          AutoTranslation.checkComm(kernelInstance);
          comm.send({ name: prop, value });
        }

        return true;
      },
    };

    return new Proxy<Record<string, unknown>>(beakerxInstance, handler);
  }
}
