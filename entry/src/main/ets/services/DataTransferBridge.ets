import { common } from '@kit.AbilityKit';
import { pasteboard } from '@kit.BasicServicesKit';
import { fileIo, picker } from '@kit.CoreFileKit';

interface DataTransferResult {
  success: boolean;
  message: string;
  text?: string;
}

const MAX_JSON_LENGTH: number = 5 * 1024 * 1024;

export class DataTransferBridge {
  private context?: common.UIAbilityContext;

  setContext(context: common.UIAbilityContext): void {
    this.context = context;
  }

  private result(value: DataTransferResult): string {
    return JSON.stringify(value);
  }

  async copyJson(text: string): Promise<string> {
    if (text.length > MAX_JSON_LENGTH) {
      return this.result({ success: false, message: 'JSON 超过 5MB，请减少导出内容' });
    }
    try {
      const data = pasteboard.createData(pasteboard.MIMETYPE_TEXT_PLAIN, text);
      await pasteboard.getSystemPasteboard().setData(data);
      return this.result({ success: true, message: '' });
    } catch (error) {
      return this.result({ success: false, message: '无法写入系统剪贴板' });
    }
  }

  async exportJsonFile(text: string, requestedName: string): Promise<string> {
    if (!this.context) {
      return this.result({ success: false, message: '页面尚未准备好，请稍后重试' });
    }
    if (text.length > MAX_JSON_LENGTH) {
      return this.result({ success: false, message: 'JSON 超过 5MB，请减少导出内容' });
    }
    try {
      const options = new picker.DocumentSaveOptions();
      const safeName = requestedName.replace(/[\\/:*?"<>|]/g, '').slice(0, 80) || '食由己备份.json';
      options.newFileNames = [safeName.endsWith('.json') ? safeName : `${safeName}.json`];
      const uris = await new picker.DocumentViewPicker(this.context).save(options);
      if (!uris.length) {
        return this.result({ success: false, message: '未选择保存位置' });
      }
      const file = fileIo.openSync(uris[0], fileIo.OpenMode.READ_WRITE | fileIo.OpenMode.CREATE | fileIo.OpenMode.TRUNC);
      fileIo.writeSync(file.fd, text);
      fileIo.closeSync(file);
      return this.result({ success: true, message: '' });
    } catch (error) {
      return this.result({ success: false, message: 'JSON 文件导出失败或已取消' });
    }
  }

  async importJsonFile(): Promise<string> {
    if (!this.context) {
      return this.result({ success: false, message: '页面尚未准备好，请稍后重试' });
    }
    try {
      const options = new picker.DocumentSelectOptions();
      options.maxSelectNumber = 1;
      options.fileSuffixFilters = ['.json'];
      const uris = await new picker.DocumentViewPicker(this.context).select(options);
      if (!uris.length) {
        return this.result({ success: false, message: '未选择 JSON 文件' });
      }
      const text = fileIo.readTextSync(uris[0]);
      if (!text.trim()) {
        return this.result({ success: false, message: 'JSON 文件内容为空' });
      }
      if (text.length > MAX_JSON_LENGTH) {
        return this.result({ success: false, message: 'JSON 文件超过 5MB' });
      }
      return this.result({ success: true, message: '', text });
    } catch (error) {
      return this.result({ success: false, message: 'JSON 文件读取失败或已取消' });
    }
  }
}
