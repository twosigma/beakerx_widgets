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

import { BigNumberUtils } from '../../utils';
import { PlotLine } from './std/PlotLine';
import { TimeAxis } from './std/axis';

/* eslint-disable @typescript-eslint/no-var-requires */
const PlotBar = require('./_js/std/plotbar.js');
const PlotStem = require('./_js/std/plotstem.js');
const PlotArea = require('./_js/std/plotarea.js');
const PlotPoint = require('./_js/std/plotpoint.js');
const PlotConstline = require('./_js/std/plotconstline.js');
const PlotConstband = require('./_js/std/plotconstband.js');
const PlotText = require('./_js/std/plottext.js');
const PlotTreeMapNode = require('./_js/std/plottreemapnode.js');
const HeatMap = require('./_js/std/heatmap.js');
const PlotRaster = require('./_js/std/plotraster.js');
const PlotLineLodLoader = require('./_js/lodloader/plotLineLodLoader');
const PlotBarLodLoader = require('./_js/lodloader/plotBarLodLoader.js');
const PlotStemLodLoader = require('./_js/lodloader/plotStemLodLoader.js');
const PlotAreaLodLoader = require('./_js/lodloader/plotAreaLodLoader');
const PlotPointLodLoader = require('./_js/lodloader/plotPointLodLoader.js');
/* eslint-enable @typescript-eslint/no-var-requires */

export class PlotFactory {
  static createPlotItem(item: any, lodThreshold = 1500) {
    const size = item.elements.length ?? 0;
    let shouldApplyLod = size >= lodThreshold;
    if (shouldApplyLod) {
      for (let j = 1; j < item.elements.length; j++) {
        if (BigNumberUtils.lt(item.elements[j].x, item.elements[j - 1].x)) {
          console.warn('x values are not monotonic, LOD is disabled');
          shouldApplyLod = false;
          break;
        }
      }
    }

    let plotItem;
    switch (item.type) {
      case 'line':
        plotItem = shouldApplyLod ? new PlotLineLodLoader(item, lodThreshold) : new PlotLine(item);
        break;
      case 'bar':
        plotItem = shouldApplyLod ? new PlotBarLodLoader(item, lodThreshold) : new PlotBar(item);
        break;
      case 'stem':
        plotItem = shouldApplyLod ? new PlotStemLodLoader(item, lodThreshold) : new PlotStem(item);
        break;
      case 'area':
        plotItem = shouldApplyLod ? new PlotAreaLodLoader(item, lodThreshold) : new PlotArea(item);
        break;
      case 'point':
        plotItem = shouldApplyLod ? new PlotPointLodLoader(item, lodThreshold) : new PlotPoint(item);
        break;
      case 'constline':
        plotItem = new PlotConstline(item);
        break;
      case 'constband':
        plotItem = new PlotConstband(item);
        break;
      case 'text':
        plotItem = new PlotText(item);
        break;
      case 'treemapnode':
        plotItem = new PlotTreeMapNode(item);
        break;
      case 'heatmap':
        plotItem = new HeatMap(item);
        break;
      case 'raster':
        plotItem = new PlotRaster(item);
        break;
      default:
        console.error('no type specified for item creation');
    }

    return plotItem;
  }

  static recreatePlotItem(item: any) {
    switch (item.type) {
      case 'line':
        if (item.isLodItem === true) {
          item.__proto__ = PlotLineLodLoader.prototype;
        } else {
          item.__proto__ = PlotLine.prototype;
        }
        break;
      case 'bar':
        if (item.isLodItem === true) {
          item.__proto__ = PlotBarLodLoader.prototype;
        } else {
          item.__proto__ = PlotBar.prototype;
        }
        break;
      case 'stem':
        if (item.isLodItem === true) {
          item.__proto__ = PlotStemLodLoader.prototype;
        } else {
          item.__proto__ = PlotStem.prototype;
        }
        break;
      case 'area':
        if (item.isLodItem === true) {
          item.__proto__ = PlotAreaLodLoader.prototype;
        } else {
          item.__proto__ = PlotArea.prototype;
        }
        break;
      case 'point':
        if (item.isLodItem === true) {
          item.__proto__ = PlotPointLodLoader.prototype;
        } else {
          item.__proto__ = PlotPoint.prototype;
        }
        break;
      case 'constline':
        item.__proto__ = PlotConstline.prototype;
        break;
      case 'constband':
        item.__proto__ = PlotConstband.prototype;
        break;
      case 'text':
        item.__proto__ = PlotText.prototype;
        break;
      case 'axis':
        item.__proto__ = TimeAxis.prototype;
        break;
      case 'treemapnode':
        item.__proto__ = PlotTreeMapNode.prototype;
        break;
      case 'raster':
        item.__proto__ = PlotRaster.prototype;
        break;
      default:
        console.error('no type specified for item recreation');
    }
  }
}
