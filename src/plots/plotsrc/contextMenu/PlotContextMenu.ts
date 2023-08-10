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

import { createPublishMenuItems, createSaveAsMenuItems } from './createMenuItems';
import { BkoContextMenu } from './BkoContextMenu';
import { PlotScope } from '../PlotScope';
import { CombinedPlotScope } from '../CombinedPlotScope';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function selectShowPublication(scope: PlotScope | CombinedPlotScope): boolean {
  // TODO
  return true;
}

export class PlotContextMenu extends BkoContextMenu {
  private readonly showPublication: boolean;

  constructor(scope: PlotScope | CombinedPlotScope) {
    super(scope);
    this.showPublication = selectShowPublication(scope);
  }

  protected buildMenu(): void {
    this.inLab ? this.buildLabMenu() : this.buildBkoMenu();

    const menuItems = [...createSaveAsMenuItems(this.scope)];

    if (this.showPublication) {
      menuItems.push(...createPublishMenuItems(this.scope));
    }
    this.createItems(menuItems, this.contextMenu as any); //FIXME
    this.bindEvents();
  }
}
