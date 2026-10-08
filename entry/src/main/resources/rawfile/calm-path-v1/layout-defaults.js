// User-approved defaults from the 2026-09-22 backup. Business data is not bundled.
const bundledSpacingDefaults = {
  "pageSpacing": {
    "version": 2,
    "safeTop": 45,
    "rules": [
      {
        "scope": "page:today",
        "path": [
          {
            "tag": "section",
            "index": 1
          },
          {
            "tag": "button",
            "id": "summary-target-button",
            "index": 1
          }
        ],
        "values": {
          "margin-bottom": -1
        }
      },
      {
        "scope": "page:today",
        "path": [
          {
            "tag": "section",
            "index": 1
          }
        ],
        "values": {
          "padding-bottom": 17
        }
      },
      {
        "scope": "page:today",
        "path": [
          {
            "tag": "section",
            "index": 1
          },
          {
            "tag": "div",
            "index": 1
          },
          {
            "tag": "div",
            "index": 2
          }
        ],
        "values": {
          "padding-right": 8,
          "padding-left": 8
        }
      },
      {
        "scope": "page:today",
        "path": [
          {
            "tag": "section",
            "index": 1
          },
          {
            "tag": "div",
            "index": 1
          }
        ],
        "values": {
          "padding-right": 5,
          "padding-left": 5
        }
      },
      {
        "scope": "page:today",
        "path": [
          {
            "tag": "section",
            "index": 2
          },
          {
            "tag": "div",
            "index": 1
          }
        ],
        "values": {
          "padding-right": 5,
          "padding-left": 10,
          "margin-top": 0,
          "margin-bottom": 0
        }
      },
      {
        "scope": "page:today",
        "path": [
          {
            "tag": "section",
            "index": 2
          },
          {
            "tag": "ol",
            "id": "meal-list",
            "index": 1
          }
        ],
        "values": {
          "padding-right": 10
        }
      },
      {
        "scope": "page:today",
        "group": "meal-copy",
        "path": [],
        "values": {
          "padding-left": 2
        }
      },
      {
        "scope": "page:today",
        "group": "meal-row-content",
        "path": [],
        "values": {
          "padding-top": 10,
          "padding-bottom": 10,
          "row-gap": 0
        }
      },
      {
        "scope": "page:foods",
        "path": [
          {
            "tag": "div",
            "index": 1
          },
          {
            "tag": "div",
            "index": 2
          }
        ],
        "values": {
          "margin-top": -4,
          "margin-bottom": -4
        }
      },
      {
        "scope": "page:foods",
        "path": [
          {
            "tag": "div",
            "index": 1
          },
          {
            "tag": "div",
            "index": 3
          }
        ],
        "values": {
          "margin-top": 0,
          "margin-bottom": 4
        }
      },
      {
        "scope": "page:foods",
        "path": [
          {
            "tag": "div",
            "index": 1
          },
          {
            "tag": "label",
            "index": 1
          }
        ],
        "values": {
          "padding-top": 4,
          "row-gap": 4
        }
      },
      {
        "scope": "page:foods",
        "group": "library-food",
        "path": [],
        "values": {
          "padding-top": 0,
          "padding-bottom": 0,
          "margin-top": 0
        }
      },
      {
        "scope": "page:foods",
        "path": [
          {
            "tag": "div",
            "index": 1
          },
          {
            "tag": "div",
            "index": 2
          },
          {
            "tag": "div",
            "index": 1
          }
        ],
        "values": {
          "padding-top": 4,
          "padding-bottom": 4,
          "margin-top": 4,
          "margin-bottom": 4
        }
      },
      {
        "scope": "page:prep",
        "path": [
          {
            "tag": "div",
            "index": 1
          },
          {
            "tag": "section",
            "id": "week-plan-card",
            "index": 2
          }
        ],
        "values": {
          "margin-top": 4
        }
      },
      {
        "scope": "page:prep",
        "path": [
          {
            "tag": "div",
            "index": 1
          },
          {
            "tag": "section",
            "index": 3
          }
        ],
        "values": {
          "margin-top": 4
        }
      },
      {
        "scope": "page:prep",
        "group": "shopping-check",
        "path": [],
        "values": {
          "margin-left": 0
        }
      },
      {
        "scope": "page:prep",
        "group": "shopping-copy",
        "path": [],
        "values": {
          "padding-right": 0,
          "padding-left": 5,
          "margin-right": -5
        }
      },
      {
        "scope": "page:prep",
        "path": [
          {
            "tag": "div",
            "index": 1
          },
          {
            "tag": "section",
            "index": 3
          },
          {
            "tag": "div",
            "index": 1
          }
        ],
        "values": {
          "padding-top": 0,
          "margin-top": -10,
          "margin-bottom": -10
        }
      },
      {
        "scope": "page:prep",
        "path": [
          {
            "tag": "div",
            "index": 1
          },
          {
            "tag": "section",
            "index": 1
          },
          {
            "tag": "div",
            "index": 1
          }
        ],
        "values": {
          "margin-top": -4,
          "margin-bottom": -4
        }
      },
      {
        "scope": "page:insights",
        "path": [
          {
            "tag": "div",
            "index": 1
          },
          {
            "tag": "div",
            "index": 2
          }
        ],
        "values": {
          "padding-left": 14,
          "margin-bottom": 0,
          "row-gap": 0
        }
      },
      {
        "scope": "page:insights",
        "path": [
          {
            "tag": "div",
            "index": 1
          },
          {
            "tag": "div",
            "index": 1
          }
        ],
        "values": {
          "margin-bottom": 0
        }
      },
      {
        "scope": "page:insights",
        "path": [
          {
            "tag": "div",
            "index": 1
          },
          {
            "tag": "div",
            "id": "trend-statistics",
            "index": 3
          },
          {
            "tag": "section",
            "index": 1
          },
          {
            "tag": "div",
            "index": 1
          },
          {
            "tag": "h2",
            "id": "average-title",
            "index": 1
          }
        ],
        "values": {
          "padding-left": 14
        }
      },
      {
        "scope": "page:insights",
        "path": [
          {
            "tag": "div",
            "index": 1
          },
          {
            "tag": "div",
            "id": "trend-statistics",
            "index": 3
          },
          {
            "tag": "section",
            "index": 2
          },
          {
            "tag": "div",
            "index": 1
          },
          {
            "tag": "h2",
            "id": "calorie-chart-title",
            "index": 1
          }
        ],
        "values": {
          "padding-left": 14
        }
      },
      {
        "scope": "page:insights",
        "path": [
          {
            "tag": "div",
            "index": 1
          },
          {
            "tag": "div",
            "id": "trend-statistics",
            "index": 3
          },
          {
            "tag": "section",
            "index": 3
          },
          {
            "tag": "div",
            "index": 1
          },
          {
            "tag": "h2",
            "id": "macro-chart-title",
            "index": 1
          }
        ],
        "values": {
          "padding-left": 14
        }
      },
      {
        "scope": "page:insights",
        "path": [
          {
            "tag": "div",
            "index": 1
          },
          {
            "tag": "div",
            "id": "trend-statistics",
            "index": 3
          },
          {
            "tag": "section",
            "index": 4
          },
          {
            "tag": "div",
            "index": 1
          },
          {
            "tag": "div",
            "index": 1
          }
        ],
        "values": {
          "padding-left": 14
        }
      },
      {
        "scope": "page:insights",
        "path": [
          {
            "tag": "div",
            "index": 1
          },
          {
            "tag": "div",
            "id": "trend-statistics",
            "index": 3
          },
          {
            "tag": "section",
            "index": 3
          },
          {
            "tag": "div",
            "index": 2
          }
        ],
        "values": {
          "padding-left": 14
        }
      },
      {
        "scope": "page:insights",
        "path": [
          {
            "tag": "div",
            "index": 1
          },
          {
            "tag": "div",
            "id": "trend-statistics",
            "index": 3
          },
          {
            "tag": "section",
            "index": 3
          },
          {
            "tag": "div",
            "id": "macro-chart",
            "index": 3
          }
        ],
        "values": {
          "padding-top": 4
        }
      },
      {
        "scope": "page:insights",
        "path": [
          {
            "tag": "div",
            "index": 1
          },
          {
            "tag": "div",
            "id": "trend-statistics",
            "index": 3
          },
          {
            "tag": "section",
            "index": 2
          },
          {
            "tag": "div",
            "id": "calorie-chart",
            "index": 2
          }
        ],
        "values": {
          "padding-top": 4
        }
      },
      {
        "scope": "page:insights",
        "path": [
          {
            "tag": "div",
            "index": 1
          },
          {
            "tag": "div",
            "index": 1
          },
          {
            "tag": "button",
            "id": "trend-weight-button",
            "index": 1
          }
        ],
        "values": {
          "margin-left": 4
        }
      },
      {
        "scope": "page:today",
        "group": "meal-row-content",
        "path": [
          {
            "tag": "div",
            "index": 2
          }
        ],
        "values": {
          "padding-top": 8,
          "padding-right": 16,
          "padding-bottom": 0,
          "padding-left": 0,
          "margin-right": -25
        }
      },
      {
        "scope": "page:today",
        "group": "meal-copy",
        "path": [
          {
            "tag": "strong",
            "index": 1
          }
        ],
        "values": {
          "margin-right": -11
        }
      },
      {
        "scope": "dialog:添加当日餐次",
        "path": [
          {
            "tag": "div",
            "index": 1
          },
          {
            "tag": "p",
            "index": 1
          }
        ],
        "values": {
          "margin-bottom": -16
        }
      },
      {
        "scope": "dialog:添加当日餐次",
        "group": "form-field",
        "path": [
          {
            "tag": "span",
            "index": 1
          }
        ],
        "values": {
          "padding-top": 6,
          "padding-left": 8,
          "margin-top": -1
        }
      },
      {
        "scope": "editor:method-save-confirmation",
        "path": [
          {
            "tag": "div",
            "id": "sheet-content",
            "index": 1
          },
          {
            "tag": "p",
            "index": 1
          }
        ],
        "values": {
          "margin-top": -10,
          "margin-bottom": -16
        }
      },
      {
        "scope": "editor:method-save-confirmation",
        "group": "form-field",
        "path": [
          {
            "tag": "span",
            "index": 1
          }
        ],
        "values": {
          "padding-left": 5
        }
      },
      {
        "scope": "editor:record-calendar",
        "path": [
          {
            "tag": "div",
            "id": "sheet-content",
            "index": 1
          }
        ],
        "values": {
          "padding-top": 0
        }
      },
      {
        "scope": "page:prep",
        "path": [
          {
            "tag": "div",
            "index": 1
          },
          {
            "tag": "section",
            "id": "week-plan-card",
            "index": 2
          },
          {
            "tag": "button",
            "id": "week-plan-toggle",
            "index": 1
          }
        ],
        "values": {
          "margin-top": 2,
          "margin-bottom": 2
        }
      },
      {
        "scope": "editor-family:food-price",
        "path": [],
        "values": {
          "padding-right": 25,
          "padding-left": 16
        },
        "group": "price-receipt"
      },
      {
        "scope": "page:prep",
        "group": "shopping-item",
        "path": [],
        "values": {
          "padding-right": 4,
          "margin-top": 2
        }
      },
      {
        "scope": "page:today",
        "path": [
          {
            "tag": "section",
            "index": 2
          },
          {
            "tag": "div",
            "index": 1
          },
          {
            "tag": "div",
            "index": 2
          },
          {
            "tag": "button",
            "id": "manual-weight-button",
            "index": 2
          }
        ],
        "values": {
          "margin-right": 7
        }
      },
      {
        "scope": "page:foods",
        "group": "library-food-row",
        "path": [],
        "values": {
          "padding-top": 0,
          "padding-bottom": 0
        }
      },
      {
        "scope": "page:foods",
        "group": "library-food-copy",
        "path": [
          {
            "tag": "span",
            "index": 1
          }
        ],
        "values": {
          "padding-bottom": 2,
          "padding-left": 4,
          "margin-bottom": 2
        }
      },
      {
        "scope": "page:foods",
        "path": [
          {
            "tag": "div",
            "index": 1
          }
        ],
        "values": {
          "padding-bottom": 0
        }
      },
      {
        "scope": "page:today",
        "group": "add-meal-button",
        "path": [],
        "values": {
          "margin-left": 4
        }
      },
      {
        "scope": "editor-family:purchase",
        "group": "purchase-line",
        "path": [
          {
            "tag": "button",
            "index": 2
          }
        ],
        "values": {
          "padding-left": 10
        }
      },
      {
        "scope": "editor-family:food-price",
        "path": [],
        "values": {
          "padding-right": 10
        },
        "group": "price-summary"
      },
      {
        "scope": "page:foods",
        "path": [],
        "values": {
          "padding-right": 5,
          "padding-left": 5
        }
      },
      {
        "scope": "page:today",
        "path": [],
        "values": {
          "padding-right": 15,
          "padding-left": 15
        }
      }
    ]
  },
  "legacySpacing": {
    "food": {
      "padding-top": 3,
      "padding-right": 8,
      "padding-bottom": 3,
      "padding-left": 15
    }
  }
}
