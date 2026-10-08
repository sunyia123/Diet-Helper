import { Want } from '@kit.AbilityKit';
import { webview } from '@kit.ArkWeb';

interface WidgetRequest {
  action: string;
  mealId: string;
}

export class DailyWidgetNavigation {
  private static controller?: webview.WebviewController;
  private static ready: boolean = false;
  private static pending?: WidgetRequest;

  static fromWant(want: Want): void {
    const action = want.parameters?.['widgetAction'];
    if (action !== 'overview' && action !== 'meal') return;
    const mealId = want.parameters?.['mealId'];
    DailyWidgetNavigation.pending = { action: action as string, mealId: typeof mealId === 'string' ? mealId : '' };
    DailyWidgetNavigation.deliver();
  }

  static attach(controller: webview.WebviewController): void {
    DailyWidgetNavigation.controller = controller;
    DailyWidgetNavigation.ready = false;
  }

  static pageReady(): void {
    DailyWidgetNavigation.ready = true;
    DailyWidgetNavigation.deliver();
  }

  private static deliver(): void {
    if (!DailyWidgetNavigation.ready || !DailyWidgetNavigation.controller || !DailyWidgetNavigation.pending) return;
    const request = DailyWidgetNavigation.pending;
    DailyWidgetNavigation.pending = undefined;
    DailyWidgetNavigation.controller.runJavaScript(`window.handleDailyWidgetAction?.(${JSON.stringify(request)})`).catch(() => {
      DailyWidgetNavigation.pending = request;
    });
  }
}
