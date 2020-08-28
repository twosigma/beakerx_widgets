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
import * as _ from 'underscore';

import { Widget } from '@lumino/widgets';
import { Message, MessageLoop } from '@lumino/messaging';

import { IPropertiesJVMOptions } from '../../../utils/api';
import { PropertiesOptionsChangedMessage, SizeChangedMessage } from '../../Messages';

export class PropertiesWidget extends Widget {
  public readonly ADD_BUTTON_SELECTOR: string = '#add_property_jvm_sett';
  public readonly PROPERTIES_PANEL_SELECTOR: string = '#properties_property';

  public readonly HTML_ELEMENT_TEMPLATE = `
<fieldset>
  <div class="bx-panel">
    <div class="bx-panel-heading">

      Properties

      <button type="button"
        id="add_property_jvm_sett"
        class="bx-btn">
        <i class="fa fa-plus"></i>
      </button>
       
    </div>
    
    <div id="properties_property" class="bx-panel-body"></div>
  </div>
</fieldset>
`;

  private _elements: JQuery<HTMLElement>[] = [];

  public get $node(): JQuery<HTMLElement> {
    return $(this.node);
  }

  constructor() {
    super();

    $(this.HTML_ELEMENT_TEMPLATE).appendTo(this.node);

    this.$node.find(this.ADD_BUTTON_SELECTOR).on('click', this.addPropertyButtonClickedHandler.bind(this));
  }

  public onLoad(properties: IPropertiesJVMOptions) {
    this.clear();
    for (const property in properties) {
      this.addPropertyElement(properties[property].name, properties[property].value);
    }
  }

  public processMessage(msg: Message): void {
    switch (msg.type) {
      case TYPE_ELEMENT_ADDED:
        this.onElementAdded(msg as ElementAddedMessage);
        break;
      case TYPE_ELEMENT_REMOVED:
        this.onElementRemoved(msg as ElementRemovedMessage);
        break;
      default:
        super.processMessage(msg);
    }
  }

  private clear() {
    this._elements = [];
    this.$node.find(this.PROPERTIES_PANEL_SELECTOR).empty();
    MessageLoop.sendMessage(this.parent, new SizeChangedMessage());
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private addPropertyButtonClickedHandler(evt) {
    this.addPropertyElement();
  }

  private addPropertyElement(name = '', value = '') {
    const element = this.createFormRowElement()
      .append(this.createInputElement('name', name))
      .append(this.createInputElement('value', value))
      .append(this.createRemoveButtonElement());

    this._elements.push(element);

    element.appendTo(this.$node.find(this.PROPERTIES_PANEL_SELECTOR));

    MessageLoop.sendMessage(this, new ElementAddedMessage(element));
    MessageLoop.sendMessage(this.parent, new SizeChangedMessage());
  }

  private onElementAdded(msg: ElementAddedMessage): void {
    const addedElement = msg.element;
    addedElement.find('button').on(
      'click',
      {
        el: addedElement,
      },
      this.removePropertyButtonClickedHandler.bind(this),
    );

    this.propertiesChanged();

    addedElement.find('input').on('keyup', _.debounce(this.inputChangedHandler.bind(this), 1000));
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private onElementRemoved(msg: ElementRemovedMessage): void {
    this.propertiesChanged();
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private inputChangedHandler(evt): void {
    this.propertiesChanged();
  }

  private removePropertyButtonClickedHandler(evt) {
    const elementToRemove = evt.data.el;
    elementToRemove.remove();

    this._elements = this._elements.filter((el) => {
      return el !== elementToRemove;
    });

    MessageLoop.sendMessage(this, new ElementRemovedMessage(elementToRemove));
    MessageLoop.sendMessage(this.parent, new SizeChangedMessage());
  }

  private propertiesChanged() {
    const msg = new PropertiesOptionsChangedMessage(this.collectProperties());
    MessageLoop.sendMessage(this.parent, msg);
  }

  private collectProperties(): IPropertiesJVMOptions {
    const properties = [];
    for (const row of this._elements) {
      const inputs = row.find('input[placeholder]');
      const name = inputs.eq(0).val();
      const value = inputs.eq(1).val();
      if ('' === name) {
        continue;
      }
      properties.push({ name: name, value: value });
    }
    return properties;
  }

  private createFormRowElement(): JQuery<HTMLElement> {
    return $('<div>', {
      class: 'bx-form-row',
    });
  }

  private createInputElement(placeholder: string, val = ''): JQuery<HTMLElement> {
    return $('<input>', {
      class: 'bx-input-text',
      type: 'text',
      placeholder: placeholder,
    })
      .val(val)
      .data('val', val);
  }

  private createRemoveButtonElement(): JQuery<HTMLElement> {
    return $('<button>', {
      type: 'button',
      class: 'bx-btn',
    }).append($('<i>', { class: 'fa fa-times' }));
  }
}

const TYPE_ELEMENT_ADDED = 'element-added';

class ElementAddedMessage extends Message {
  constructor(element: JQuery<HTMLElement>) {
    super(TYPE_ELEMENT_ADDED);
    this._element = element;
  }

  public get element(): JQuery<HTMLElement> {
    return this._element;
  }

  private _element: JQuery<HTMLElement>;
}

const TYPE_ELEMENT_REMOVED = 'element-removed';

class ElementRemovedMessage extends Message {
  constructor(element: JQuery<HTMLElement>) {
    super(TYPE_ELEMENT_REMOVED);
    this._element = element;
  }

  public get element(): JQuery<HTMLElement> {
    return this._element;
  }

  private _element: JQuery<HTMLElement>;
}
