import { webview } from '@kit.ArkWeb';
import { window } from '@kit.ArkUI';
import { common } from '@kit.AbilityKit';
import { camera, cameraPicker } from '@kit.CameraKit';
import { photoAccessHelper } from '@kit.MediaLibraryKit';
import { HealthWeightBridge } from '../services/HealthWeightBridge';
import { DataTransferBridge } from '../services/DataTransferBridge';
import { WebNavigationBridge } from '../services/WebNavigationBridge';
import { DailyWidgetBridge } from '../services/DailyWidgetBridge';
import { DailyWidgetNavigation } from '../services/DailyWidgetNavigation';

class AppearanceBridge {
  private update: (color: string) => void;
  constructor(update: (color: string) => void) { this.update = update; }
  setColor(color: string): void {
    if (/^#[0-9a-fA-F]{6}$/.test(color)) { this.update(color); }
  }
}

@Entry
@Component
struct Index {
  @State avoidAreaPadding: Padding = { top: 0 };
  @State chromeColor: string = '#F8F7F1';
  private controller: webview.WebviewController = new webview.WebviewController();
  private healthWeightBridge: HealthWeightBridge = new HealthWeightBridge();
  private dataTransferBridge: DataTransferBridge = new DataTransferBridge();
  private dailyWidgetBridge: DailyWidgetBridge = new DailyWidgetBridge();
  private appearanceBridge: AppearanceBridge = new AppearanceBridge((color: string): void => {
    this.chromeColor = color;
  });
  private mainWindow?: window.Window;
  private avoidAreaListener: (options: window.AvoidAreaOptions) => void = (options: window.AvoidAreaOptions) => {
    if (options.type === window.AvoidAreaType.TYPE_SYSTEM || options.type === window.AvoidAreaType.TYPE_CUTOUT ||
      options.type === window.AvoidAreaType.TYPE_NAVIGATION_INDICATOR) {
      this.syncWebSafeArea();
    }
  };

  private updateAvoidAreaPadding(): void {
    // The Web layout handles safe areas once in logical viewport units.
    this.avoidAreaPadding = { top: 0 };
  }

  private syncWebSafeArea(): void {
    if (!this.mainWindow) return;
    try {
      const system = this.mainWindow.getWindowAvoidArea(window.AvoidAreaType.TYPE_SYSTEM);
      const cutout = this.mainWindow.getWindowAvoidArea(window.AvoidAreaType.TYPE_CUTOUT);
      const navigation = this.mainWindow.getWindowAvoidArea(window.AvoidAreaType.TYPE_NAVIGATION_INDICATOR);
      const topPx = Math.max(system.topRect.top + system.topRect.height, cutout.topRect.top + cutout.topRect.height);
      const bottomPx = navigation.bottomRect.height;
      const topVp = Math.max(0, Math.ceil(this.getUIContext().px2vp(topPx)));
      const bottomVp = Math.max(0, Math.ceil(this.getUIContext().px2vp(bottomPx)));
      this.controller.runJavaScript(`document.documentElement.style.setProperty('--native-safe-top','${topVp}px');` +
        `document.documentElement.style.setProperty('--native-safe-bottom','${bottomVp}px');`).catch(() => {});
    } catch (error) {
      // Devices without avoidance-area support retain the responsive CSS fallback.
    }
  }

  private showPhotoPickerError(message: string): void {
    this.controller.runJavaScript(`showToast('${message}')`).catch(() => {});
  }

  aboutToAppear(): void {
    webview.WebviewController.setWebDebuggingAccess(false);
    const context = this.getUIContext().getHostContext() as common.UIAbilityContext;
    this.healthWeightBridge.setContext(context);
    this.dataTransferBridge.setContext(context);
    this.dailyWidgetBridge.setContext(context);
    WebNavigationBridge.bind(this.controller, context);
    this.mainWindow = AppStorage.get<window.Window>('mainWindow');
    this.updateAvoidAreaPadding();
    try {
      this.mainWindow?.on('avoidAreaChange', this.avoidAreaListener);
    } catch (error) {
      // 不支持监听的窗口仍保留基础顶部间距。
    }
  }

  aboutToDisappear(): void {
    try {
      this.controller.deleteJavaScriptRegister('healthWeightBridge');
      this.controller.deleteJavaScriptRegister('dataTransferBridge');
      this.controller.deleteJavaScriptRegister('appearanceBridge');
      this.controller.deleteJavaScriptRegister('dailyWidgetBridge');
    } catch (error) {
      // The controller may already be detached during destruction.
    }
    try {
      this.mainWindow?.off('avoidAreaChange', this.avoidAreaListener);
    } catch (error) {
      // 页面销毁时窗口可能已失效，无需继续处理。
    }
  }

  onPageShow(): void {
    try {
      this.controller.runJavaScript('window.onNativeAppForeground?.()').catch(() => {});
    } catch (error) {
      // 首次冷启动时 Web 控制器可能尚未绑定，页面完成初始化后仍会执行一次自动同步检查。
    }
  }

  onBackPress(): boolean {
    return WebNavigationBridge.dispatchBack();
  }

  build() {
    Stack() {
      Web({
        src: $rawfile('calm-path-v1/index.html'),
        controller: this.controller
      })
        .width('100%')
        .height('100%')
        .javaScriptAccess(true)
        .domStorageAccess(true)
        .cacheMode(CacheMode.Online)
        .onControllerAttached(() => {
          // methodList preserves Promise results; asyncMethodList is fire-and-forget.
          this.controller.registerJavaScriptProxy(this.healthWeightBridge, 'healthWeightBridge',
            ['isAvailable', 'importLatestWeight', 'readLatestWeightIfAuthorized', 'importWeightHistory']);
          this.controller.registerJavaScriptProxy(this.dataTransferBridge, 'dataTransferBridge',
            ['copyJson', 'exportJsonFile', 'importJsonFile']);
          this.controller.registerJavaScriptProxy(this.appearanceBridge, 'appearanceBridge', ['setColor']);
          this.controller.registerJavaScriptProxy(this.dailyWidgetBridge, 'dailyWidgetBridge', ['updateSnapshot']);
          DailyWidgetNavigation.attach(this.controller);
        })
        .fileAccess(true)
        .zoomAccess(false)
        .backgroundColor(this.chromeColor)
        .onPageEnd(() => {
          this.controller.runJavaScript('updateSettingsSummaries(); updateHealthAccountSummary(); window.publishDailyWidgetSnapshot?.();').catch(() => {});
          this.syncWebSafeArea();
          DailyWidgetNavigation.pageReady();
        })
        .onShowFileSelector((event) => {
          const context = this.getUIContext().getHostContext() as common.UIAbilityContext;
          if (event.fileSelector.isCapture()) {
            const profile: cameraPicker.PickerProfile = {
              cameraPosition: camera.CameraPosition.CAMERA_POSITION_BACK
            };
            cameraPicker.pick(context, [cameraPicker.PickerMediaType.PHOTO], profile)
              .then((result: cameraPicker.PickerResult) => {
                event.result.handleFileList(result.resultUri ? [result.resultUri] : []);
              })
              .catch(() => {
                event.result.handleFileList([]);
                this.showPhotoPickerError('系统相机未能打开');
              });
          } else {
            const options = new photoAccessHelper.PhotoSelectOptions();
            options.MIMEType = photoAccessHelper.PhotoViewMIMETypes.IMAGE_TYPE;
            options.maxSelectNumber = 1;
            new photoAccessHelper.PhotoViewPicker().select(options)
              .then((result: photoAccessHelper.PhotoSelectResult) => {
                event.result.handleFileList(result.photoUris);
              })
              .catch(() => {
                event.result.handleFileList([]);
                this.showPhotoPickerError('系统相册未能打开');
              });
          }
          return true;
        })
    }
      .width('100%')
      .height('100%')
      .padding(this.avoidAreaPadding)
      .backgroundColor(this.chromeColor)
  }
}
