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

import { DocumentRegistry } from '@jupyterlab/docregistry';
import { ILabShell, JupyterFrontEnd } from '@jupyterlab/application';
import { ISettingRegistry } from '@jupyterlab/settingregistry';
import { INotebookModel, NotebookPanel } from '@jupyterlab/notebook';
import { DisposableDelegate } from '@lumino/disposable';
import { bkCoreManager } from '../utils/bk/bkCoreManager';
import {
  enableInitializationCellsFeature,
  extendHighlightModes,
  registerCommentOutCmd,
  registerCommTargets,
  UIOptionFeaturesHelper,
} from './plugin';
import { AutoTranslation } from './plugin/autoTranslation';

const PlotApi = require('../plots/plotsrc/_js/plotApi');

export class BeakerxWidgetExtension implements DocumentRegistry.WidgetExtension {
  constructor(private app: JupyterFrontEnd, private settings: ISettingRegistry, private labShell: ILabShell) {}

  createNew(panel: NotebookPanel, context: DocumentRegistry.IContext<INotebookModel>): DisposableDelegate {
    const app = this.app;
    const settings = this.settings;
    const labShell = this.labShell;

    Promise.all([panel.sessionContext.ready, context.ready]).then(function () {
      extendHighlightModes(panel);
      enableInitializationCellsFeature(panel);
      registerCommentOutCmd(panel);
      registerCommTargets(panel, context);

      window.beakerxHolder = window.beakerxHolder || {};
      const plotApiList = PlotApi.list();
      const beakerxInstance = {
        ...plotApiList,
        displayHTML,
        prefs: bkCoreManager.getBkApp().getBeakerObject().beakerObj.prefs,
      };
      window.beakerx = AutoTranslation.proxify(beakerxInstance, context.sessionContext.session.kernel);
      window.beakerxHolder[context.sessionContext.session.kernel.id] = window.beakerx;

      plotApiList.setActiveLabPanel(panel);
      labShell.activeChanged.connect((sender, args) => {
        if (args.newValue == panel) {
          panel.sessionContext.ready.then(() => {
            window.beakerx = window.beakerxHolder[panel.context.sessionContext.session.kernel.id];
            plotApiList.setActiveLabPanel(panel);
          });
        }
      });

      const originalProcessFn = app.commands.processKeydownEvent;
      app.commands.processKeydownEvent = (event) => {
        if (window.beakerx && window.beakerx.tableFocused) {
          return false;
        }

        return originalProcessFn.call(app.commands, event);
      };
      new UIOptionFeaturesHelper(app, settings, panel, labShell).registerFeatures();
    });

    return new DisposableDelegate(() => {});
  }
}

function displayHTML(element: HTMLElement, html: string): void {
  if (!element || !html) {
    return;
  }

  const childElement = document.createElement('pre');

  childElement.classList.add('jp-RenderedHTML');
  childElement.innerHTML = html;
  element.appendChild(childElement);
}
