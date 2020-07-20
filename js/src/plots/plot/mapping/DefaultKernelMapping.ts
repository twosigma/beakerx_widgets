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

import { ModelData } from './ModelData';
import { StandardModelData } from './StandardModelData';
import { TreeMapModelData } from './TreeMapModelData';

export class DefaultKernelMapping {
  static mapModelData(modelData): ModelData {
    return {
      showLegend: modelData.showLegend,
      legendPosition: modelData.legendPosition ?? { position: 'TOP_RIGHT' },
      legendLayout: modelData.legendLayout ?? 'VERTICAL',
      useToolTip: modelData.useToolTip ?? false,
      margin: modelData.margin ?? {},
      plotSize: {
        width: modelData.width ?? 1200,
        height: modelData.height ?? 350,
      },
    };
  }

  static mapStandardPlotModelData(modelData): StandardModelData {
    return {
      nanoOffset: null,

      ...DefaultKernelMapping.mapModelData(modelData),

      orientation: modelData.orientation ?? 'VERTICAL',
      omitCheckboxes: modelData.omitCheckboxes,
      xAxis: modelData.xAxis ?? {},
      yAxis: modelData.yAxis ?? {},
      yAxisR: modelData.yAxisR,
      range: modelData.range ?? null,
      xCursor: modelData.xCursor,
      yCursor: modelData.yCursor,
      userFocus: modelData.focus ?? {},
      timezone: modelData.timezone,
      categoryNames: modelData.categoryNames,
      showXGridlines: !(modelData.orientation !== 'HORIZONTAL' && modelData.type === 'CategoryPlot'),
      categoryMargin: modelData.categoryMargin,
      categoryNamesLabelAngle: modelData.categoryNamesLabelAngle,
      cumulative: modelData.cumulative,
      binCount: modelData.binCount,
      normed: modelData.normed,
      rangeMin: modelData.rangeMin,
      rangeMax: modelData.rangeMax,
      displayMode: modelData.displayMode ?? 'OVERLAP',
      rightClose: modelData.rightClose,
      tips: modelData.tips ?? null,
      tooltips: modelData.tooltips,
      itemLabels: modelData.itemLabels,
    };
  }

  static mapTreeMapModelData(modelData): TreeMapModelData {
    return {
      ...DefaultKernelMapping.mapModelData(modelData),
      mode: modelData.mode,
      ratio: modelData.ratio,
      sticky: modelData.sticky,
      round: modelData.round,
      valueAccessor: modelData.valueAccessor,
    };
  }
}
