import { AbilityConstant, UIAbility, Want } from '@kit.AbilityKit';
import { hilog } from '@kit.PerformanceAnalysisKit';
import { window } from '@kit.ArkUI';
import { DailyWidgetNavigation } from '../services/DailyWidgetNavigation';

const DOMAIN: number = 0x0000;

export default class EntryAbility extends UIAbility {
  onCreate(want: Want, launchParam: AbilityConstant.LaunchParam): void {
    hilog.info(DOMAIN, 'DietHelper', 'EntryAbility created');
    DailyWidgetNavigation.fromWant(want);
  }

  onNewWant(want: Want): void {
    DailyWidgetNavigation.fromWant(want);
  }

  onWindowStageCreate(windowStage: window.WindowStage): void {
    windowStage.getMainWindow()
      .then((mainWindow: window.Window) => {
        AppStorage.setOrCreate('mainWindow', mainWindow);
        return mainWindow.setWindowLayoutFullScreen(true)
          .then(() => mainWindow.setWindowSystemBarEnable([]));
      })
      .then(() => {
        windowStage.loadContent('pages/Index', (error) => {
          if (error.code) {
            hilog.error(DOMAIN, 'DietHelper', `Failed to load content: ${error.code}`);
          }
        });
      })
      .catch((error: Error) => {
        hilog.error(DOMAIN, 'DietHelper', `Failed to configure window: ${error.message}`);
      });
  }

  onConfigurationUpdate(newConfig: Record<string, Object>): void {
    hilog.info(DOMAIN, 'DietHelper', 'Configuration updated');
  }

}
