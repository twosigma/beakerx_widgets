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

import * as d3 from 'd3';
import * as _ from 'underscore';
import $ from 'jquery';
import { PlotTip } from '../PlotTip';
import { PlotStyleUtils, PlotUtils } from '../../../utils';

export class SaveAsContextMenu {
  static saveAsSvg(scope) {
    const svgToSave = SaveAsContextMenu.getSvgToSave(scope);

    PlotUtils.addInlineFonts(svgToSave);

    const html = PlotStyleUtils.convertToXHTML(svgToSave.outerHTML);
    const fileName = _.isEmpty(scope.stdmodel.title) ? 'plot' : scope.stdmodel.title;

    PlotUtils.download(`data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(html)))}`, `${fileName}.svg`);
  }

  static saveAsPng(scale, scope) {
    const svg: SVGElement = SaveAsContextMenu.getSvgToSave(scope);

    PlotUtils.addInlineFonts(svg);
    scale = scale === undefined ? 1 : scale;

    scope.canvas.width = Number(svg.getAttribute('width')) * scale;
    scope.canvas.height = Number(svg.getAttribute('height')) * scale;

    const html = PlotStyleUtils.convertToXHTML(svg.outerHTML);
    const imgsrc = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(html)));
    const fileName = _.isEmpty(scope.stdmodel.title) ? 'plot' : scope.stdmodel.title;

    PlotUtils.drawPng(scope.canvas, imgsrc, fileName + '.png');
  }

  static getSvgToSave(scope) {
    const svg = scope.svg.node().cloneNode(true);

    SaveAsContextMenu.setAttributes(svg);

    const plotTitle = scope.jqplottitle;
    const titleOuterHeight = PlotStyleUtils.getActualCss(plotTitle, 'outerHeight', true);

    SaveAsContextMenu.addLegend(scope, svg, plotTitle, titleOuterHeight);
    SaveAsContextMenu.addTooltips(scope, svg, plotTitle, titleOuterHeight);

    return SaveAsContextMenu.addCustomStyles(scope, svg);
  }

  private static setAttributes(svg) {
    svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

    if (document.body.classList.contains('improveFonts')) {
      svg.setAttribute('class', 'svg-export improveFonts');
    } else {
      svg.setAttribute('class', 'svg-export');
    }
  }

  private static addLegend(scope, svg, plotTitle, titleOuterHeight) {
    SaveAsContextMenu.adjustSvgPositionWithLegend(scope, svg, titleOuterHeight);
    scope.plotLegend.appendLegendToSvg(d3.select(svg));
  }

  private static addTooltips(scope, svg, plotTitle, titleOuterHeight) {
    PlotTip.appendTooltipsToSvg(scope, d3.select(svg));
    PlotUtils.translateChildren(svg, 0, titleOuterHeight);
    PlotUtils.addTitleToSvg(svg, plotTitle, {
      width: plotTitle.width(),
      height: PlotStyleUtils.getActualCss(plotTitle, 'outerHeight'),
    });
  }

  private static addCustomStyles(scope, svg) {
    const cellModel = scope.getCellModel();
    let extraStyles = [];
    let styleString = '';

    if (cellModel.element_styles) {
      for (const style in cellModel.element_styles) {
        styleString = cellModel.element_styles[style];

        if (style === '.plot-title') {
          styleString = PlotUtils.adjustStyleForSvg(styleString);
        }

        extraStyles.push(style + ' {' + styleString + '}');
      }
    }

    if (cellModel.custom_styles) {
      extraStyles = extraStyles.concat(cellModel.custom_styles);
    }

    PlotUtils.addInlineStyles(svg, extraStyles);

    return SaveAsContextMenu.svgReplaceNbspCharacters(svg);
  }

  private static adjustSvgPositionWithLegend(scope, svg, titleOuterHeight) {
    const W = PlotStyleUtils.outerWidth(scope.jqlegendcontainer);
    let H = PlotStyleUtils.outerHeight(scope.jqlegendcontainer);

    H += titleOuterHeight;

    svg.setAttribute('width', W);
    svg.setAttribute('height', H);
    $(svg).css('width', W);
    $(svg).css('height', H);
  }

  private static svgReplaceNbspCharacters(svg: SVGElement) {
    svg.innerHTML = svg.innerHTML.replace(/&nbsp;/g, ' ');

    return svg;
  }
}
