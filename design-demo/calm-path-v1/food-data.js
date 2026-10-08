const FOOD_LIBRARY = [
  { id: 'rice', name: '米饭', keywords: '大米 白米 熟米饭', icon: '1f35a', symbol: '米', category: 'carbs', calories: 116, protein: 2.6, carbs: 25.9, fat: 0.3 },
  { id: 'black-rice', name: '黑米饭', keywords: '黑米', icon: '1f35a', symbol: '黑', category: 'carbs', calories: 151, protein: 3.9, carbs: 31.6, fat: 0.7 },
  { id: 'mixed-grain-rice', name: '杂粮饭', keywords: '杂粮米 混合谷物', icon: '1f35a', symbol: '杂', category: 'carbs', calories: 130, protein: 3.2, carbs: 27, fat: 1 },
  { id: 'oats', name: '燕麦片', keywords: '燕麦 燕麦米', icon: '1f33e', symbol: '燕', category: 'carbs', calories: 379, protein: 13.2, carbs: 67.7, fat: 6.5 },
  { id: 'whole-wheat-bread', name: '全麦面包', keywords: '面包 全麦吐司 烤馒头片 馒头', icon: '1f35e', symbol: '麦', category: 'carbs', calories: 247, protein: 12.5, carbs: 41.4, fat: 3.4 },
  { id: 'buckwheat-noodles', name: '荞麦面', keywords: '荞麦面条 荞麦排面', icon: '1f35c', symbol: '荞', category: 'carbs', calories: 99, protein: 5.1, carbs: 21.4, fat: 0.1 },
  { id: 'barley', name: '薏米', keywords: '薏仁 大麦 薏米饭', icon: '1f33e', symbol: '薏', category: 'carbs', calories: 357, protein: 12.8, carbs: 71.1, fat: 3.3 },
  { id: 'quinoa', name: '藜麦', keywords: '藜麦饭', icon: '1f33e', symbol: '藜', category: 'carbs', calories: 368, protein: 14.1, carbs: 64.2, fat: 6.1 },
  { id: 'sorghum', name: '高粱米', keywords: '高粱 杂粮', icon: '1f33e', symbol: '粱', category: 'carbs', calories: 329, protein: 10.6, carbs: 72.1, fat: 3.5 },
  { id: 'corn', name: '玉米', keywords: '鲜玉米 玉米粒', icon: '1f33d', symbol: '玉', category: 'carbs', calories: 112, protein: 4, carbs: 22.8, fat: 1.2 },
  { id: 'cornmeal', name: '玉米面', keywords: '玉米窝头 窝头', icon: '1f33d', symbol: '玉面', category: 'carbs', calories: 352, protein: 8.1, carbs: 75.2, fat: 3.3 },
  { id: 'sweet-potato', name: '红薯', keywords: '地瓜 甘薯', icon: '1f360', symbol: '薯', category: 'carbs', calories: 86, protein: 1.6, carbs: 20.1, fat: 0.1 },
  { id: 'purple-potato', name: '紫薯', keywords: '紫心薯', icon: '1f360', symbol: '紫薯', category: 'carbs', calories: 82, protein: 1.8, carbs: 17.6, fat: 0.1 },
  { id: 'yam', name: '山药', keywords: '淮山', icon: '1f954', symbol: '山', category: 'carbs', calories: 57, protein: 1.9, carbs: 12.4, fat: 0.2 },
  { id: 'taro', name: '芋头', keywords: '芋艿', icon: '1f954', symbol: '芋', category: 'carbs', calories: 79, protein: 2.2, carbs: 18.1, fat: 0.2 },
  { id: 'potato', name: '土豆', keywords: '马铃薯', icon: '1f954', symbol: '土', category: 'carbs', calories: 77, protein: 2, carbs: 17.5, fat: 0.1 },
  { id: 'pumpkin', name: '南瓜', keywords: '老南瓜 贝贝南瓜', icon: '1f383', symbol: '南', category: 'carbs', calories: 26, protein: 1, carbs: 6.5, fat: 0.1 },

  { id: 'chicken', name: '鸡胸肉', keywords: '鸡胸 去皮鸡肉', icon: '1f357', symbol: '鸡', category: 'protein', calories: 165, protein: 31, carbs: 0, fat: 3.6 },
  { id: 'chicken-thigh', name: '去皮鸡腿肉', keywords: '鸡腿 鸡肉', icon: '1f357', symbol: '鸡腿', category: 'protein', calories: 177, protein: 24, carbs: 0, fat: 8 },
  { id: 'beef', name: '瘦牛肉', keywords: '牛肉 牛肋条 牛肉片 牛肉条', icon: '1f969', symbol: '牛', category: 'protein', calories: 125, protein: 20.2, carbs: 0, fat: 4.2 },
  { id: 'pork', name: '瘦猪肉', keywords: '猪肉 肉片', icon: '1f969', symbol: '猪', category: 'protein', calories: 143, protein: 20.3, carbs: 1.5, fat: 6.2 },
  { id: 'pork-ribs', name: '猪排骨', keywords: '排骨', icon: '1f969', symbol: '排', category: 'protein', calories: 264, protein: 18.3, carbs: 1.7, fat: 20.4 },
  { id: 'duck', name: '鸭肉', keywords: '鸭腿 去皮鸭肉', icon: '1f986', symbol: '鸭', category: 'protein', calories: 132, protein: 19.8, carbs: 0, fat: 5.4 },
  { id: 'salmon', name: '三文鱼', keywords: '鲑鱼', icon: '1f41f', symbol: '鲑', category: 'protein', calories: 208, protein: 20.4, carbs: 0, fat: 13.4 },
  { id: 'basa-fish', name: '巴沙鱼', keywords: '巴沙鱼柳 龙利鱼 冷冻鱼柳', icon: '1f41f', symbol: '巴', category: 'protein', calories: 90, protein: 15, carbs: 0, fat: 3 },
  { id: 'crucian-carp', name: '鲫鱼', keywords: '淡水鱼', icon: '1f41f', symbol: '鲫', category: 'protein', calories: 108, protein: 17.1, carbs: 3.8, fat: 2.7 },
  { id: 'white-fish', name: '白肉鱼', keywords: '清蒸鱼 鱼片 海鱼', icon: '1f41f', symbol: '鱼', category: 'protein', calories: 96, protein: 20.1, carbs: 0, fat: 1.7 },
  { id: 'shrimp', name: '去皮虾仁', keywords: '虾 大虾 鲜虾 白灼虾', icon: '1f990', symbol: '虾', category: 'protein', calories: 99, protein: 24, carbs: 0.2, fat: 0.3 },
  { id: 'dried-shrimp', name: '虾皮', keywords: '干虾 海米 提鲜', icon: '1f990', symbol: '虾皮', category: 'protein', calories: 153, protein: 30.7, carbs: 2.5, fat: 2.2 },
  { id: 'clams', name: '蛤蜊', keywords: '花蛤 贝类', icon: '1f9aa', symbol: '蛤', category: 'protein', calories: 62, protein: 10.1, carbs: 2.8, fat: 1.1 },
  { id: 'egg', name: '鸡蛋', keywords: '全蛋', icon: '1f95a', symbol: '蛋', category: 'protein', calories: 143, protein: 12.6, carbs: 0.7, fat: 9.5 },
  { id: 'tofu', name: '北豆腐', keywords: '豆腐 老豆腐', icon: '1fad8', symbol: '豆腐', category: 'protein', calories: 81, protein: 8.1, carbs: 4.2, fat: 3.7 },
  { id: 'dried-tofu', name: '香干', keywords: '豆干 干豆腐', icon: '1fad8', symbol: '豆干', category: 'protein', calories: 151, protein: 16.2, carbs: 4.9, fat: 7.6 },
  { id: 'milk', name: '全脂牛奶', keywords: '牛奶 鲜奶', icon: '1f95b', symbol: '奶', category: 'protein', calories: 61, protein: 3.2, carbs: 4.8, fat: 3.3 },
  { id: 'greek-yogurt', name: '无糖希腊酸奶', keywords: '希腊酸奶 高蛋白酸奶', icon: '1f963', symbol: '希腊', category: 'protein', calories: 73, protein: 9, carbs: 3.9, fat: 2.3 },
  { id: 'plain-yogurt', name: '无糖酸奶', keywords: '原味酸奶 酸奶', icon: '1f963', symbol: '酸奶', category: 'protein', calories: 63, protein: 3.5, carbs: 7.4, fat: 2 },
  { id: 'soy-milk', name: '无糖豆浆', keywords: '豆浆 绿豆豆浆', icon: '1f95b', symbol: '豆浆', category: 'protein', calories: 31, protein: 3, carbs: 1.2, fat: 1.6 },
  { id: 'soybean', name: '黄豆', keywords: '大豆', icon: '1fad8', symbol: '黄豆', category: 'protein', calories: 390, protein: 35, carbs: 34.2, fat: 16 },
  { id: 'black-bean', name: '黑豆', keywords: '豆类', icon: '1fad8', symbol: '黑豆', category: 'protein', calories: 401, protein: 36, carbs: 33.6, fat: 15.9 },
  { id: 'mung-bean', name: '绿豆', keywords: '绿豆粥', icon: '1fad8', symbol: '绿豆', category: 'protein', calories: 329, protein: 21.6, carbs: 62, fat: 0.8 },
  { id: 'red-bean', name: '红豆', keywords: '赤小豆 红豆薏仁', icon: '1fad8', symbol: '红豆', category: 'protein', calories: 324, protein: 20.2, carbs: 63.4, fat: 0.6 },
  { id: 'edamame', name: '毛豆', keywords: '青豆', icon: '1fadb', symbol: '毛豆', category: 'protein', calories: 131, protein: 13.1, carbs: 10.5, fat: 5 },

  { id: 'broccoli', name: '西兰花', keywords: '西蓝花 青花菜', icon: '1f966', symbol: '西', category: 'vegetable', calories: 34, protein: 2.8, carbs: 6.6, fat: 0.4 },
  { id: 'cauliflower', name: '菜花', keywords: '花椰菜 白花菜', icon: '1f966', symbol: '花', category: 'vegetable', calories: 25, protein: 1.9, carbs: 5, fat: 0.3 },
  { id: 'purple-cabbage', name: '紫甘蓝', keywords: '紫包菜 甘蓝', icon: '1f96c', symbol: '紫甘', category: 'vegetable', calories: 31, protein: 1.4, carbs: 7.4, fat: 0.2 },
  { id: 'kale', name: '羽衣甘蓝', keywords: '甘蓝 绿叶菜', icon: '1f96c', symbol: '羽衣', category: 'vegetable', calories: 35, protein: 2.9, carbs: 4.4, fat: 1.5 },
  { id: 'spinach', name: '菠菜', keywords: '绿叶菜', icon: '1f96c', symbol: '菠', category: 'vegetable', calories: 23, protein: 2.9, carbs: 3.6, fat: 0.4 },
  { id: 'water-spinach', name: '空心菜', keywords: '蕹菜 绿叶菜', icon: '1f96c', symbol: '空', category: 'vegetable', calories: 20, protein: 2.2, carbs: 3.1, fat: 0.3 },
  { id: 'lettuce', name: '生菜', keywords: '油麦菜 绿叶菜', icon: '1f96c', symbol: '生', category: 'vegetable', calories: 15, protein: 1.4, carbs: 2.9, fat: 0.2 },
  { id: 'celtuce', name: '莴笋', keywords: '莴苣 茎用莴苣', icon: '1f96c', symbol: '莴', category: 'vegetable', calories: 15, protein: 1, carbs: 2.8, fat: 0.1 },
  { id: 'bok-choy', name: '油菜', keywords: '青菜 小油菜', icon: '1f96c', symbol: '油菜', category: 'vegetable', calories: 18, protein: 1.8, carbs: 3.1, fat: 0.2 },
  { id: 'baby-cabbage', name: '娃娃菜', keywords: '白菜 小白菜', icon: '1f96c', symbol: '娃', category: 'vegetable', calories: 13, protein: 1.5, carbs: 2.4, fat: 0.2 },
  { id: 'cabbage', name: '卷心菜', keywords: '包菜 圆白菜', icon: '1f96c', symbol: '卷', category: 'vegetable', calories: 25, protein: 1.3, carbs: 5.8, fat: 0.1 },
  { id: 'celery', name: '芹菜', keywords: '西芹', icon: '1f96c', symbol: '芹', category: 'vegetable', calories: 16, protein: 0.7, carbs: 3, fat: 0.2 },
  { id: 'pea-shoots', name: '豆苗', keywords: '豌豆苗', icon: '1fadb', symbol: '苗', category: 'vegetable', calories: 34, protein: 4, carbs: 4.2, fat: 0.4 },
  { id: 'bean-sprouts', name: '豆芽', keywords: '绿豆芽 黄豆芽', icon: '1fadb', symbol: '芽', category: 'vegetable', calories: 30, protein: 3, carbs: 5.9, fat: 0.2 },
  { id: 'snow-peas', name: '荷兰豆', keywords: '豌豆荚 雪豆', icon: '1fadb', symbol: '荷', category: 'vegetable', calories: 42, protein: 2.8, carbs: 7.5, fat: 0.2 },
  { id: 'green-beans', name: '扁豆', keywords: '四季豆 菜豆', icon: '1fadb', symbol: '扁', category: 'vegetable', calories: 31, protein: 1.8, carbs: 7, fat: 0.2 },
  { id: 'okra', name: '秋葵', keywords: '黄秋葵', icon: '1fadb', symbol: '秋', category: 'vegetable', calories: 33, protein: 1.9, carbs: 7.5, fat: 0.2 },
  { id: 'bell-pepper', name: '甜椒', keywords: '青椒 彩椒', icon: '1fad1', symbol: '椒', category: 'vegetable', calories: 26, protein: 1, carbs: 6, fat: 0.3 },
  { id: 'eggplant', name: '茄子', keywords: '紫茄 圆茄', icon: '1f346', symbol: '茄', category: 'vegetable', calories: 25, protein: 1, carbs: 5.9, fat: 0.2 },
  { id: 'bamboo-shoot', name: '竹笋', keywords: '笋 春笋 冬笋', icon: '1f96c', symbol: '笋', category: 'vegetable', calories: 27, protein: 2.6, carbs: 5.2, fat: 0.3 },
  { id: 'water-bamboo', name: '茭白', keywords: '高笋', icon: '1f96c', symbol: '茭', category: 'vegetable', calories: 26, protein: 1.2, carbs: 5.9, fat: 0.2 },
  { id: 'mushroom', name: '白蘑菇', keywords: '口蘑 菌菇', icon: '1f344', symbol: '蘑', category: 'vegetable', calories: 22, protein: 3.1, carbs: 3.3, fat: 0.3 },
  { id: 'shiitake', name: '香菇', keywords: '菌菇', icon: '1f344', symbol: '香菇', category: 'vegetable', calories: 34, protein: 2.2, carbs: 6.8, fat: 0.5 },
  { id: 'enoki', name: '金针菇', keywords: '菌菇', icon: '1f344', symbol: '金针', category: 'vegetable', calories: 37, protein: 2.7, carbs: 7.8, fat: 0.3 },
  { id: 'oyster-mushroom', name: '平菇', keywords: '侧耳 菌菇', icon: '1f344', symbol: '平菇', category: 'vegetable', calories: 26, protein: 3.3, carbs: 3.8, fat: 0.4 },
  { id: 'king-oyster-mushroom', name: '杏鲍菇', keywords: '菌菇', icon: '1f344', symbol: '杏鲍', category: 'vegetable', calories: 31, protein: 1.3, carbs: 8.3, fat: 0.1 },
  { id: 'seafood-mushroom', name: '海鲜菇', keywords: '蟹味菇 菌菇', icon: '1f344', symbol: '海鲜', category: 'vegetable', calories: 33, protein: 2.2, carbs: 6.5, fat: 0.4 },
  { id: 'wood-ear', name: '木耳', keywords: '黑木耳 菌菇', icon: '1f344', symbol: '木耳', category: 'vegetable', calories: 25, protein: 1.5, carbs: 6.8, fat: 0.2 },
  { id: 'tremella', name: '银耳', keywords: '白木耳 菌菇', icon: '1f344', symbol: '银耳', category: 'vegetable', calories: 56, protein: 1.4, carbs: 12.1, fat: 0.2 },
  { id: 'cucumber', name: '黄瓜', keywords: '青瓜', icon: '1f952', symbol: '黄', category: 'vegetable', calories: 15, protein: 0.7, carbs: 3.6, fat: 0.1 },
  { id: 'cherry-tomato', name: '圣女果', keywords: '小番茄 樱桃番茄', icon: '1f345', symbol: '小番', category: 'vegetable', calories: 22, protein: 1, carbs: 4.7, fat: 0.2 },
  { id: 'tomato', name: '番茄', keywords: '西红柿', icon: '1f345', symbol: '番', category: 'vegetable', calories: 18, protein: 0.9, carbs: 3.9, fat: 0.2 },
  { id: 'zucchini', name: '西葫芦', keywords: '角瓜', icon: '1f952', symbol: '葫', category: 'vegetable', calories: 17, protein: 1.2, carbs: 3.1, fat: 0.3 },
  { id: 'winter-melon', name: '冬瓜', keywords: '高含水蔬菜', icon: '1f952', symbol: '冬', category: 'vegetable', calories: 13, protein: 0.4, carbs: 3, fat: 0.2 },
  { id: 'loofah', name: '丝瓜', keywords: '高含水蔬菜', icon: '1f952', symbol: '丝', category: 'vegetable', calories: 20, protein: 1.2, carbs: 4.2, fat: 0.2 },
  { id: 'bitter-melon', name: '苦瓜', keywords: '凉瓜', icon: '1f952', symbol: '苦', category: 'vegetable', calories: 17, protein: 1, carbs: 3.7, fat: 0.2 },
  { id: 'white-radish', name: '白萝卜', keywords: '萝卜', icon: '1f955', symbol: '萝', category: 'vegetable', calories: 18, protein: 0.6, carbs: 4.1, fat: 0.1 },
  { id: 'carrot', name: '胡萝卜', keywords: '红萝卜', icon: '1f955', symbol: '胡', category: 'vegetable', calories: 41, protein: 0.9, carbs: 9.6, fat: 0.2 },
  { id: 'lotus-root', name: '莲藕', keywords: '藕', icon: '1f954', symbol: '藕', category: 'vegetable', calories: 74, protein: 2.6, carbs: 17.2, fat: 0.1 },
  { id: 'water-chestnut', name: '荸荠', keywords: '马蹄 地栗', icon: '1f954', symbol: '马蹄', category: 'vegetable', calories: 61, protein: 1.2, carbs: 14.2, fat: 0.2 },
  { id: 'kelp', name: '海带', keywords: '海带丝 菌藻', icon: '1f96c', symbol: '海', category: 'vegetable', calories: 43, protein: 1.7, carbs: 9.6, fat: 0.6 },
  { id: 'laver', name: '紫菜', keywords: '海苔 菌藻', icon: '1f96c', symbol: '紫菜', category: 'vegetable', calories: 35, protein: 5.8, carbs: 5.6, fat: 0.3 },
  { id: 'wakame', name: '裙带菜', keywords: '海藻 菌藻', icon: '1f96c', symbol: '裙带', category: 'vegetable', calories: 45, protein: 3, carbs: 9.1, fat: 0.6 },
  { id: 'asparagus', name: '芦笋', keywords: '石刁柏', icon: '1f96c', symbol: '芦', category: 'vegetable', calories: 20, protein: 2.2, carbs: 3.9, fat: 0.1 },
  { id: 'lily-bulb', name: '百合', keywords: '鲜百合 干百合', icon: '1f33e', symbol: '百合', category: 'vegetable', calories: 166, protein: 3.2, carbs: 38.8, fat: 0.1 },
  { id: 'lotus-seed', name: '莲子', keywords: '干莲子', icon: '1f330', symbol: '莲', category: 'carbs', calories: 344, protein: 17.2, carbs: 67.2, fat: 2 },
  { id: 'garlic', name: '大蒜', keywords: '蒜蓉 蒜', icon: '1f9c4', symbol: '蒜', category: 'vegetable', calories: 149, protein: 6.4, carbs: 33.1, fat: 0.5 },
  { id: 'ginger', name: '生姜', keywords: '姜', icon: '1fada', symbol: '姜', category: 'vegetable', calories: 80, protein: 1.8, carbs: 17.8, fat: 0.8 },

  { id: 'apple', name: '苹果', keywords: '水果', icon: '1f34e', symbol: '苹', category: 'carbs', calories: 52, protein: 0.3, carbs: 13.8, fat: 0.2 },
  { id: 'banana', name: '香蕉', keywords: '训练前水果 水果', icon: '1f34c', symbol: '蕉', category: 'carbs', calories: 89, protein: 1.1, carbs: 22.8, fat: 0.3 },
  { id: 'orange', name: '橙子', keywords: '橘子 柑橘 水果', icon: '1f34a', symbol: '橙', category: 'carbs', calories: 47, protein: 0.9, carbs: 11.8, fat: 0.1 },
  { id: 'strawberry', name: '草莓', keywords: '莓果 水果', icon: '1f353', symbol: '莓', category: 'carbs', calories: 32, protein: 0.7, carbs: 7.7, fat: 0.3 },
  { id: 'blueberry', name: '蓝莓', keywords: '莓果 水果', icon: '1fad0', symbol: '蓝莓', category: 'carbs', calories: 57, protein: 0.7, carbs: 14.5, fat: 0.3 },
  { id: 'pear', name: '梨', keywords: '水果', icon: '1f350', symbol: '梨', category: 'carbs', calories: 57, protein: 0.4, carbs: 15.2, fat: 0.1 },
  { id: 'kiwi', name: '猕猴桃', keywords: '奇异果 水果', icon: '1f95d', symbol: '猕', category: 'carbs', calories: 61, protein: 1.1, carbs: 14.7, fat: 0.5 },
  { id: 'grapefruit', name: '柚子', keywords: '西柚 水果', icon: '1f34a', symbol: '柚', category: 'carbs', calories: 42, protein: 0.8, carbs: 10.7, fat: 0.1 },
  { id: 'red-dates', name: '红枣', keywords: '大枣 枣', icon: '1f352', symbol: '枣', category: 'carbs', calories: 125, protein: 1.8, carbs: 30.5, fat: 0.2 },
  { id: 'avocado', name: '牛油果', keywords: '鳄梨', icon: '1f951', symbol: '油果', category: 'fat', calories: 160, protein: 2, carbs: 8.5, fat: 14.7 },
  { id: 'mixed-nuts', name: '原味坚果', keywords: '坚果 杏仁 核桃 腰果', icon: '1f95c', symbol: '坚果', category: 'fat', calories: 607, protein: 20, carbs: 21, fat: 54 },
  { id: 'cooking-oil', name: '食用油', keywords: '植物油 烹调油', icon: '1fad2', symbol: '油', category: 'fat', calories: 884, protein: 0, carbs: 0, fat: 100 },
  { id: 'olive-oil', name: '橄榄油', keywords: '初榨橄榄油', icon: '1fad2', symbol: '橄榄', category: 'fat', calories: 884, protein: 0, carbs: 0, fat: 100 },
  { id: 'black-coffee', name: '黑咖啡', keywords: '无糖咖啡', icon: '2615', symbol: '咖', category: 'carbs', calories: 2, protein: 0.3, carbs: 0, fat: 0 }
]

// USDA FoodData Central distinguishes preparation state in the food description.
// Keep raw and cooked foods as separate records so grams are never interpreted ambiguously.
const FOOD_OVERRIDES = {
  rice: { name: '米饭（熟）', keywords: '熟米饭 白米饭 大米 熟' },
  oats: { name: '燕麦片（干）', keywords: '燕麦 干燕麦 生燕麦片' },
  'sweet-potato': { name: '红薯（生）', keywords: '地瓜 甘薯 生红薯' },
  potato: { name: '土豆（生）', keywords: '马铃薯 生土豆' },
  pumpkin: { name: '普通南瓜（生）', keywords: '老南瓜 生南瓜' },
  chicken: { name: '鸡胸肉（熟）', keywords: '熟鸡胸 去皮鸡肉 熟' },
  'chicken-thigh': { name: '去皮鸡腿肉（熟）', keywords: '熟鸡腿 鸡肉 熟' },
  beef: { name: '瘦牛肉（生）', keywords: '牛肉 牛肉片 生牛肉' },
  pork: { name: '瘦猪肉（生）', keywords: '猪肉 肉片 生猪肉' },
  'pork-ribs': { name: '猪排骨（熟）', keywords: '熟排骨 猪排骨' },
  duck: { name: '鸭肉（生）', keywords: '鸭腿 去皮鸭肉 生' },
  salmon: { name: '三文鱼（生）', keywords: '鲑鱼 生三文鱼' },
  'basa-fish': { name: '巴沙鱼（生）', keywords: '巴沙鱼柳 龙利鱼 冷冻鱼柳 生' },
  'crucian-carp': { name: '鲫鱼（生）', keywords: '淡水鱼 生鲫鱼' },
  'white-fish': { name: '白肉鱼（生）', keywords: '鱼片 海鱼 生鱼' },
  shrimp: { name: '去皮虾仁（熟）', keywords: '熟虾仁 白灼虾 熟' },
  egg: { unitStep: 50, unitLabel: '个', unitGrams: 50 },
  garlic: { category: 'other' },
  ginger: { category: 'other' },
  'black-coffee': { category: 'other' }
}

const ADDITIONAL_FOODS = [
  { id: 'water', name: '清水', category: 'other', symbol: '水', useIcon: false, calories: 0, carbs: 0, protein: 0, fat: 0 },
  { id: 'salt', name: '食盐', category: 'other', symbol: '盐', useIcon: false, calories: 0, carbs: 0, protein: 0, fat: 0 },
  { id: 'sugar', name: '白糖', category: 'carbs', symbol: '糖', useIcon: false, calories: 400, carbs: 100, protein: 0, fat: 0 },
  { id: 'baking-soda', name: '小苏打', category: 'other', symbol: '苏打', useIcon: false, calories: 0, carbs: 0, protein: 0, fat: 0 },
  { id: 'rice-raw', name: '大米（生）', keywords: '生米 大米 干米', icon: '1f35a', symbol: '生米', category: 'carbs', calories: 365, protein: 7.1, carbs: 80, fat: 0.7 },
  { id: 'sweet-potato-cooked', name: '红薯（熟）', keywords: '烤红薯 蒸红薯 熟地瓜', icon: '1f360', symbol: '熟薯', category: 'carbs', calories: 90, protein: 2, carbs: 20.7, fat: 0.2 },
  { id: 'potato-cooked', name: '土豆（熟）', keywords: '煮土豆 蒸土豆 熟马铃薯', icon: '1f954', symbol: '熟土', category: 'carbs', calories: 87, protein: 1.9, carbs: 20.1, fat: 0.1 },
  { id: 'beibei-pumpkin', name: '贝贝南瓜（熟）', keywords: '贝贝南瓜 熟南瓜 蒸南瓜', icon: '1f383', symbol: '贝南', category: 'carbs', calories: 91, protein: 1.9, carbs: 20.6, fat: 0.6 },
  { id: 'beibei-pumpkin-raw', name: '贝贝南瓜（生）', keywords: '贝贝南瓜 生南瓜', icon: '1f383', symbol: '生贝', category: 'carbs', calories: 81, protein: 1.8, carbs: 18.5, fat: 0.5 },
  { id: 'chicken-raw', name: '鸡胸肉（生）', keywords: '生鸡胸 去皮鸡肉 生', icon: '1f357', symbol: '生鸡', category: 'protein', calories: 120, protein: 22.5, carbs: 0, fat: 2.6 },
  { id: 'chicken-thigh-raw', name: '去皮鸡腿肉（生）', keywords: '生鸡腿 鸡肉 生', icon: '1f357', symbol: '生腿', category: 'protein', calories: 119, protein: 19.7, carbs: 0, fat: 4.7 },
  { id: 'beef-cooked', name: '瘦牛肉（熟）', keywords: '熟牛肉 煎牛肉 牛肉条', icon: '1f969', symbol: '熟牛', category: 'protein', calories: 173, protein: 29.7, carbs: 0, fat: 4.8 },
  { id: 'pork-cooked', name: '瘦猪肉（熟）', keywords: '熟猪肉 猪里脊', icon: '1f969', symbol: '熟猪', category: 'protein', calories: 196, protein: 29.1, carbs: 0, fat: 7.5 },
  { id: 'pork-ribs-raw', name: '猪排骨（生）', keywords: '生排骨 猪排骨', icon: '1f969', symbol: '生排', category: 'protein', calories: 216, protein: 18.6, carbs: 0, fat: 15.4 },
  { id: 'duck-cooked', name: '鸭肉（熟）', keywords: '熟鸭肉 熟鸭腿', icon: '1f986', symbol: '熟鸭', category: 'protein', calories: 201, protein: 23.5, carbs: 0, fat: 11.2 },
  { id: 'salmon-cooked', name: '三文鱼（熟）', keywords: '煎三文鱼 烤三文鱼 熟鲑鱼', icon: '1f41f', symbol: '熟鲑', category: 'protein', calories: 206, protein: 22.1, carbs: 0, fat: 12.4 },
  { id: 'basa-fish-cooked', name: '巴沙鱼（熟）', keywords: '熟巴沙鱼 清蒸鱼柳', icon: '1f41f', symbol: '熟巴', category: 'protein', calories: 105, protein: 18, carbs: 0, fat: 3 },
  { id: 'crucian-carp-cooked', name: '鲫鱼（熟）', keywords: '熟鲫鱼 鲫鱼汤', icon: '1f41f', symbol: '熟鲫', category: 'protein', calories: 130, protein: 20.8, carbs: 0, fat: 4 },
  { id: 'white-fish-cooked', name: '白肉鱼（熟）', keywords: '清蒸鱼 熟鱼片', icon: '1f41f', symbol: '熟鱼', category: 'protein', calories: 120, protein: 25, carbs: 0, fat: 1 },
  { id: 'shrimp-raw', name: '去皮虾仁（生）', keywords: '生虾仁 鲜虾 生', icon: '1f990', symbol: '生虾', category: 'protein', calories: 85, protein: 20.1, carbs: 0.2, fat: 0.5 },
  { id: 'protein-powder', name: '蛋白粉', keywords: '乳清蛋白粉 蛋白补充', icon: '1f95b', symbol: '粉', category: 'protein', calories: 400, protein: 80, carbs: 8, fat: 6 },
  { id: 'mixed-vegetables', name: '杂蔬', keywords: '混合蔬菜 卷心菜 热量', icon: '1f96c', symbol: '杂蔬', category: 'fiber', calories: 25, protein: 1.3, carbs: 5.8, fat: 0.1 },
  { id: 'chia-seeds', name: '奇亚籽', keywords: '奇亚籽 膳食纤维 籽', icon: '1f330', symbol: '奇亚', category: 'fiber', calories: 486, protein: 16.5, carbs: 42.1, fat: 30.7 },
  { id: 'flax-seeds', name: '亚麻籽', keywords: '亚麻籽 膳食纤维 籽', icon: '1f330', symbol: '亚麻', category: 'fiber', calories: 534, protein: 18.3, carbs: 28.9, fat: 42.2 },
  { id: 'soy-sauce', name: '酱油', keywords: '生抽 老抽 调味料', symbol: '酱', category: 'other', calories: 53, protein: 8.1, carbs: 4.9, fat: 0.6 },
  { id: 'orleans-seasoning', name: '奥尔良调味粉', keywords: '奥尔良 腌料 调味粉 包装食品', symbol: '奥', category: 'other', calories: 250, protein: 10, carbs: 50, fat: 2, editableNutrition: true }
]

// User-requested recipes, transcribed and checked on 2026-09-08.
// Preparation quantities are scaled for cooking but NOT treated as fully eaten.
const REQUESTED_RECIPE_VERSION = 3

// Only remove the app-authored commentary from these imported recipes; keep cooking text.
function conciseRequestedRecipeNotes(notes) {
  return String(notes||'').split('\n').filter(line=>! /^(烹饪补充（非原文）：|说明：“全价人粮”|版本核对：按用户提供配方图|整理说明：不以气味|营养口径：|用户2026-09-08补充：)/.test(line))
    .map(line=>line
      .replace('；原文约2分钟仅为薄片参考。','。')
      .replace('此为作者标注，并非本应用实测，也不是每100g数值；应用按库内食材独立估算，未提供实测成品重量。','')
      .replace('黑胡椒3g由视频00:40清晰画面核对，其他调料与图片一致。','')
      .replace('原文另述小苏打每500g肉用3g，本菜肴保留材料表7g。','')
      .replace('，替换后需重新计算营养','')
      .replace('按实际出锅总重填写成品重量，再按每份实际克重记录。','')
      .replace('；不同电饭煲、厚度的时间不同，检查中心熟透后再出锅','，煮至熟透')
      .replace('可选调味：原文淀粉和油可不加，未给精确克重，本菜肴未默认加入。','可选调味：淀粉和油可不加。')
      .replace('，但原文未给替换量',''))
    .filter(Boolean).join('\n')
}

function addRequestedDishes(library) {
  if(!library.some(food=>food.name==='米曲（干）'))library.push({id:'rice-koji-dry',name:'米曲（干）',category:'carbs',symbol:'米曲',useIcon:false,keywords:'米麴 米糀 米曲 米こうじ',calories:370,carbs:84.3,protein:5.9,fat:1,requestedRecipeVersion:3,editableNutrition:true,nutritionEstimate:'Marukome 干米曲标签，每100g。',nutritionSource:{name:'Marukome プラス糀 甘酒用 乾燥米こうじ',url:'https://www.marukome.co.jp/product/detail/koji_061/',checkedAt:'2026-09-08',basis:'100g'}})
  const definitions = [
    {
      id:'dish-cunlv-salt-koji',name:'盐曲',symbol:'盐曲',sourceName:'村驴',version:3,category:'other',
      ingredients:[['米曲（干）',200],['食盐',53],['清水',300]],preparation:[],estimate:'按米曲、盐和水的投料比例计算。',
      notes:'1. 准备750ml干净无油无水的密封罐，放入米曲、食盐和清水，搅拌均匀后盖好。\n2. 放在阴凉干燥、避光处，每天用干净器具搅拌一次。\n3. 发酵约6～14天，米粒逐渐变碎、呈稀糊状。完成后放入冰箱冷藏。\n4. 腌肉时取肉重10%的盐曲，例如鸡胸肉200g配盐曲20g。'
    },
    {
      id:'dish-qiemao-complete-loaf', name:'全价人粮', symbol:'人粮', sourceName:'茄猫的罐头', version:2,
      ingredients:[['鸡胸肉（生）',700],['鸡蛋',100],['亚麻籽',40,'熟亚麻籽'],['香菇',100,'香菇（泡发）'],['胡萝卜',100],['豌豆（鲜）',100,'青豆（按鲜豌豆）'],['玉米',100],['西芹',200],['玉米淀粉',40,'淀粉（按玉米淀粉）'],['燕麦片（干）',150],['酱油',60,'生抽（参考值）'],['食盐',3],['清水',60],['食用油',20]],
      preparation:[['黑胡椒',3],['蚝油',20],['五香粉',2]],
      estimate:'鸡蛋2个按100g；淀粉按玉米淀粉。营养按所列食材投料计算。',
      notes:'1. 准备食材：鸡胸可去掉白色筋膜；香菇泡发、沥水后称量。鸡蛋2个去壳称重，应用暂按合计100g。蔬菜可按喜好替换，使用冷冻杂菜粒更方便；熟亚麻籽也可换其他高膳食纤维坚果，替换后需重新计算营养。\n2. 将食材和调料全部放入搅拌机打成泥。搅拌机较小时分批搅打，最后混匀。\n3. 电饭煲底部和内壁薄刷油，放入食材泥，压实并排出多余空气。\n4. 使用煮饭模式烹饪。原图大份量用两个回合，较少份量可缩短；不同电饭煲、厚度的时间不同，检查中心熟透后再出锅。\n5. 原配方分成5份，及时冷却、分装冷冻；食用前充分复热。按实际出锅总重填写成品重量，再按每份实际克重记录。\n原图调料：生抽60g、黑胡椒3g、盐3g、蚝油20g、五香粉2g、水60g、油20g；另有刷锅油但未给用量。黑胡椒3g由视频00:40清晰画面核对，其他调料与图片一致。\n版本核对：按用户提供配方图采用淀粉40g；视频00:30～00:37前段写50g，两者不同，未混用。图中蔬菜为泡发香菇100g、胡萝卜／青豆／玉米各100g，西芹另200g。\n原作者每块参考（整份均分5块）：462kcal、蛋白质39g、碳水42g、脂肪14g、膳食纤维8g。此为作者标注，并非本应用实测，也不是每100g数值；应用按库内食材独立估算，未提供实测成品重量。\n说明：“全价人粮”沿用菜肴名称，不代表已证明营养全面或适合长期单一饮食；视频标题的5分钟不是整批生鸡肉煮熟所需时间。',
    },
    {
      id:'dish-cunlv-brined-beef', name:'盐水牛肉', symbol:'牛肉', sourceName:'村驴',
      ingredients:[['牛腱（生）',1750]],
      preparation:[['炒盐用盐',80],['炒盐用八角',1.5],['炒盐用香叶',0.5],['炒盐用花椒',6],['炖煮清水',3000],['小葱',5,'根'],['生姜',50],['炖煮八角',5],['炖煮香叶',1],['白芷',3],['草果皮（去籽）',1,'个'],['良姜',10],['山奈',10],['小茴香',1.5],['白蔻',1],['香茅草',1],['味精',10],['鸡精',10]],
      estimate:'营养按牛腱投料计算，汤料不计。',
      notes:'1. 牛腱切成大小相近的块，用牙签扎孔，冷藏浸泡清水2小时，沥干并挤去水分。\n2. 盐与炒盐用香料入干锅，大火炒出香气后转小火，炒至盐和香叶微黄，筛开盐与香料。\n3. 按原配方取炒盐的5/8和全部炒过的香料揉匀肉块，密封冷藏24小时。\n4. 牛肉冷水入锅，煮开后小火2分钟，捞出清理浮沫。\n5. 炖煮香料装袋，另起清水加入葱姜、料包、味精、鸡精；冷吃用剩余炒盐，热吃可减少。水沸后放入牛肉，盖盖最小火炖约2小时。\n6. 冷吃时及时冷却并冷藏，整腱直接冷藏、碎块可紧密包好冷藏过夜，次日切片；多余分装冷冻。\n原配方用盐：1750g牛腱配炒盐80g，腌肉50g；冷吃炖煮用余盐30g，热吃用20g。原文另列小肉块1500g配腌盐40g、牛肋条配30g，不与主配方叠加。\n营养口径：只计生牛腱，盐水及香料不作为成品重量；实际成品需称重后填写。'
    },
    {
      id:'dish-cunlv-tender-chicken', name:'水嫩鸡排', symbol:'鸡排', sourceName:'村驴',
      ingredients:[['鸡胸肉（生）',1200],['小苏打',7],['白胡椒粉',0.5],['味精',5],['食盐',3],['奥尔良调味粉',20],['清水',250],['玉米淀粉',90]],
      preparation:[['洋葱粉',2],['大蒜粉',2]],
      estimate:'按所列食材投料计算；洋葱粉、蒜粉和煎油另计。',
      notes:'1. 鸡胸去掉筋膜与多余油脂，吸干，每块片成3～4片。\n2. 将全部调味粉、盐、小苏打和水搅匀，再加玉米淀粉，放入肉片抓匀，密封冷藏过夜。\n3. 烹饪前重新拌匀沉底的淀粉；多余肉片摊平分袋冷冻，食用前移入冰箱冷藏解冻。\n4. 油煎法：不粘锅薄喷油并预热约2分钟，大火煎第一面约1分钟，翻面再约90秒，按肉片厚度延长至熟透。\n5. 无油法：肉片入锅，底面定型后翻面，少量加水盖盖，大火收干；再翻面、加水、盖盖至水干并熟透。\n原配方用量：鸡胸1200g、小苏打7g、洋葱粉2g、大蒜粉2g、白胡椒粉0.5g、味精5g、盐3g、奥尔良粉20g、水250g、玉米淀粉90g。原文另述小苏打每500g肉用3g，本菜肴保留材料表7g。\n替换备注：洋葱粉／蒜粉可换新鲜碎料，烹饪前清除；无奥尔良粉可加盐调味，但原文未给替换量。\n营养口径：粉料以包装为准；洋葱粉、大蒜粉无现有营养条目，暂列备料，煎油按实际使用量另补。'
    },
    {
      id:'dish-cunlv-koji-chicken', name:'爆汁鸡胸肉', symbol:'鸡肉', sourceName:'村驴',
      ingredients:[['鸡胸肉（生）',200],['盐曲',20]], preparation:[],
      estimate:'按鸡胸肉和盐曲投料计算；煎油另计。',
      notes:'1. 鸡胸修去筋膜和多余油脂，片成薄片。盐曲用量为鸡胸肉的10%，抓匀后盖好，冷藏腌30分钟～2小时。\n2. 煎前去除表面盐曲，并用厨房纸吸干。\n3. 不粘锅薄喷油、预热，肉片下锅，一面变色后翻面，转中小火，往返翻3～4次至熟透。'
    },
    {
      id:'dish-brined-chicken', name:'盐水鸡胸肉', symbol:'盐鸡', sourceName:'',
      ingredients:[['鸡胸肉（生）',500]], preparation:[['浸泡用清水',500],['浸泡用盐',15]],
      estimate:'营养按鸡胸肉投料计算，浸泡盐水不计。',
      notes:'1. 鸡胸肉500g，用500g水与15g盐调成的盐水密封冷藏浸泡1～2天，可加入香叶、八角、桂皮、黑胡椒等香料。\n2. 腌好取出，清理表面盐分，装入明确适合水煮温度的食品用袋，封好袋口。\n3. 烧半锅能没过鸡胸肉的清水，水开后转最小火，连袋放入鸡胸肉，盖盖煮5分钟；立刻关火，不开盖再焖10分钟，取出隔袋用冷水冲凉。\n原配方备选腌法：用肉重2%～3%的盐抹匀冷藏48小时，500g肉对应10～15g盐；与盐水浸泡二选一，不叠加。\n可选调味：原文淀粉和油可不加，未给精确克重，本菜肴未默认加入。\n用户2026-09-08补充：鸡胸肉500g，烹煮只保留隔袋煮5分钟、焖10分钟、冷水冲凉这一种；删除其余煮／蒸方案。'
    }
  ]
  const keys=['calories','carbs','protein','fat']
  for(const definition of definitions) {
    if(library.some(food=>food.id===definition.id))continue
    const ingredients=definition.ingredients.map(([name,amount,label])=>{
      const food=library.find(item=>item.name===name)
      return food?{foodId:food.id,name:label||name,amount,...Object.fromEntries(keys.map(key=>[key,food[key]]))}:null
    })
    if(ingredients.some(item=>!item))continue
    const weight=ingredients.reduce((sum,item)=>sum+item.amount,0)
    const nutrition=Object.fromEntries(keys.map(key=>[key,Math.round(ingredients.reduce((sum,item)=>sum+item[key]*item.amount,0)/weight*10)/10]))
    library.push({id:definition.id,name:definition.name,kind:'dish',category:definition.category||'protein',symbol:definition.symbol,useIcon:false,builtIn:true,requestedRecipeVersion:definition.version||1,keywords:`${definition.sourceName} ${definition.name}`,nutritionEstimate:definition.estimate,...nutrition,recipe:{ingredients,yieldWeight:0,sourceName:definition.sourceName,sourceUrl:'',preparation:definition.preparation.map(([name,amount,unit='g'])=>({name,amount,unit})),notes:conciseRequestedRecipeNotes(definition.notes)}})
  }
  return library
}

function addBuiltInDishes(library) {
  const starches=library.filter(food=>['玉米淀粉','土豆淀粉','红薯淀粉','小麦淀粉'].includes(food.name))
  if(!starches.length)return library
  const starch={id:'tapioca-starch',name:'木薯淀粉',category:'carbs',symbol:'淀粉',useIcon:false,keywords:'木薯粉',...Object.fromEntries(['calories','carbs','protein','fat'].map(key=>[key,Math.round(starches.reduce((sum,food)=>sum+food[key],0)/starches.length*10)/10])),nutritionEstimate:'原食谱未提供标签，暂按库内四类淀粉均值估算，可按包装修改。'}
  library.push(starch)
  const definitions=[['鸡胸肉（生）',500],['鸡蛋白',30],['清水',80],['木薯淀粉',20],['食盐',6],['白糖',5],['白胡椒粉',1],['小苏打',3],['味精',5]]
  const ingredients=definitions.map(([name,amount])=>{const food=library.find(item=>item.name===name);return food?{foodId:food.id,name:name==='清水'?'葱姜水':name,amount,...Object.fromEntries(['calories','carbs','protein','fat'].map(key=>[key,food[key]]))}:null})
  if(ingredients.some(item=>!item))return library
  const weight=ingredients.reduce((sum,item)=>sum+item.amount,0)
  const nutrition=Object.fromEntries(['calories','carbs','protein','fat'].map(key=>[key,Math.round(ingredients.reduce((sum,item)=>sum+item[key]*item.amount/100,0)/weight*1000)/10]))
  library.push({id:'dish-chicken-meatballs',name:'鸡胸肉丸',kind:'dish',category:'protein',symbol:'肉丸',useIcon:false,builtIn:true,...nutrition,recipe:{ingredients,yieldWeight:0,sourceName:'小红书 · 连肉搅多少下都直接告诉你❗️包教包会❗️',sourceUrl:'https://xhslink.cn/o/3k3EAkHDJhe',preparation:[{name:'小葱',amount:2,unit:'根'},{name:'姜',amount:2,unit:'块'},{name:'蒜',amount:4,unit:'瓣'},{name:'温水',amount:130,unit:'g'}],notes:'1. 葱姜冰水：葱姜蒜拍碎，加温水抓捏并浸泡5分钟，过滤留80g，冷冻至带冰碴。\n2. 冻肉：鸡胸去筋膜、油脂，切薄片平铺，冷冻约2小时至表硬内软。\n3. 低温搅打：肉＋全部干粉，高速点打10次（每次3秒）；加蛋清再10次；冰水分3次加，每次15次；刮净刀片后再8次（每次5秒）。肉泥应膨胀、黏稠且有弹性。\n4. 煮丸：水至70–80℃、锅底密集小泡时关火；手和勺蘸水，虎口挤丸入锅。全部下锅后最小火约8分钟，水面微动不沸腾，煮至浮起并熟透。\n5. 定型：捞入冰水浸泡1分钟。\n用量说明：1个蛋清暂按30g折算，可按实际称重修改。葱姜蒜渣滤除，不计入投料营养；仅计80g滤水。木薯淀粉暂按同类淀粉均值估算；可换土豆/红薯淀粉，口感略有差异。原配方盐6g（可减为4g）、糖5g（可换零卡糖）、味精5g（可不放）；小苏打3g，不宜多加。'}})
  return library
}
