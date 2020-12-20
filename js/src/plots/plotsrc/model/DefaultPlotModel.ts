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

import { AbstractPlotModel } from './AbstractPlotModel';
import { PlotAxisFactory } from '../std';
import { PlotFocus } from '../zoom';
import { DefaultKernelMapping, GroovyKernelMapping, StandardModelData } from '../mapping';
import { PlotRange } from '../range';
import { BigNumberUtils, PlotUtils } from '../../../utils';
import { PlotFactory } from '../PlotFactory';

const DEFAULT_LINE_ITEM_WIDTH = 2;
const DEFAULT_BAR_ITEM_WIDTH = 1;

export class DefaultPlotModel extends AbstractPlotModel {
  createNewModel(model): StandardModelData {
    if (model.version === 'groovy') {
      // model returned from serializer
      return GroovyKernelMapping.mapStandardPlotModelData(model);
    }

    return DefaultKernelMapping.mapStandardPlotModelData(model);
  }

  format(newModel): void {
    this.formatModel(newModel); // fill in null entries, compute y2, etc.
    this.sortModelDataItems(newModel);

    // at this point, data is in standard format (log is applied as well)

    const yAxisData = [];
    const yAxisRData = [];

    this.addDataToAxes(newModel, yAxisRData, yAxisData);

    newModel.showLegend = newModel.showLegend ?? false;

    this.calculateAxisYRanges(newModel, yAxisData, yAxisRData);
    this.remapModel(newModel);
  }

  formatModel(newModel): void {
    this.formatCursor(newModel.xCursor);
    this.formatCursor(newModel.yCursor);

    const logX = newModel.xAxis.type === 'log';
    const logXBase = newModel.xAxis.base;
    const logY = newModel.yAxis.type === 'log';
    const logYBase = newModel.yAxis.base;

    this.applyOrientation(newModel);
    this.formatModelData(newModel, logX, logXBase, logY, logYBase);
    this.applyLogToFocus(newModel, logX, logXBase, logY, logYBase);
  }

  sortModelDataItems(model): void {
    for (const item of model.data) {
      if (
        item.type === 'treemapnode' ||
        item.type === 'constline' ||
        item.type === 'constband' ||
        item.type === 'heatmap'
      ) {
        continue;
      }

      const elements = item.elements;
      let unordered = false;

      for (let i = 1; i < elements.length; i++) {
        if (BigNumberUtils.lt(elements[i].x, elements[i - 1].x)) {
          unordered = true;
          break;
        }
      }

      if (!unordered) {
        continue;
      }

      if (item.type === 'bar' || item.type === 'stem' || item.type === 'point' || item.type === 'text') {
        elements.sort((a, b) => {
          BigNumberUtils.minus(a.x, b.x);
        });
      } else {
        item.isUnorderedItem = true;
      }
    }
  }

  addDataToAxes(newModel, yAxisRData: any[], yAxisData: any[]): void {
    for (const item of newModel.data) {
      if ([null, undefined].includes(newModel.showLegend) && item.legend) {
        newModel.showLegend = true;
      }

      if (PlotUtils.useYAxisR(newModel, item)) {
        yAxisRData.push(item);
      } else {
        yAxisData.push(item);
      }
    }
  }

  calculateAxisYRanges(newModel, yAxisData: any[], yAxisRData: any[]): void {
    let range = PlotUtils.getDataRange(yAxisData).dataRange;
    let rangeR = newModel.yAxisR ? PlotUtils.getDataRange(yAxisRData).dataRange : null;

    range = this.applyMargins(range, newModel.yAxis);

    if (rangeR) {
      rangeR = this.applyMargins(rangeR, newModel.yAxisR);
    }

    if (newModel.yIncludeZero === true && range.yl > 0) {
      range.yl = 0;
      range.ySpan = range.yr - range.yl;
    }

    if (rangeR && newModel.yRIncludeZero === true && rangeR.yl > 0) {
      rangeR.yl = 0;
      rangeR.ySpan = rangeR.yr - rangeR.yl;
    }

    this.calculateMargin(newModel);
    this.calculateVisibleRange(newModel, range, rangeR);
  }

  remapModel(model): void {
    // map data entrie to [0, 1] of axis range
    const xAxis = PlotAxisFactory.getPlotAxis(model.xAxis.type);

    model.xAxis = PlotRange.updateAxisXRange(xAxis, model);
    model.yAxis = PlotRange.updateAxisYRange(model.yAxis, model.vrange, model);
    model.yAxisR = PlotRange.updateAxisYRange(model.yAxisR, model.vrangeR, model);

    for (const item of model.data) {
      if (item.type === 'treemapnode') {
        continue;
      }

      // map coordinates using percentage
      // tooltips are possibly generated at the same time
      if (PlotUtils.useYAxisR(model, item)) {
        item.applyAxis(xAxis, model.yAxisR);
      } else {
        item.applyAxis(xAxis, model.yAxis);
      }
    }

    PlotFocus.remapFocusRegion(model);
  }

  applyMargins(range, axis) {
    axis.lowerMargin = axis.lowerMargin || 0;
    axis.upperMargin = axis.upperMargin || 0;

    const span = range.yr - range.yl;

    range.yl -= axis.lowerMargin * span;
    range.yr += axis.upperMargin * span;
    range.yspan = range.yr - range.yl;

    return range;
  }

  calculateMargin(newModel): void {
    const margin = newModel.margin;

    if (margin.bottom === null) {
      margin.bottom = 0.05;
    }

    if (margin.top === null) {
      margin.top = 0.05;
    }

    if (margin.left === null) {
      margin.left = 0.05;
    }

    if (margin.right === null) {
      margin.right = 0.05;
    }
  }

  formatCursor(cursor): void {
    if (!cursor) {
      return;
    }

    if (cursor.color === null) {
      cursor.color = 'black';
    }

    if (cursor.width === null) {
      cursor.width = 1;
    }

    cursor.stroke_dasharray = this.lineDasharrayMap[cursor.style];
  }

  applyOrientation(newModel): void {
    if (newModel.orientation !== 'HORIZONTAL') {
      return;
    }

    const temp = newModel.xAxis;
    newModel.xAxis = newModel.yAxis;
    newModel.yAxis = temp;
  }

  formatModelData(newModel, logX: boolean, logXBase: number, logY: boolean, logYBase: number): void {
    const logYR = newModel.yAxisR && newModel.yAxisR.type === 'log';
    const logYRBase = newModel.yAxisR?.base ?? undefined;

    if (!newModel.data) {
      newModel.data = [];
    }

    for (let i = 0; i < newModel.data.length; i++) {
      this.formatModelDataItem(i, newModel, logX, logXBase, logY, logYBase, logYR, logYRBase);
    }
  }

  formatModelDataItem(i: number, newModel, logX: boolean, logXBase: number, logY, logYBase, logYR, logYRBase) {
    const item = newModel.data[i];
    const elements = item.elements || [];
    let useYAxisR;
    let itemLogY;
    let itemLogYBase;

    if (item.type !== 'treemapnode') {
      useYAxisR = PlotUtils.useYAxisR(newModel, item);
      itemLogY = useYAxisR ? logYR : logY;
      itemLogYBase = useYAxisR ? logYRBase : logYBase;
    }

    item.showItem = true;

    if (!item.type) {
      item.type = 'line';
    }

    if (item.type === 'line' || item.type === 'constline') {
      item.style = item.style || 'solid';
      item.stroke_dasharray = this.lineDasharrayMap[item.style];
    }

    if (item.type === 'point') {
      item.shape = item.shape || 'rect';
      item.size = item.size || (item.shape === 'rect' ? 8 : 5);
    }

    if (item.useToolTip == null) {
      item.useToolTip = newModel.useToolTip === true;
    }

    this.setItemWidth(item);
    this.setItemColor(item);
    this.setItemOutline(item);
    this.setItemOpacity(item);

    for (let i = 0; i < elements.length; i++) {
      this.formatModelDataItemElement(item, elements[i], itemLogY, itemLogYBase, logX, logXBase);
      this.applyOrientationToItemElement(newModel, item, elements[i]);
    }

    this.applyOrientationToItem(newModel, item);

    // recreate rendering objects
    item.index = i;
    item.id = 'i' + i;

    newModel.data[i] = PlotFactory.createPlotItem(item, newModel.lodThreshold);
  }

  setItemWidth(item): void {
    if (item.type === 'line' || item.type === 'stem') {
      item.width = item.width || DEFAULT_LINE_ITEM_WIDTH;
    }

    if (item.type === 'bar' && item.width === null) {
      item.width = DEFAULT_BAR_ITEM_WIDTH;
    }
  }

  setItemColor(item): void {
    if (item.type === 'constline' || item.type === 'constband' || item.type === 'line') {
      item.color = item.color || 'black';
    }
  }

  setItemOutline(item): void {
    if (item.outlineColor ?? false) {
      item.stroke = item.outlineColor;
      delete item.outlineColor;
    }

    if (item.outlineWidth ?? false) {
      item.stroke_width = item.outlineWidth;
      delete item.outlineWidth;
    }

    if (item.outlineOpacity ?? false) {
      item.stroke_opacity = item.outlineOpacity;
      delete item.outlineOpacity;
    }
  }

  setItemOpacity(item): void {
    if (item.colorOpacity ?? false) {
      item.color_opacity = item.colorOpacity;
      delete item.colorOpacity;
    }

    if (item.color_opacity ?? false) {
      item.color_opacity = item.color_opacity ?? 1.0; // default show fully
    }

    if (item.stroke_opacity == null) {
      // default show based on whether stroke is set
      item.stroke_opacity = item.stroke == null ? 0.0 : 1.0;
    }
  }

  formatModelDataItemElement(
    item,
    element,
    itemLogY: boolean,
    itemLogYBase: number,
    logX: boolean,
    logXBase: number,
  ): void {
    if (item.type === 'stem') {
      element.stroke_dasharray = this.lineDasharrayMap[element.style];
    }

    if (element.outlineColor != null) {
      element.stroke = element.outlineColor;
      delete element.outlineColor;
    }

    if (element.outlineWidth != null) {
      element.stroke_width = element.outlineWidth;
      delete element.outlineWidth;
    }

    if (element.outlineOpacity != null) {
      element.stroke_opacity = element.outlineOpacity;
      delete element.outlineOpacity;
    }

    if (item.type === 'bar' && element.x2 == null) {
      element.x = BigNumberUtils.minus(element.x, item.width / 2);
      element.x2 = BigNumberUtils.plus(element.x, item.width);
    }

    if ((item.type === 'area' || item.type === 'bar' || item.type === 'stem') && element.y2 == null) {
      if (item.height != null) {
        element.y2 = element.y + item.height;
      } else if (item.base != null) {
        element.y2 = item.base;
      } else {
        element.y2 = itemLogY ? 1 : 0;
      }
    }

    if (item.type === 'point' && element.size == null) {
      element.size = item.size || (item.shape === 'rect' ? 8 : 5);
    }

    if (item.type === 'area') {
      item.interpolation = item.interpolation || 'linear';
    }

    // swap y, y2
    if (element.y != null && element.y2 != null && element.y > element.y2) {
      const temp = element.y;

      element.y = element.y2;
      element.y2 = temp;
    }

    if (element.x != null) {
      element._x = element.x;
      if (logX) {
        element.x = Math.log(element.x) / Math.log(logXBase);
      }
    }

    if (element.x2 != null) {
      element._x2 = element.x2;
      if (logX) {
        element.x2 = Math.log(element.x2) / Math.log(logXBase);
      }
    }

    if (element.y != null) {
      element._y = element.y;

      if (itemLogY) {
        element.y = Math.log(element.y) / Math.log(itemLogYBase);
      }
    }

    if (element.y2 != null) {
      element._y2 = element.y2;

      if (itemLogY) {
        element.y2 = Math.log(element.y2) / Math.log(itemLogYBase);
      }
    }
  }

  applyOrientationToItemElement(newModel, item, element): void {
    if (newModel.orientation !== 'HORIZONTAL') {
      return;
    }

    const temp = {
      x: element.y,
      x2: element.y2,
      y: element.x,
      y2: element.x2,
    };

    element.x = temp.x;
    element.x2 = temp.x2;
    element.y = temp.y;
    element.y2 = temp.y2;

    element._x = element.x;
    element._x2 = element.x2;
    element._y = element.y;
    element._y2 = element.y2;

    if (item.type === 'stem') {
      element.y2 = element.y;
      element._y2 = element._y;
    }
  }

  applyOrientationToItem(newModel, item): void {
    if (newModel.orientation !== 'HORIZONTAL') {
      return;
    }

    const temp = item.x;

    item.x = item.y;
    item.y = temp;
  }

  applyLogToFocus(newModel, logX: boolean, logXBase: number, logY: boolean, logYBase: number): void {
    const focus = newModel.userFocus;

    this.applyLogToFocusX(focus, logX, logXBase);
    this.applyLogToFocusY(focus, logY, logYBase);
  }

  applyLogToFocusX(focus, logX: boolean, logXBase: number): void {
    if (!logX) {
      return;
    }

    if (focus.xl ?? false) {
      focus.xl = Math.log(focus.xl) / Math.log(logXBase);
    }

    if (focus.xr ?? false) {
      focus.xr = Math.log(focus.xr) / Math.log(logXBase);
    }
  }

  applyLogToFocusY(focus, logY: boolean, logYBase: number): void {
    if (!logY) {
      return;
    }

    if (focus.yl ?? false) {
      focus.yl = Math.log(focus.yl) / Math.log(logYBase);
    }

    if (focus.yr ?? false) {
      focus.yr = Math.log(focus.yr) / Math.log(logYBase);
    }

    if (focus.yl_r ?? false) {
      focus.yl_r = Math.log(focus.yl_r) / Math.log(logYBase);
    }

    if (focus.yr_r ?? false) {
      focus.yr_r = Math.log(focus.yr_r) / Math.log(logYBase);
    }
  }

  calculateVisibleRange(newModel, range, rangeR): void {
    if (newModel.vrange) {
      return;
    }

    // visible range initially is 10x larger than data range by default
    newModel.vrange = this.getModelRange(newModel, range, newModel.xAxis.type === 'log', newModel.yAxis.type === 'log');

    if (newModel.yAxisR) {
      newModel.vrangeR = this.getModelRange(
        newModel,
        rangeR,
        newModel.xAxis.type === 'log',
        newModel.yAxisR.type === 'log',
      );
    }

    this.applyFocusToVisibleRange(newModel, range);
    this.updateRangeSpan(newModel.vrange);
    this.updateRangeSpan(newModel.vrangeR);
  }

  getModelRange(
    newModel,
    range,
    logX: boolean,
    logY: boolean,
  ): null | {
    xl: BigJs.Big | number | string;
    xr: BigJs.Big | number | string;
    yl: number;
    yr: number;
  } {
    if (range == null) {
      return null;
    }

    const result = {
      xl: BigNumberUtils.minus(range.xl, range.xSpan * 10.0),
      xr: BigNumberUtils.plus(range.xr, range.xSpan * 10.0),
      yl: range.yl - range.ySpan * 10.0,
      yr: range.yr + range.ySpan * 10.0,
    };

    if (logX) {
      result.xl = BigNumberUtils.max(result.xl, BigNumberUtils.minus(range.xl, newModel.margin.left * range.xSpan));
    }

    if (logY) {
      result.yl = Math.max(result.yl, range.yl - newModel.margin.left * range.ySpan);
    }

    return result;
  }

  applyFocusToVisibleRange(newModel, range): void {
    const vRange = newModel.vrange;
    const vRangeR = newModel.vrangeR;
    const focus = newModel.userFocus; // allow user to overide vrange

    if (newModel.yPreventNegative === true) {
      newModel.vrange.yl = Math.min(0, range.yl);
    }

    if (focus.xl ?? false) {
      vRange.xl = Math.min(focus.xl, vRange.xl);
    }

    if (focus.xr ?? false) {
      vRange.xr = Math.max(focus.xr, vRange.xr);
    }

    if (focus.yl ?? false) {
      vRange.yl = Math.min(focus.yl, vRange.yl);
    }

    if (focus.yr ?? false) {
      vRange.yr = Math.max(focus.yr, vRange.yr);
    }

    if (vRangeR && (focus.yl_r ?? false)) {
      vRangeR.yl = Math.min(focus.yl_r, vRangeR.yl);
    }

    if (vRangeR && (focus.yr_r ?? false)) {
      vRangeR.yr = Math.max(focus.yr_r, vRangeR.yr);
    }
  }

  updateRangeSpan(range): void {
    if (!range) {
      return;
    }

    range.xSpan = BigNumberUtils.minus(range.xr, range.xl);
    range.ySpan = range.yr - range.yl;
  }
}
