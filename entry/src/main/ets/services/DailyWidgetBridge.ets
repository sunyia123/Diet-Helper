import { common } from '@kit.AbilityKit';
import { refreshWidgetForms, saveWidgetSnapshot } from './DailyWidgetData';

export class DailyWidgetBridge {
  private context?: common.UIAbilityContext;

  setContext(context: common.UIAbilityContext): void {
    this.context = context;
  }

  updateSnapshot(json: string): void {
    if (!this.context || !saveWidgetSnapshot(this.context, json)) return;
    refreshWidgetForms(this.context);
  }
}
