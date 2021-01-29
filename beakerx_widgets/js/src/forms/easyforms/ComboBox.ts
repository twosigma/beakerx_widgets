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

/* eslint-disable @typescript-eslint/no-explicit-any */

import { SelectModel as JupyterSelectModel, SelectView as JupyterSelectView } from '@jupyter-widgets/controls';
import { BEAKERX_MODULE_VERSION } from '../../version';
import $ from 'jquery';
import 'jquery-ui/ui/widgets/autocomplete';
import 'jquery-ui.combobox';

export class ComboBoxModel extends JupyterSelectModel {
  defaults(): any {
    return {
      ...super.defaults(),
      _view_name: 'ComboBoxView',
      _model_name: 'ComboBoxModel',
      _model_module: 'beakerx.forms',
      _view_module: 'beakerx.forms',
      _model_module_version: BEAKERX_MODULE_VERSION,
      _view_module_version: BEAKERX_MODULE_VERSION,
    };
  }
}

export class ComboBoxView extends JupyterSelectView {
  render(): void {
    super.render();
    this.el.classList.add('widget-combobox');
    this.listbox.setAttribute('easyform-editable', this.model.get('editable'));
    this.listbox.setAttribute('size', this.model.get('size'));
    const listbox: any = $(this.listbox);
    listbox.combobox();
    listbox.on('change', () => {
      this.setValueToModel();
    });
    this.update();
  }
  setValueToModel(): void {
    this.model.set('value', this.listbox.value, { updated_view: this });
    this.touch();
  }
  update(): void {
    super.update();
    const value: string = this.model.get('value');
    this.$el.find('.ui-combobox-input').val(value);
  }
}
