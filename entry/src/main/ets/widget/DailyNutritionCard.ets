const widgetStorage = new LocalStorage();

@Entry(widgetStorage)
@Component
struct DailyNutritionCard {
  @LocalStorageProp('dateLabel') dateLabel: string = '今天';
  @LocalStorageProp('calories') calories: string = '0';
  @LocalStorageProp('targetCalories') targetCalories: string = '—';
  @LocalStorageProp('carbs') carbs: string = '0';
  @LocalStorageProp('protein') protein: string = '0';
  @LocalStorageProp('fat') fat: string = '0';
  @LocalStorageProp('status') status: string = '待记录';
  @LocalStorageProp('meal1Id') meal1Id: string = '';
  @LocalStorageProp('meal1Name') meal1Name: string = '';
  @LocalStorageProp('meal1Status') meal1Status: string = '';
  @LocalStorageProp('meal2Id') meal2Id: string = '';
  @LocalStorageProp('meal2Name') meal2Name: string = '';
  @LocalStorageProp('meal2Status') meal2Status: string = '';
  @LocalStorageProp('meal3Id') meal3Id: string = '';
  @LocalStorageProp('meal3Name') meal3Name: string = '';
  @LocalStorageProp('meal3Status') meal3Status: string = '';
  @LocalStorageProp('meal4Id') meal4Id: string = '';
  @LocalStorageProp('meal4Name') meal4Name: string = '';
  @LocalStorageProp('meal4Status') meal4Status: string = '';
  @LocalStorageProp('meal5Id') meal5Id: string = '';
  @LocalStorageProp('meal5Name') meal5Name: string = '';
  @LocalStorageProp('meal5Status') meal5Status: string = '';

  private progressWidth(): string {
    const total = Number(this.targetCalories);
    return `${total > 0 ? Math.min(100, Math.max(0, Math.round(Number(this.calories) / total * 100))) : 0}%`;
  }

  @Builder
  private mealAction(name: string, status: string, mealId: string) {
    Column({ space: 2 }) {
      Text(name).fontSize(12).fontWeight(FontWeight.Medium).fontColor('#294536').maxLines(1).textOverflow({ overflow: TextOverflow.Ellipsis });
      Text(status).fontSize(10).fontColor('#67766B').maxLines(1).textOverflow({ overflow: TextOverflow.Ellipsis });
    }
    .width('19%')
    .height(48)
    .justifyContent(FlexAlign.Center)
    .borderRadius(12)
    .backgroundColor('#F1F5F0')
    .onClick(() => {
      postCardAction(this, { action: 'router', abilityName: 'EntryAbility', params: { widgetAction: 'meal', mealId: mealId } });
    });
  }

  build() {
    Column({ space: 8 }) {
      Row() {
        Column({ space: 2 }) {
          Text('每日营养记餐').fontSize(14).fontWeight(FontWeight.Bold).fontColor('#294536');
          Text(this.dateLabel).fontSize(11).fontColor('#67766B');
        }.alignItems(HorizontalAlign.Start);
        Blank();
        Text(this.status).fontSize(11).fontColor('#4C7A5D');
      }
      .width('100%')
      .onClick(() => {
        postCardAction(this, { action: 'router', abilityName: 'EntryAbility', params: { widgetAction: 'overview' } });
      });

      Row({ space: 4 }) {
        Text(this.calories).fontSize(29).fontWeight(FontWeight.Bold).fontColor('#25382C');
        Text(`/ ${this.targetCalories} kcal`).fontSize(12).fontColor('#67766B');
        Blank();
        Text(`碳 ${this.carbs}  蛋 ${this.protein}  脂 ${this.fat}`).fontSize(11).fontColor('#4C7A5D');
      }
      .width('100%')
      .alignItems(VerticalAlign.Bottom)
      .onClick(() => {
        postCardAction(this, { action: 'router', abilityName: 'EntryAbility', params: { widgetAction: 'overview' } });
      });

      Row() {
        Row().width(this.progressWidth()).height(4).borderRadius(2).backgroundColor('#79AB83');
      }.width('100%').height(4).borderRadius(2).backgroundColor('#E5ECE6');

      Row({ space: 4 }) {
        if (this.meal1Id) { this.mealAction(this.meal1Name, this.meal1Status, this.meal1Id); }
        if (this.meal2Id) { this.mealAction(this.meal2Name, this.meal2Status, this.meal2Id); }
        if (this.meal3Id) { this.mealAction(this.meal3Name, this.meal3Status, this.meal3Id); }
        if (this.meal4Id) { this.mealAction(this.meal4Name, this.meal4Status, this.meal4Id); }
        if (this.meal5Id) { this.mealAction(this.meal5Name, this.meal5Status, this.meal5Id); }
      }.width('100%').justifyContent(FlexAlign.SpaceBetween);
    }
    .width('100%')
    .height('100%')
    .padding(12)
    .borderRadius(18)
    .backgroundColor('#FCFCF8');
  }
}
