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

import { Panel } from '@lumino/widgets';
import { ProfilePropertiesWidget } from './ProfilePropertiesWidget';
import { HiveSupportWidget } from './HiveSupportWidget';
import { MasterURLWidget } from './MasterURLWidget';
import { ExecutorCoresWidget } from './ExecutorCoresWidget';
import { ExecutorMemoryWidget } from './ExecutorMemoryWidget';
import { SparkUIMessage } from '../../SparkUIMessage';
import { IProfileListItem } from '../../IProfileListItem';

export class ProfileConfigurationWidget extends Panel {
  public readonly SPARK_LOCAL_MASTER_URL_PREFIX = 'local';

  private readonly propertiesWidget: ProfilePropertiesWidget;
  private readonly enableHiveSupportWidget: HiveSupportWidget;
  private readonly masterURLWidget: MasterURLWidget;
  private readonly executorCoresWidget: ExecutorCoresWidget;
  private readonly executorMemoryWidget: ExecutorMemoryWidget;

  constructor() {
    super();

    this.propertiesWidget = new ProfilePropertiesWidget();
    this.enableHiveSupportWidget = new HiveSupportWidget();
    this.masterURLWidget = new MasterURLWidget();
    this.executorCoresWidget = new ExecutorCoresWidget();
    this.executorMemoryWidget = new ExecutorMemoryWidget();

    this.addWidget(this.masterURLWidget);
    this.addWidget(this.executorCoresWidget);
    this.addWidget(this.executorMemoryWidget);
    this.addWidget(this.enableHiveSupportWidget);
    this.addWidget(this.propertiesWidget);

    this.toggleExecutorInputs();
  }

  public getConfiguration(): {
    masterURL: string;
    executorCores: string;
    executorMemory: string;
    properties: { [key: string]: string };
  } {
    return {
      masterURL: this.masterURLWidget.value,
      executorCores: this.executorCoresWidget.value,
      executorMemory: this.executorMemoryWidget.value,
      properties: this.propertiesWidget.collectProperties(),
    };
  }

  public updateConfiguration(selectedProfile: IProfileListItem) {
    this.masterURLWidget.value = selectedProfile['spark.master'];
    this.executorCoresWidget.value = selectedProfile['spark.executor.cores'];
    this.executorMemoryWidget.value = selectedProfile['spark.executor.memory'];
    this.propertiesWidget.updateProperties(selectedProfile.properties);
    let isHiveEnabled = false;
    for (const p of selectedProfile.properties) {
      if (p.name === 'spark.sql.catalogImplementation' && p.value === 'hive') {
        isHiveEnabled = true;
        break;
      }
    }
    this.enableHiveSupportWidget.enabled = isHiveEnabled;

    this.toggleExecutorInputs();
  }

  public processMessage(msg: SparkUIMessage): void {
    switch (msg.type) {
      case 'add-new-property-clicked':
        this.onAddNewProperty();
        break;
      case 'remove-property-clicked':
        this.onRemoveProperty(msg.payload.name);
        break;
      case 'enable-hive-support-clicked':
        this.onEnableHiveSupport(msg.payload.hiveEnabled);
        break;
      default:
        super.processMessage(msg);
        break;
    }
  }

  private toggleExecutorInputs(): void {
    if (this.masterURLWidget.value.indexOf(this.SPARK_LOCAL_MASTER_URL_PREFIX) === 0) {
      this.executorMemoryWidget.disableInput();
      this.executorCoresWidget.disableInput();
    } else {
      this.executorMemoryWidget.enableInput();
      this.executorCoresWidget.enableInput();
    }
  }

  private onAddNewProperty(): void {
    this.propertiesWidget.addProperty('', '');
  }

  private onEnableHiveSupport(hiveEnabled: boolean): void {
    if (hiveEnabled) {
      this.propertiesWidget.addProperty('spark.sql.catalogImplementation', 'hive');
    } else {
      this.propertiesWidget.removeProperty('spark.sql.catalogImplementation');
    }
  }

  private onRemoveProperty(propertyName: string) {
    this.propertiesWidget.removeProperty(propertyName);

    if (propertyName !== 'spark.sql.catalogImplementation') {
      return;
    }

    this.enableHiveSupportWidget.enabled = false;
  }
}
