import { Want } from '@kit.AbilityKit';
import { formBindingData, FormExtensionAbility, formInfo } from '@kit.FormKit';
import { forgetWidgetForm, refreshWidgetForms, rememberWidgetForm, widgetFormData } from '../services/DailyWidgetData';

export default class DailyNutritionFormAbility extends FormExtensionAbility {
  onAddForm(want: Want): formBindingData.FormBindingData {
    const formId = String(want.parameters?.[formInfo.FormParam.IDENTITY_KEY] ?? '');
    rememberWidgetForm(this.context, formId);
    return formBindingData.createFormBindingData(widgetFormData(this.context));
  }

  onUpdateForm(formId: string): void {
    refreshWidgetForms(this.context, formId);
  }

  onRemoveForm(formId: string): void {
    forgetWidgetForm(this.context, formId);
  }

  onAcquireFormState(want: Want): formInfo.FormState {
    return formInfo.FormState.READY;
  }
}
