import { common } from '@kit.AbilityKit';
import { webview } from '@kit.ArkWeb';

/**
 * Keeps the system back gesture inside the Web workbench until the web page
 * reports that it is already on the home page.
 */
export class WebNavigationBridge {
  private static controller?: webview.WebviewController;
  private static context?: common.UIAbilityContext;

  static bind(controller: webview.WebviewController, context: common.UIAbilityContext): void {
    WebNavigationBridge.controller = controller;
    WebNavigationBridge.context = context;
  }

  static dispatchBack(): boolean {
    const controller = WebNavigationBridge.controller;
    const context = WebNavigationBridge.context;
    if (!controller || !context) return false;
    try {
      controller.runJavaScript('String(Boolean(window.handleNativeBack?.()))')
        .then((result: string) => {
          const handled = String(result ?? '').replace(/^"|"$/g, '') === 'true';
          if (!handled) context.terminateSelf().catch(() => {});
        })
        .catch(() => context.terminateSelf().catch(() => {}));
    } catch (error) {
      context.terminateSelf().catch(() => {});
    }
    return true;
  }
}
