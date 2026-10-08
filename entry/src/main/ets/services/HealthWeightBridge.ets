import { common } from '@kit.AbilityKit';
import { BusinessError } from '@kit.BasicServicesKit';
import { healthStore } from '@kit.HealthServiceKit';
import { hilog } from '@kit.PerformanceAnalysisKit';

interface WeightSample {
  kg: number;
  measuredAt: number;
}

interface WeightBridgeResult {
  success: boolean;
  code: number;
  message: string;
  stage?: string;
  kg?: number;
  measuredAt?: number;
  records?: WeightSample[];
  startTime?: number;
  endTime?: number;
}

export class HealthWeightBridge {
  private context?: common.UIAbilityContext;

  isAvailable(): boolean {
    return canIUse('SystemCapability.Health.HealthStore');
  }

  setContext(context: common.UIAbilityContext): void {
    this.context = context;
  }

  private result(value: WeightBridgeResult): string {
    return JSON.stringify(value);
  }

  async importLatestWeight(): Promise<string> {
    return this.readLatestWeight(true);
  }

  async readLatestWeightIfAuthorized(): Promise<string> {
    return this.readLatestWeight(false);
  }

  async importWeightHistory(): Promise<string> {
    return this.readLatestWeight(true, true);
  }

  private failure(error: BusinessError, stage: string): string {
    const messages: Record<number, string> = {
      201: '应用的体重读取权限校验未通过，请联系开发者检查服务开通与签名配置',
      801: '当前设备未提供华为运动健康服务，请在支持该服务的华为手机上使用',
      1002700001: '华为运动健康服务异常，请稍后重试',
      1002700002: '华为运动健康数据读取异常，请稍后重试',
      1002701001: '网络不可用，请稍后重试',
      1002702001: '请先登录华为账号后重试',
      1002702002: '华为账号信息获取失败，请稍后重试',
      1002703001: '请先在华为运动健康中同意隐私声明'
    };
    const code = Number.isFinite(error.code) ? error.code : -2;
    // Diagnostic metadata only: never log health samples or account information.
    hilog.warn(0x0000, 'HealthWeightBridge', 'stage=%{public}s code=%{public}d', stage, code);
    return this.result({ success: false, code, stage, message: messages[code] || '体重读取未完成，请重试或手工记录' });
  }

  private async readLatestWeight(requestAuthorization: boolean, history: boolean = false): Promise<string> {
    if (!this.context) {
      return this.result({ success: false, code: -1, message: '页面尚未准备好，请稍后重试' });
    }

    if (!this.isAvailable()) {
      return this.result({ success: false, code: 801, stage: 'capability', message: '当前设备未提供华为运动健康服务，请在支持该服务的华为手机上使用' });
    }

    let stage: string = 'init';
    try {
      const weightType = healthStore.samplePointHelper.weight.DATA_TYPE;
      const request: healthStore.AuthorizationRequest = {
        readDataTypes: [weightType],
        writeDataTypes: []
      };

      await healthStore.init(this.context);
      stage = 'query-authorization';
      let authorization: healthStore.AuthorizationResponse;
      try {
        authorization = await healthStore.getAuthorizations(request);
      } catch (error) {
        const code = (error as BusinessError).code;
        // First-time users may need authorization/login before querying grants.
        // Background reads must never open that UI.
        if (!requestAuthorization || (code !== 201 && code !== 1002702001)) {
          return this.failure(error as BusinessError, stage);
        }
        authorization = { readDataTypes: [], writeDataTypes: [] };
      }
      if (requestAuthorization && !authorization.readDataTypes.some((item: healthStore.DataType) => item.id === weightType.id)) {
        stage = 'request-authorization';
        authorization = await healthStore.requestAuthorizations(this.context, request);
      }
      if (!authorization.readDataTypes.some((item: healthStore.DataType) => item.id === weightType.id)) {
        return this.result({ success: false, code: 201, stage: 'authorization', message: '未授权读取体重，可重新授权或手工记录' });
      }

      stage = 'read-weight';
      const endTime = Date.now();
      const startDate = new Date(endTime);
      const month = startDate.getUTCMonth();
      startDate.setUTCFullYear(startDate.getUTCFullYear() - 1);
      if (startDate.getUTCMonth() !== month) startDate.setUTCDate(0);
      const startTime = startDate.getTime();
      if (history) {
        stage = 'read-history';
        const records: WeightSample[] = [];
        const pageSize: number = 1000;
        // Fixed query boundaries + offset paging; never silently return a truncated year.
        for (let page = 0; page < 100; page++) {
          const rows = await healthStore.readData<healthStore.samplePointHelper.weight.Model>({
            samplePointDataType: weightType, fields: { bodyWeight: 0 }, startTime, endTime,
            count: pageSize, offset: page * pageSize, sortOrder: healthStore.SortOrder.DESC
          });
          for (const row of rows) {
            const kg = row.fields.bodyWeight;
            const measuredAt = row.startTime;
            if (!Number.isFinite(kg) || kg < 0.1 || kg > 500 || !Number.isFinite(measuredAt) || measuredAt < startTime || measuredAt > endTime) {
              return this.result({ success: false, code: 401, stage, message: '历史体重或测量时间无效，本次未导入，请检查运动健康中的记录' });
            }
            records.push({ kg, measuredAt });
          }
          if (rows.length < pageSize) {
            return this.result({ success: true, code: 0, message: '', records, startTime, endTime });
          }
        }
        return this.result({ success: false, code: 401, stage, message: '历史记录过多，本次未导入，请稍后重试' });
      }
      const rows = await healthStore.readData<healthStore.samplePointHelper.weight.Model>({
        samplePointDataType: weightType,
        fields: { bodyWeight: 0 },
        startTime,
        endTime,
        count: 1,
        sortOrder: healthStore.SortOrder.DESC
      });
      if (rows.length === 0) {
        return this.result({ success: false, code: 0, stage, message: '华为运动健康暂无可导入的体重，请先完成测量与同步，或手工记录' });
      }

      const kg = rows[0].fields.bodyWeight;
      const measuredAt = rows[0].startTime;
      if (!Number.isFinite(kg) || kg < 0.1 || kg > 500 || !Number.isFinite(measuredAt) || measuredAt <= 0 || measuredAt > endTime) {
        return this.result({ success: false, code: 401, stage, message: '体重或测量时间无效，请检查运动健康中的记录' });
      }
      return this.result({ success: true, code: 0, message: '', kg, measuredAt });
    } catch (error) {
      return this.failure(error as BusinessError, stage);
    }
  }
}
