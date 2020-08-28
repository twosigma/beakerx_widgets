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

import { Panel, Widget } from '@lumino/widgets';
import { MessageLoop } from '@lumino/messaging';
import { SparkUIMessage } from '../../SparkUIMessage';

export class ProfilePropertiesWidget extends Panel {
  private readonly container: ProfilePropertiesContainer;
  private readonly toolbar: ProfilePropertiesToolbar;

  constructor() {
    super();
    this.container = new ProfilePropertiesContainer();
    this.toolbar = new ProfilePropertiesToolbar();
    this.addWidget(this.container);
    this.addWidget(this.toolbar);
  }

  public addProperty(name: string, value: string): void {
    this.container.addProperty(name, value);
  }

  public removeProperty(name) {
    this.container.removeProperty(name);
  }

  public collectProperties(): { [key: string]: string } {
    return this.container.collectProperties();
  }

  public updateProperties(properties: { name: string; value: string }[]) {
    this.container.removeProperties();
    for (const p of properties) {
      this.container.addProperty(p.name, p.value);
    }
  }
}

class ProfilePropertiesContainer extends Panel {
  private properties: { name: string; value: string; widget: Widget }[] = [];

  constructor() {
    super();
    this.addClass('bx-spark-property-container');
  }

  public addProperty(name: string, value: string) {
    const p = this.getPropertyByName(name);
    if (p !== null) {
      console.log(`There is already a property: '%s'`, name);
      return;
    }
    const w = this.createProperty(name, value);
    this.properties.push({
      name: name,
      value: value,
      widget: w,
    });
    this.addWidget(w);
  }

  public removeProperty(name: string) {
    const p = this.getPropertyByName(name);
    if (p === null) {
      console.log(`There is no property: '%s'`, name);
      return;
    }

    p.widget.dispose();
    this.properties = this.properties.filter((p) => {
      return p.name !== name;
    });
  }

  public removeProperties() {
    for (const p of this.properties) {
      p.widget.dispose();
    }
    this.properties = [];
  }

  public collectProperties() {
    const r = {};
    for (const p of this.properties) {
      if (p.name === '') {
        continue;
      }
      r[p.name] = p.value;
    }
    return r;
  }

  private createProperty(name: string, value: string): Widget {
    const el = document.createElement('div');
    const elName = document.createElement('input');
    elName.type = 'text';
    elName.placeholder = 'name';
    elName.value = name;
    const elValue = document.createElement('input');
    elValue.type = 'text';
    elValue.placeholder = 'value';
    elValue.value = value;
    const elRemove = document.createElement('button');
    elRemove.textContent = '';
    elRemove.title = 'Remove this property';
    elRemove.classList.add('jupyter-button', 'widget-button', 'bx-button', 'icon', 'icon-close');

    el.append(elName, elValue, elRemove);
    const w = new Widget({ node: el });

    w.addClass('bx-spark-property');

    elName.addEventListener('change', (evt: Event) => this.onNameChange(evt, w));
    elValue.addEventListener('change', (evt: Event) => this.onValueChange(evt, w));
    elRemove.addEventListener('click', (evt: MouseEvent) => this.onRemoveClicked(evt, w));

    return w;
  }

  private getPropertyByName(name: string) {
    for (const p of this.properties) {
      if (p.name === name) {
        return p;
      }
    }
    return null;
  }

  private getPropertyByWidget(w: Widget) {
    for (const p of this.properties) {
      if (p.widget === w) {
        return p;
      }
    }
    return null;
  }

  private onRemoveClicked(evt: MouseEvent, w: Widget) {
    const p = this.getPropertyByWidget(w);
    if (p === null) {
      return;
    }
    MessageLoop.sendMessage(
      this.parent.parent,
      new SparkUIMessage('remove-property-clicked', {
        name: p.name,
      }),
    );
  }

  private onNameChange(evt: Event, w: Widget): void {
    const p = this.getPropertyByWidget(w);
    if (p === null) {
      return;
    }
    p.name = (evt.target as HTMLInputElement).value;
  }

  private onValueChange(evt: Event, w: Widget): void {
    const p = this.getPropertyByWidget(w);
    if (p === null) {
      return;
    }
    p.value = (evt.target as HTMLInputElement).value;
  }
}

export class ProfilePropertiesToolbar extends Panel {
  readonly LABEL_LINK_TEXT = 'Available properties';
  readonly LABEL_LINK_URL = 'https://spark.apache.org/docs/2.4.4/configuration.html#available-properties';
  readonly ADD_BUTTON_TEXT = '';
  readonly ADD_BUTTON_TITLE = 'Add property';

  constructor() {
    super();
    this.addWidget(this.createAvailableProperties());
    this.addWidget(this.createAdd());
  }

  private createAvailableProperties(): Widget {
    const el = document.createElement('label');
    const linkEl = document.createElement('a');

    linkEl.target = '_blank';
    linkEl.textContent = this.LABEL_LINK_TEXT;
    linkEl.href = this.LABEL_LINK_URL;

    el.append(linkEl);

    const w = new Widget({ node: el });

    w.addClass('widget-label');
    w.addClass('bx-spark-available-properties');

    return w;
  }

  private createAdd(): Widget {
    const el = document.createElement('button');

    el.textContent = this.ADD_BUTTON_TEXT;
    el.title = this.ADD_BUTTON_TITLE;

    el.addEventListener('click', (evt: MouseEvent) => this.onAddNewClicked(evt));

    const w = new Widget({ node: el });

    w.addClass('jupyter-button');
    w.addClass('widget-button');
    w.addClass('bx-button');
    w.addClass('icon-add');
    w.addClass('bx-spark-add');

    return w;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private onAddNewClicked(evt: MouseEvent): void {
    MessageLoop.sendMessage(this.parent.parent, new SparkUIMessage('add-new-property-clicked'));
  }
}
