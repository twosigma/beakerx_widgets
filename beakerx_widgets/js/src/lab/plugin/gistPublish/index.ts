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

import { NotebookPanel } from '@jupyterlab/notebook';
import { Dialog, showDialog, ToolbarButton } from '@jupyterlab/apputils';
import { GistPublishModal } from './gistPublishModal';
import { Cell, CodeCell } from '@jupyterlab/cells';
import { CommandRegistry } from '@lumino/commands';
import { GistPublisher, GistPublisherUtils } from '../../../plots/publisher';
import { AccessTokenProvider } from '../AccessTokenProvider';
import { Widget } from '@lumino/widgets';

export function registerGistPublishFeature(panel: NotebookPanel, commands: CommandRegistry, showPublication: boolean) {
  if (showPublication) {
    addActionButton(panel, commands);
    setupPublisher(panel, commands);
  } else {
    removeActionButton(panel);
  }
}

function addActionButton(panel: NotebookPanel, commands: CommandRegistry): void {
  if (panel.toolbar.isDisposed) {
    return;
  }
  const action = {
    iconClassName: 'bx-PublishIcon fa fa-share-alt',
    tooltip: 'Publish...',
    onClick: () => openPublishDialog(panel, commands),
  };

  const button = new ToolbarButton(action);
  button.id = 'bx-publishButton';

  panel.toolbar.insertItem(9, 'publish', button);
}

function removeActionButton(panel: NotebookPanel): void {
  try {
    for (const widget of panel.toolbar.layout) {
      if (widget instanceof ToolbarButton && widget.id == 'bx-publishButton') {
        panel.toolbar.layout.removeWidget(widget);
        break;
      }
    }
  } catch(e) {
    // @ts-ignore JupyterLab 3 support
    const iter = panel.toolbar.layout.iter();
    let widget: Widget;
    while ((widget = iter.next())) {
      if (widget instanceof ToolbarButton && widget.id == 'bx-publishButton') {
        panel.toolbar.layout.removeWidget(widget);
        break;
      }
    }
  }
}

function setupPublisher(panel: NotebookPanel, commands: CommandRegistry) {
  const options = {
    accessTokenProvider: new AccessTokenProvider(),
    saveWidgetsStateHandler: saveWidgetsState.bind(undefined, panel, commands),
    prepareContentToPublish: (scope) => {
      const el = scope.node || scope.element[0];
      let cell: CodeCell;
      const cells: CodeCell[] = <CodeCell[]>(
        (panel.content.widgets || []).filter((cell: Cell) => cell instanceof CodeCell)
      );
      for (const c of cells) {
        if (c.node.contains(el)) {
          cell = c;
          break;
        }
      }

      const nbjson = panel.content.model.toJSON();
      nbjson['cells'] = [cell.model.toJSON()];
      return nbjson;
    },
  };
  GistPublisherUtils.setup(options);
}

function openPublishDialog(panel: NotebookPanel, commands: CommandRegistry) {
  new GistPublishModal().show(async (personalAccessToken) => {
    await saveWidgetsState(panel, commands);
    return doPublish(panel, personalAccessToken);
  });
}

function showErrorDialog(errorMsg) {
  showDialog({
    title: 'Gist publication error',
    body: `Uploading gist failed: ${errorMsg}`,
    buttons: [Dialog.okButton({ label: 'OK' })],
  });
}

export async function saveWidgetsState(panel: NotebookPanel, commands: CommandRegistry): Promise<string> {
  await commands.execute('docmanager:save');
  console.log('widgets state has been saved');
  return panel.context.contentsModel.name;
}

function doPublish(panel: NotebookPanel, personalAccessToken: string | null): void {
  GistPublisher.doPublish(
    personalAccessToken,
    panel.context.contentsModel.name,
    panel.content.model.toJSON(),
    (errorMsg) => showErrorDialog(errorMsg),
  );
}
