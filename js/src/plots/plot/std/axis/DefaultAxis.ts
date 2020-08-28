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

import { Big, BigSource } from 'big.js';
import { BigNumberUtils } from '../../../../utils';

const NANOTIME_TYPE = 'nanotime';

export class DefaultAxis {
  axisType: string;
  axisBase: number;
  axisTime: number;
  axisTimezone: string;
  axisValL: any;
  axisValR: any;
  axisValSpan: any;
  axisPctL: number;
  axisPctR: number;
  axisPctSpan: number;
  label: string;
  axisGridlines: any;
  axisGridlineLabels: any[];
  axisStep: number;
  axisFixed: number;
  axisMarginValL: Big | number | string;
  axisMarginValR: Big | number | string;
  fixedLines: any[];
  axisFixedLabels: any;
  numFixs: number[];
  dateIntws: any[];
  numIntws: any[];

  axisLabelWithCommon: any;
  showGridlineLabels: boolean;

  constructor(type: 'linear' | 'log' | 'time' | 'category' | 'nanotime' = 'linear') {
    this.axisType = type;
    this.axisBase = 10;
    this.axisTime = 0;
    this.axisTimezone = 'UTC';
    this.axisValL = type === NANOTIME_TYPE ? new Big(0) : 0;
    this.axisValR = type === NANOTIME_TYPE ? new Big(1) : 1;
    this.axisValSpan = type === NANOTIME_TYPE ? new Big(1) : 1;
    this.axisPctL = 0;
    this.axisPctR = 1;
    this.axisPctSpan = 1;
    this.label = '';
    this.axisGridlines = [];
    this.axisGridlineLabels = [];
    this.axisStep = 1;
    this.axisFixed = 0;
    this.axisMarginValL = 0;
    this.axisMarginValR = 0;
    this.fixedLines = [];
    this.axisFixedLabels = {};
    this.dateIntws = [];
    this.numIntws = [];
    this.showGridlineLabels = true;

    this.setNumFixs();
  }

  setNumFixs(): void {
    let numFixs = [];
    const min = this.axisType === 'log' ? 1 : 0;

    for (let i = 0; i < 18; i++) {
      const f = Math.max(6 - i, min);
      numFixs = numFixs.concat([f, i <= 6 ? f + 1 : f, f]);
    }

    this.numFixs = numFixs;
  }

  axisPow(pct: number): number {
    return Math.pow(this.axisBase, pct * this.axisValSpan + this.axisValL);
  }

  setLabel(label: string): void {
    this.label = label;
  }

  setRange(vl, vr, axisBase): void {
    if (vl !== null) {
      this.axisValL = vl;
    }
    if (vr !== null) {
      this.axisValR = vr;
    }

    if (this.axisType === 'log') {
      this.setLogAxisBase(axisBase);
    }

    this.axisValSpan = BigNumberUtils.minus(this.axisValR, this.axisValL);
  }

  setLogAxisBase(axisBase): void {
    if (axisBase !== null) {
      this.axisBase = axisBase;
    }

    if (this.axisBase <= 1) {
      this.axisBase = 10;
      console.error('cannot set base to <= 1');
    }
  }

  setCategoryNames(categoryNames, categoryXs): void {
    this.axisFixedLabels = {};

    for (let i = 0; i < categoryXs.length; i++) {
      this.fixedLines.push(this.getPercent(categoryXs[i]));
      this.axisFixedLabels[this.fixedLines[i]] = categoryNames[i];
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  setGridlines(pointLeft, pointRight, count, marginLeft, marginRight): void {
    if (pointRight < pointLeft) {
      console.error('cannot set right coord < left coord');

      return;
    }

    this.setAxisPct(pointLeft, pointRight);

    const span = this.getSpan();

    this.setAxisSteps(span, this.numIntws, this.numFixs, count);
    this.setLinesAndLabels(pointLeft, pointRight, span);
  }

  setAxisPct(pointLeft: number, pointRight: number): void {
    this.axisPctL = pointLeft;
    this.axisPctR = pointRight;
    this.axisPctSpan = pointRight - pointLeft;
  }

  getSpan(): number {
    if (BigNumberUtils.isBig(this.axisValSpan)) {
      return parseFloat(this.axisValSpan.times(this.axisPctSpan).toString());
    }

    return this.axisPctSpan * this.axisValSpan;
  }

  setAxisSteps(span, intervals, fixs, count): void {
    let axisStep;
    let axisFixed;
    let mindiff = 1e100;
    let diff = mindiff;
    let i = 0;

    if (count == null) {
      console.error('missing setCoords count');
      count = 1;
    }

    while (diff === mindiff && axisStep !== Infinity) {
      axisStep = this.calcAxisStep(i, intervals);
      axisFixed = this.calcAxisFixed(i, fixs);

      const nowCount = span / axisStep;

      diff = Math.abs(nowCount - count);

      if (diff < mindiff) {
        mindiff = diff;
      }

      i++;
    }

    this.axisStep = axisStep;
    this.axisFixed = axisFixed;
  }

  setLinesAndLabels(pointLeft, pointRight, span): void {
    const lines = this.calcLines(pointLeft, pointRight, this.axisStep);
    const margins = BigNumberUtils.plus(this.axisMarginValL, this.axisMarginValR);

    span = BigNumberUtils.mult(this.axisPctSpan, BigNumberUtils.minus(this.axisValSpan, margins));

    const labels = this.calcLabels(lines, span);

    this.axisGridlines = lines;
    this.axisGridlineLabels = labels.labels;

    if (labels.common !== '') {
      this.axisLabelWithCommon = this.label ? this.label + ' ' + labels.common : labels.common;
    } else {
      this.axisLabelWithCommon = this.label;
    }
  }

  calcAxisStep(i: number, intervals: number[]): number {
    if (i >= intervals.length) {
      this.addIntervals(i, intervals);
    }

    return intervals[i];
  }

  calcAxisFixed(i: number, fixs: number[]): number {
    if (i >= fixs.length) {
      return 0;
    }

    return fixs[i];
  }

  addIntervals(i: number, intervals: number[]): void {
    const prev = intervals[intervals.length - 1];

    this.addDefaultIntervals(i, intervals, prev);
  }

  addDefaultIntervals(i: number, intervals: number[], prev: number): void {
    const bs = i === 0 ? 1e-6 : (prev / 5.0) * 10;

    intervals.push(1.0 * bs);
    intervals.push(2.5 * bs);
    intervals.push(5.0 * bs);
  }

  calcLines(pointLeft, pointRight, axisStep): number[] {
    if (this.axisType === 'category') {
      return this.getCategoryAxisLines(pointLeft, pointRight);
    }

    return this.getDefaultAxisLines(pointLeft, pointRight, axisStep);
  }

  getCategoryAxisLines(pointLeft: number, pointRight: number): number[] {
    const lines: number[] = [];
    const valueRight = this.getValue(pointRight);

    for (let i = 0; i < this.fixedLines.length; i++) {
      const pointCoords = this.fixedLines[i];

      if (pointCoords >= this.getPercent(this.getValue(pointLeft)) && pointCoords <= this.getPercent(valueRight)) {
        lines.push(pointCoords);
      }
    }

    return lines;
  }

  getDefaultAxisLines(pointLeft, pointRight, axisStep): number[] {
    const lines: number[] = [];
    const valueRight: BigSource = this.getValue(pointRight);
    let value: BigSource = this.getValue(pointLeft);

    if (BigNumberUtils.isBig(value)) {
      value = value as BigJs.Big;
      value = value.gte(0)
        ? value.div(axisStep).round(0, 3).times(axisStep)
        : value.div(axisStep).round(0, 0).times(axisStep);
    } else {
      value = Math.ceil((value as number) / axisStep) * axisStep;
    }

    while (BigNumberUtils.lte(value, valueRight) || BigNumberUtils.lte(value, BigNumberUtils.plus(valueRight, 1e-12))) {
      const pointCoords = this.getPercent(value);

      lines.push(pointCoords);
      value = BigNumberUtils.plus(value, axisStep);
    }

    return lines;
  }

  calcLabels(lines: number[], span: number): { common: string; labels: string[] } {
    let labels = [];

    if (this.axisType === 'category') {
      labels = this.getCategoryAxisLabels(lines);
    } else {
      labels = this.getDefaultAxisLabels(lines, span);
    }

    return {
      common: '',
      labels: labels,
    };
  }

  getCategoryAxisLabels(lines: number[]): string[] {
    const labels: string[] = [];
    const min = Math.min.apply(null, lines);
    const max = Math.max.apply(null, lines);

    for (const key in this.axisFixedLabels) {
      const pointCoords = parseFloat(key);

      if (!Object.prototype.hasOwnProperty.call(this.axisFixedLabels, pointCoords)) {
        continue;
      }

      if (pointCoords >= min && pointCoords <= max) {
        labels.push(this.axisFixedLabels[pointCoords]);
      }
    }

    return labels;
  }

  getDefaultAxisLabels(lines: number[], span: number): string[] {
    const labels: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const pointCoords = lines[i];

      labels.push(this.getString(pointCoords, span));
    }

    return labels;
  }

  getGridlines(): any[] {
    return [...this.axisGridlines];
  }

  getGridlineLabels() {
    return [...this.axisGridlineLabels];
  }

  getPercent(val: any): any {
    if (BigNumberUtils.lt(val, this.axisValL)) {
      val = this.axisValL;
    }
    if (BigNumberUtils.gt(val, this.axisValR)) {
      val = this.axisValR;
    }

    if (BigNumberUtils.isBig(val)) {
      return parseFloat(val.minus(this.axisValL).div(this.axisValSpan).toString());
    }

    return (val - this.axisValL) / this.axisValSpan;
  }

  getValue(pointCoords): Big | number | string {
    if (pointCoords < 0) {
      pointCoords = 0;
    }
    if (pointCoords > 1) {
      pointCoords = 1;
    }

    return BigNumberUtils.plus(BigNumberUtils.mult(this.axisValSpan, pointCoords), this.axisValL);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getString(pointCoords: number, span: number): string {
    return this.getDefaultAxisStringValue(pointCoords);
  }

  getDefaultAxisStringValue(pointCoords: number): string {
    let standardResult = 0;
    const value: number = parseFloat(this.getValue(pointCoords).toString());

    if (this.axisType === 'log') {
      standardResult = Math.pow(this.axisBase, value);
    } else {
      standardResult = value;
    }

    return standardResult.toLocaleString(undefined, {
      minimumFractionDigits: this.axisFixed,
      maximumFractionDigits: this.axisFixed,
    });
  }
}
