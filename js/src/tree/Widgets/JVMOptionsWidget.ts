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

import $ from 'jquery';

import { Panel } from '@lumino/widgets';
import { Message, MessageLoop } from '@lumino/messaging';

import { JVMOptionsModel } from '../Models';
import { DefaultOptionsWidget, OtherOptionsWidget, PropertiesWidget } from './JVMOptions';
import { OptionsWidget } from './OptionsWidget';
import { DOMUtils } from '../Utils';
import {
  DefaultOptionsChangedMessage,
  JVMOptionsChangedMessage,
  OtherOptionsChangedMessage,
  PropertiesOptionsChangedMessage,
  TYPE_DEFAULT_JVM_OPTIONS_CHANGED,
  TYPE_JVM_OPTIONS_ERROR,
  TYPE_OTHER_JVM_OPTIONS_CHANGED,
  TYPE_PROPERTIES_JVM_OPTIONS_CHANGED,
  TYPE_SIZE_CHANGED,
} from '../Messages';

export class JVMOptionsWidget extends Panel {
  constructor() {
    super();

    this.addClass('beakerx_container');

    this.addClass('bx-jvm-options-widget');
    this.title.label = 'JVM Options';
    this.title.closable = false;

    const defaultOptionsWidget = new DefaultOptionsWidget();
    const otherOptionsWidget = new OtherOptionsWidget();
    const propertiesWidget = new PropertiesWidget();

    this._model = this.createModel(defaultOptionsWidget, propertiesWidget, otherOptionsWidget);

    this.addWidget(defaultOptionsWidget);
    this.addWidget(propertiesWidget);
    this.addWidget(otherOptionsWidget);
  }

  public processMessage(msg: Message): void {
    switch (msg.type) {
      case TYPE_DEFAULT_JVM_OPTIONS_CHANGED:
        this._model.setDefaultOptions((msg as DefaultOptionsChangedMessage).values);
        this.sendMessageToParent(new JVMOptionsChangedMessage(this._model.options));
        break;
      case TYPE_OTHER_JVM_OPTIONS_CHANGED:
        this._model.setOtherOptions((msg as OtherOptionsChangedMessage).options);
        this.sendMessageToParent(new JVMOptionsChangedMessage(this._model.options));
        break;
      case TYPE_PROPERTIES_JVM_OPTIONS_CHANGED:
        this._model.setPropertiesOptions((msg as PropertiesOptionsChangedMessage).properties);
        this.sendMessageToParent(new JVMOptionsChangedMessage(this._model.options));
        break;
      case TYPE_JVM_OPTIONS_ERROR:
        this.sendMessageToParent(msg);
        break;
      case TYPE_SIZE_CHANGED:
        this._updateSize();
        break;
      default:
        super.processMessage(msg);
        break;
    }
  }

  get model(): JVMOptionsModel {
    return this._model;
  }

  protected onActivateRequest(): void {
    this._updateSize();
  }

  private _updateSize(): void {
    let h = 0;
    for (const w of this.widgets) {
      h += DOMUtils.getRealElementHeight(w.node);
    }

    $(this.node).height(h);
    $(this.parent.node).height(h);
    (this.parent?.parent as OptionsWidget).updateDimensions();
  }

  private _model: JVMOptionsModel;

  private createModel(
    defaultOptionsWidget: DefaultOptionsWidget,
    propertiesWidget: PropertiesWidget,
    otherOptionsWidget: OtherOptionsWidget,
  ) {
    return new JVMOptionsModel(defaultOptionsWidget, propertiesWidget, otherOptionsWidget);
  }

  private sendMessageToParent(msg: Message) {
    if (this.parent?.parent) {
      // direct parent is stacked panel of tab panel
      MessageLoop.sendMessage(this.parent.parent, msg);
    }
  }
}
