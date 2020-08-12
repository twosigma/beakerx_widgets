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

import * as _ from 'underscore';
import * as d3 from 'd3';
import $ from 'jquery';
import { PlotStyleUtils } from '../../utils';
import { PlotLayout } from './PlotLayout';

export class ChartExtender {
  static extend(scope, element) {
    // rendering code
    element.find('.plot-plotcontainer').resizable({
      maxWidth: element.parent().width(), // no wider than the width of the cell
      minWidth: 450,
      minHeight: 150,
      handles: 'e, s, se',
      resize: function (event, ui) {
        scope.width = ui.size.width;
        scope.height = ui.size.height;
        _.extend(scope.layout.plotSize, ui.size);

        scope.jqsvg.css({ width: scope.width, height: scope.height });
        scope.jqplottitle.css({ width: scope.width });
        scope.emitSizeChange();
        scope.legendDone = false;
        scope.legendResetPosition = true;

        scope.update();
      },
    });

    scope.plotRange.calcMapping = function () {};

    scope.plotRange.calcRange = function () {};

    scope.calcLegendableItem = function () {
      scope.legendableItem = 0;
      const visitor = {
        i: 0,
        visit: function (node) {
          if (node.legend) {
            scope.legendableItem++;
          }
        },
      };
      scope.stdmodel.process(visitor);
    };

    scope.init = function () {
      // first standardize data
      scope.standardizeData();
      // init flags
      scope.initFlags();

      // create layout elements
      scope.initLayout();

      scope.resetSvg();

      scope.update();
      scope.adjustModelWidth();
      scope.emitSizeChange(true);
      this.pointsLimitModal.init();
    };

    scope.update = function () {
      if (scope.model.isShowOutput !== undefined && scope.model.isShowOutput() === false) {
        return;
      }
      scope.resetSvg();
      scope.renderData();
      scope.updateClipPath();
      scope.plotLegend.render(); // redraw
      scope.updateMargin(); //update plot margins
      scope.calcLegendableItem();
    };

    scope.updateClipPath = function () {
      scope.svg
        .select('#clipPath_' + scope.wrapperId + ' rect')
        .attr('x', 0)
        .attr('y', 0)
        .attr('height', PlotStyleUtils.safeHeight(scope.jqsvg))
        .attr('width', PlotStyleUtils.safeWidth(scope.jqsvg));
    };

    scope.initLayout = function () {
      scope.layout = new PlotLayout(scope);

      $('<div></div>')
        .appendTo(scope.jqlegendcontainer)
        .attr('id', 'tooltip')
        .attr('class', 'plot-tooltip')
        .attr('style', 'visibility: hidden');
      scope.tooltip = d3.select(element[0]).select('#tooltip');
    };

    scope.dumpState = function () {
      const state = {
        showAllItems: scope.showAllItems,
        plotSize: scope.layout.plotSize,
        showItem: [],
        visibleItem: scope.visibleItem,
        legendableItem: scope.legendableItem,
      };

      const data = scope.stdmodel.data;
      for (let i = 0; i < data.length; i++) {
        state.showItem[i] = data[i].showItem;
      }
      return state;
    };

    scope.loadState = function (state) {
      scope.showAllItems = state.showAllItems;
      scope.plotSize = state.plotSize;
      const data = scope.stdmodel.data;
      for (let i = 0; i < data.length; i++) {
        data[i].showItem = state.showItem[i];
      }
      scope.visibleItem = state.visibleItem;
      scope.legendableItem = state.legendableItem;
    };

    scope.initFlags = function () {
      scope.showAllItems = true;
    };
  }
}
