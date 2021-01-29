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

import { Big } from 'big.js';
import { BigNumberUtils } from './BigNumberUtils';
import { CommonUtils } from './CommonUtils';
import { PlotStyleUtils } from './PlotStyleUtils';
import * as d3 from 'd3';
import $ from 'jquery';
import LatoRegular from './../../fonts/lato/Lato-Regular.woff';
import LatoBlack from './../../fonts/lato/Lato-Black.woff';

/* eslint-disable @typescript-eslint/no-explicit-any */
type ScopeType = any;
type MenuItemType = { name: string; callback: () => void } | { name: string; items: MenuItemType[] };
type DataType = any;
type PlotModelType = any;
type AxisType = any;
type ActionObjectType = any;

/* eslint-enable @typescript-eslint/no-explicit-any */

interface IBin {
  x: number;
  y: number;
  dx: number;
}

interface IDataRange {
  xl: Big | number | string;
  xr: Big | number | string;
  yl: number;
  yr: number;
  xSpan: Big | number | string;
  ySpan: number;
}

export class PlotUtils {
  public static get fonts(): { labelWidth: number; labelHeight: number; tooltipWidth: number } {
    return {
      labelWidth: 6,
      labelHeight: 12,
      tooltipWidth: 10,
    };
  }

  // todo scope and return type
  public static getSavePlotAsContextMenuItems(scope: ScopeType): MenuItemType[] {
    return [
      {
        name: 'Save as SVG',
        callback: () => {
          scope.saveAsSvg();
        },
      },
      {
        name: 'Save as PNG',
        callback: () => {
          scope.saveAsPng();
        },
      },
      {
        name: 'Save as PNG at high DPI...',
        items: [2, 3, 4, 5].map((scale) => {
          return {
            name: scale + 'x',
            callback: () => scope.saveAsPng(scale),
          };
        }),
      },
    ];
  }

  public static useYAxisR(model: PlotModelType, data: DataType): boolean {
    const modelAxis = model.yAxisR;
    const dataAxis = data.yAxis;

    if (dataAxis && Object.prototype.hasOwnProperty.call(dataAxis, 'label')) {
      return modelAxis && modelAxis.label === dataAxis.label;
    }
    return modelAxis && modelAxis.label === dataAxis;
  }

  public static getDataRange(data: DataType): { dataRange: IDataRange; visibleItems: number; legendItems: number } {
    const dataRange: IDataRange = {
      xl: Infinity,
      xr: -Infinity,
      yl: Infinity,
      yr: -Infinity,
      xSpan: Infinity,
      ySpan: Infinity,
    };
    let visibleItems = 0;
    let legendItems = 0;

    for (const dataItem of data) {
      if (dataItem.legend !== null && dataItem !== '') {
        legendItems++;
      }
      if (dataItem.showItem === false) {
        continue;
      }
      visibleItems++;
      const itemRange = dataItem.getRange();
      this.updateRange(dataRange, itemRange);
    }

    if (dataRange.xl === Infinity && dataRange.xr !== -Infinity) {
      dataRange.xl = BigNumberUtils.minus(dataRange.xr, 1);
    } else if (dataRange.xr === -Infinity && dataRange.xl !== Infinity) {
      dataRange.xr = BigNumberUtils.plus(dataRange.xl, 1);
    } else if (visibleItems === 0 || dataRange.xl === Infinity) {
      dataRange.xl = 0;
      dataRange.xr = 1;
    } else if (BigNumberUtils.gt(dataRange.xl, dataRange.xr)) {
      const temp = dataRange.xl;
      dataRange.xl = dataRange.xr;
      dataRange.xr = temp;
    }

    if (dataRange.yl === Infinity && dataRange.yr !== -Infinity) {
      dataRange.yl = dataRange.yr - 1;
    } else if (dataRange.yr === -Infinity && dataRange.yl !== Infinity) {
      dataRange.yr = dataRange.yl + 1;
    }
    if (visibleItems === 0 || dataRange.yl === Infinity) {
      dataRange.yl = 0;
      dataRange.yr = 1;
    } else if (dataRange.yl > dataRange.yr) {
      const temp = dataRange.yl;
      dataRange.yl = dataRange.yr;
      dataRange.yr = temp;
    }

    const increaseRange = (value: Big | number | string) => {
      const v = BigNumberUtils.eq(value, 0) ? 1 : value || 1;
      return BigNumberUtils.plus(value, BigNumberUtils.div(v, 10));
    };
    const decreaseRange = (value: Big | number | string) => {
      const v = BigNumberUtils.eq(value, 0) ? 1 : value || 1;
      return BigNumberUtils.minus(value, BigNumberUtils.div(v, 10));
    };

    if (BigNumberUtils.eq(dataRange.xl, dataRange.xr)) {
      dataRange.xl = decreaseRange(dataRange.xl);
      dataRange.xr = increaseRange(dataRange.xr);
    }
    if (dataRange.yl === dataRange.yr) {
      dataRange.yl = decreaseRange(dataRange.yl) as number;
      dataRange.yr = increaseRange(dataRange.yr) as number;
    }

    dataRange.xSpan = BigNumberUtils.minus(dataRange.xr, dataRange.xl);
    dataRange.ySpan = dataRange.yr - dataRange.yl;

    return {
      dataRange: dataRange,
      visibleItems: visibleItems,
      legendItems: legendItems,
    };
  }

  public static rangeAssert(list: number[]): boolean {
    for (const listItem of list) {
      if (Math.abs(listItem) > 1e6) {
        console.error('data not shown due to too large coordinate');
        return true;
      }
    }
    return false;
  }

  public static convertInfinityValue(value: unknown): number | unknown {
    if (value === 'Infinity') {
      return Infinity;
    }
    if (value === '-Infinity') {
      return -Infinity;
    }
    return value;
  }

  public static getHighlightDuration(): number {
    return 100;
  }

  public static getHighlightedSize(size: number, highlighted: boolean): string {
    const newSize = size + this.getHighlightedDiff(highlighted);
    return newSize.toString();
  }

  public static getTipStringPercent(pct: any, axis: AxisType, fixed?: boolean | number): string {
    let val = axis.getValue(pct);
    if (axis.axisType === 'log') {
      val = axis.axisPow(pct);
      return this.getTipString(val, axis, fixed) + ' (' + axis.getString(pct) + ')';
    }
    return this.getTipString(val, axis, fixed);
  }

  public static getTipString(val: Big | number | string, axis: AxisType, fixed: boolean | number): string {
    if (axis.axisType === 'time') {
      return CommonUtils.formatTimestamp(val as number, axis.axisTimezone, 'YYYY MMM DD ddd, HH:mm:ss .SSS');
    }
    if (axis.axisType === 'nanotime') {
      val = val as Big;
      const nanosec = val.mod(1000000000).toFixed(0);
      return (
        CommonUtils.formatTimestamp(
          parseFloat(val.div(1000000).toFixed(0)),
          axis.axisTimezone,
          'YYYY MMM DD ddd, HH:mm:ss',
        ) +
        '.' +
        CommonUtils.padStr((nanosec as unknown) as number, 9)
      );
    }

    if (typeof val === 'number') {
      if (fixed === true) {
        // do nothing, keep full val
      } else if (typeof fixed === 'number') {
        val = val.toFixed(fixed);
      } else {
        val = val.toFixed(axis.axisFixed);
      }
    }

    return `${val}`;
  }

  public static createTipString(obj: any): string {
    let txt = '';

    for (const key of Object.keys(obj)) {
      const value = obj[key];
      if (key === 'title') {
        txt += `<div style="font-weight:bold">${value}</div>`;
      } else {
        txt += `<div>${key}: ${value}</div>`;
      }
    }
    return txt;
  }

  public static drawPng(canvas: HTMLCanvasElement, imgsrc: string, fileName: string): void {
    const download = this.download;
    const context = canvas.getContext('2d') as CanvasRenderingContext2D;
    const image = new Image();
    image.onload = function () {
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      download(canvas.toDataURL('image/png'), fileName);
      context.clearRect(0, 0, canvas.width, canvas.height);
      image.remove();
    };

    image.src = imgsrc;
  }

  public static download(url: string, fileName: string): void {
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    PlotUtils.fireClickEvent(a);
    a.remove();
  }

  public static translate(jqelement: JQuery<Element>, x: number, y: number): void {
    const getNumber = (str: string) => parseFloat(str.substring(0, str.length - 2));
    const transform = jqelement.css('transform');
    const elementTranslate = { x: 0, y: 0 };

    if (transform && transform.indexOf('translate') !== -1) {
      const translate = (transform.match(/translate(.*)/) as string[])[1].substring(1);
      const translateValues = translate.substring(0, translate.indexOf(')')).split(', ');
      elementTranslate.x = getNumber(translateValues[0]);
      elementTranslate.y = getNumber(translateValues[1]);
    }
    jqelement.css('transform', `translate(${elementTranslate.x + x}px, ${elementTranslate.y + y}px)`);
  }

  public static translateChildren(element: Element, x: number, y: number): void {
    for (let j = 0; j < element.childElementCount; j++) {
      const child = element.children[j];
      if (child.nodeName.toLowerCase() !== 'defs') {
        this.translate($(child), x, y);
      }
    }
  }

  public static getActionObject(
    plotType: 'CategoryPlot' | 'CombinedPlot',
    e: any,
    subplotIndex?: number,
  ): ActionObjectType {
    const actionObject: ActionObjectType = {};
    if (plotType === 'CategoryPlot') {
      if (e.ele !== null) {
        actionObject.category = e.ele.category;
        actionObject.series = e.ele.series;
        actionObject.type = 'CategoryGraphicsActionObject';
      }
    } else {
      if (plotType === 'CombinedPlot') {
        actionObject.subplotIndex = subplotIndex;
        actionObject.type = 'CombinedPlotActionObject';
      } else {
        actionObject.type = 'XYGraphicsActionObject';
      }
      if (e.ele != null) {
        actionObject.index = e.ele.index;
      }
    }
    return actionObject;
  }

  public static addTitleToSvg(svg, jqtitle, titleSize) {
    const title = jqtitle.clone();
    title.find('style').remove();
    d3.select(svg)
      .insert('text', 'g')
      .attr('id', jqtitle.attr('id'))
      .attr('class', jqtitle.attr('class'))
      .attr('x', titleSize.width / 2)
      .attr('y', titleSize.height)
      .style('text-anchor', 'middle')
      .text(title.text());

    title.remove();
  }

  private static fireClickEvent(a: HTMLAnchorElement) {
    if (document.createEvent) {
      const evObj = document.createEvent('MouseEvents');
      evObj.initEvent('click', true, false);
      a.dispatchEvent(evObj);
      return;
    }
  }

  private static getHighlightedDiff(highlighted: boolean): number {
    return highlighted ? 2 : 0;
  }

  public static addInlineFonts(element): void {
    const styleEl = document.createElement('style');
    styleEl.setAttribute('type', 'text/css');
    let fontFace = '';

    fontFace += this.getFontToInject({
      fontFamily: 'Lato',
      urlformats: [
        {
          base64: LatoRegular,
          format: 'woff',
        },
      ],
      fontWeight: 'normal',
      fontStyle: 'normal',
    });
    fontFace += this.getFontToInject({
      fontFamily: 'Lato',
      urlformats: [
        {
          base64: LatoBlack,
          format: 'woff',
        },
      ],
      fontWeight: 'bold',
      fontStyle: 'normal',
    });

    styleEl.innerHTML = '<![CDATA[\n' + fontFace + '\n]]>';
    const defsEl = document.createElement('defs');
    defsEl.appendChild(styleEl);
    element.insertBefore(defsEl, element.firstChild);
  }

  public static getFontToInject(font) {
    let src = '';
    for (const fontDef of font.urlformats) {
      src += `url('${fontDef.base64}')`;
    }
    src = src.replace(/,\s*$/, '');

    return `@font-face {
      font-family: '${font.fontFamily}';
      src: ${src};
      font-weight: ${font.fontWeight};
      font-style: ${font.fontWeight};
    }
    `;
  }

  public static adjustStyleForSvg(styleString: string): string {
    const colorArr = styleString.match(/color:(.*);/g);
    if (colorArr && colorArr.length) {
      const fill = colorArr[0].replace('color:', 'fill:');
      styleString += fill;
    }
    return styleString;
  }

  public static addInlineStyles(element, extraStyles): void {
    const styleEl = document.createElement('style');
    styleEl.setAttribute('type', 'text/css');
    const elementStyles = PlotStyleUtils.getElementStyles(element);

    let extraStylesCss = '';
    if (extraStyles) {
      extraStylesCss = extraStyles.join('\n');
    }

    styleEl.innerHTML = '<![CDATA[\n' + elementStyles + '\n' + extraStylesCss + '\n]]>';
    const defsEl = document.createElement('defs');
    defsEl.appendChild(styleEl);
    element.insertBefore(defsEl, element.firstChild);
  }

  public static getFileSynchronously(file: string): string {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', file, false);
    xhr.overrideMimeType('text/plain; charset=x-user-defined');
    xhr.send(null);
    return xhr.responseText;
  }

  public static histogram(
    rightClose: boolean,
    binCount: number,
    rangeMin: number,
    rangeMax: number,
    dataset: number[],
  ): IBin[] {
    return new Histogram(rightClose, binCount, rangeMin, rangeMax, dataset).values();
  }

  public static upper_bound(elements: unknown[], attr: string, val: Big | number | string): number {
    let l = 0;
    let r = elements.length - 1;
    while (l <= r) {
      const m = Math.floor((l + r) / 2);
      if (BigNumberUtils.gte(elements[m][attr], val)) {
        r = m - 1;
      } else {
        l = m + 1;
      }
    }
    return r;
  }

  private static updateRange(dataRange: IDataRange, itemRange: IDataRange): void {
    if (itemRange.xl !== null) {
      dataRange.xl = BigNumberUtils.min(dataRange.xl, itemRange.xl);
    }
    if (itemRange.xr !== null) {
      dataRange.xr = BigNumberUtils.max(dataRange.xr, itemRange.xr);
    }
    if (itemRange.yl !== null) {
      dataRange.yl = Math.min(dataRange.yl, itemRange.yl);
    }
    if (itemRange.yr !== null) {
      dataRange.yr = Math.max(dataRange.yr, itemRange.yr);
    }
  }
}

class Histogram {
  private bins: IBin[] = [];

  constructor(
    private rightClose: boolean,
    private binCount: number,
    rangeMin: number,
    rangeMax: number,
    data: number[],
  ) {
    const values: number[] = data.map(Number, this);
    const thresholds = this.calcThresholds([rangeMin ?? d3.min(values), rangeMax ?? d3.max(values)], values);
    let bin: IBin;
    let i = -1;
    const k = 1;
    let x;

    while (++i < thresholds.length - 1) {
      this.bins[i] = bin = {
        x: thresholds[i],
        y: 0,
        dx: thresholds[i + 1] - thresholds[i],
      };
    }

    if (thresholds.length === 1) {
      return;
    }

    i = -1;
    while (++i < values.length) {
      x = values[i];
      if (x >= rangeMin && x <= rangeMax) {
        bin = rightClose
          ? this.bins[d3.bisectLeft(thresholds, x, 1, thresholds.length - 1) - 1]
          : this.bins[d3.bisect(thresholds, x, 1, thresholds.length - 1) - 1];
        bin.y += k;
        // console.log('FIXME', this.bins, data[i]);
        // this.bins.push(data[i]);
      }
    }
  }

  values(): IBin[] {
    return this.bins;
  }

  private calcThresholds(range: [number, number], values: number[]): number[] {
    const n = this.binCount ?? Math.ceil(Math.log(values.length) / Math.LN2 + 1);
    let x = -1;
    const b = +range[0];
    const m = (range[1] - b) / n;
    const f: number[] = [];
    while (++x <= n) {
      f[x] = m * x + b;
    }

    if (this.rightClose) {
      f.splice(0, 0, range[0] - m);
    }

    return f;
  }
}
