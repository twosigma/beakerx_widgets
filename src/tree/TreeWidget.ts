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

import { Panel } from '@lumino/widgets';
import { Message } from '@lumino/messaging';

import { BeakerXApi } from '../utils/api';
import { BannerWidget, OptionsWidget, SyncIndicatorWidget } from './Widgets';
import { ITreeWidgetOptions } from './Types';
import { TreeWidgetModel } from './Models';
import {
  JVMOptionsChangedMessage,
  JVMOptionsErrorMessage,
  TYPE_JVM_OPTIONS_CHANGED,
  TYPE_JVM_OPTIONS_ERROR,
  TYPE_UI_OPTIONS_CHANGED,
  UIOptionsChangedMessage,
} from './Messages';

export class TreeWidget extends Panel {
  private _model: TreeWidgetModel;

  constructor(private options: ITreeWidgetOptions) {
    super();

    const api = new BeakerXApi(this.options.baseUrl);

    this.id = 'beakerx-tree-widget';

    if (this.options.isLab) {
      this.addClass('isLab');
    } else {
      // FIXME
      // require("./../shared/style/tree-notebook.css");
    }

    this.title.label = 'BeakerX';
    this.title.closable = true;

    const bannerWidget = new BannerWidget(api);
    const optionsWidget = new OptionsWidget(this.options.isLab);
    const syncIndicatorWidget = new SyncIndicatorWidget();

    this._model = new TreeWidgetModel(
      api,
      optionsWidget.jvmOptionsModel,
      optionsWidget.uiOptionsModel,
      syncIndicatorWidget,
    );

    this.addWidget(bannerWidget);
    this.addWidget(optionsWidget);
    this.addWidget(syncIndicatorWidget);
  }

  public processMessage(msg: Message): void {
    switch (msg.type) {
      case 'show-result':
        this._model.clearErrors();
        this._model.showResult();
        break;
      case 'hide-result':
        this._model.clearErrors();
        this._model.hideResult();
        break;
      case TYPE_UI_OPTIONS_CHANGED:
        this._model.clearErrors();
        this._model.setUIOptions((msg as UIOptionsChangedMessage).options);
        this._model.save();
        break;
      case TYPE_JVM_OPTIONS_CHANGED:
        this._model.clearErrors();
        this._model.setJVMOptions((msg as JVMOptionsChangedMessage).options);
        this._model.save();
        break;
      case TYPE_JVM_OPTIONS_ERROR:
        this._model.clearErrors();
        this._model.showError((msg as JVMOptionsErrorMessage).error);
        break;
      default:
        super.processMessage(msg);
        break;
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected onBeforeAttach(msg: Message): void {
    this._model.load();
  }
}
