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
window.beakerx = {};
window.beakerxHolder = {};

import './public-path';
import $ from 'jquery';
import { TreeWidget } from './tree';
import { Widget } from '@lumino/widgets';

import 'flatpickr/dist/flatpickr.css';
import 'jquery-ui/themes/base/all.css';
import 'jquery-ui.combobox/lib/jquery-ui.combobox.css';
import '@lumino/widgets/style/index.css';
import '../css/beakerx_widgets.css';

if ((window as any).require) {
  (window as any).require.config({
    map: {
      '*': {
        beakerx: 'nbextensions/beakerx/index',
      },
    },
  });
}

export function load_ipython_extension(): void {
  const bxTabPane = $('<div>', {
    class: 'tab-pane',
    id: 'beakerx-tree',
  })
    .appendTo($('.tab-content'))
    .get(0);

  const widgetOptions = {
    baseUrl: (Jupyter.notebook_list || Jupyter.notebook).base_url,
    isLab: false,
  };
  const bxWidget = new TreeWidget(widgetOptions);

  Widget.attach(bxWidget, bxTabPane);

  $('#tabs').append(
    $('<li>').append(
      $('<a>', {
        id: 'beakerx_tab',
        href: '#beakerx-tree',
        'data-toggle': 'tab',
        text: 'BeakerX',
      }).on('click', function (e) {
        if (false === $(e.currentTarget).parents('li').hasClass('active')) {
          bxWidget.update();
        }
        if (window.location.hash === '#beakerx-tree') {
          return;
        }
        window.history.pushState(null, '', '#beakerx-tree');
      }),
    ),
  );

  $(window).on('resize', function () {
    bxWidget.update();
  });
}
