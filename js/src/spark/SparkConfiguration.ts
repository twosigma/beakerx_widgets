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

import { VBoxModel as JupyterVBoxModel, VBoxView as JupyterVBoxView } from '@jupyter-widgets/controls';
import { BEAKERX_MODULE_VERSION } from '../version';

export class SparkConfigurationModel extends JupyterVBoxModel {
  defaults() {
    return {
      ...super.defaults(),
      _view_name: 'SparkConfigurationView',
      _model_name: 'SparkConfigurationModel',
      _model_module: 'beakerx.spark',
      _view_module: 'beakerx.spark',
      _model_module_version: BEAKERX_MODULE_VERSION,
      _view_module_version: BEAKERX_MODULE_VERSION,
    };
  }
}

export class SparkConfigurationView extends JupyterVBoxView {
  update() {
    super.update();
    this.updateChildren();
  }

  render() {
    super.render();
    this.updateChildren();
  }

  private handleFormState() {
    const configButtons = this.el.querySelectorAll('.bx-spark-configuration .bx-button');
    const configurationInputs = this.el.querySelectorAll('.bx-spark-configuration input');

    if (this.el.closest('.bx-disabled')) {
      this.setFormReadonly(configButtons, configurationInputs);
    } else {
      this.setFormEditable(configButtons, configurationInputs);
    }
  }

  private setFormReadonly(configButtons, configurationInputs) {
    configurationInputs && configurationInputs.forEach((input) => input.setAttribute('readonly', 'readonly'));
    configButtons && configButtons.forEach((button) => button.setAttribute('disabled', 'disabled'));
  }

  private setFormEditable(configButtons, configurationInputs) {
    configurationInputs && configurationInputs.forEach((input) => input.removeAttribute('readonly'));
    configButtons && configButtons.forEach((button) => button.removeAttribute('readonly'));
  }

  private updateChildren() {
    const noop = () => {};
    let updateTimer: NodeJS.Timer;

    this.resolveChildren(this).then((views) => {
      views.forEach((view) => {
        this.resolveChildren(view).then(() => {
          views.forEach((view) => {
            this.resolveChildren(view).then(() => {
              views.forEach((view) => {
                this.resolveChildren(view).then(() => {
                  clearTimeout(updateTimer);
                  updateTimer = setTimeout(() => {
                    this.handleFormState();
                  }, 10);
                }, noop);
              });
            }, noop);
          });
        }, noop);
      });
    }, noop);
  }

  private resolveChildren(view) {
    // TODO better typing
    return new Promise<any[]>((resolve, reject) => {
      if (!view || !view.children_views) {
        reject();
        return;
      }

      view.children_views.update(view.model.get('children')).then((views) => resolve(views));
    });
  }
}

export default {
  SparkConfigurationModel,
  SparkConfigurationView,
};
