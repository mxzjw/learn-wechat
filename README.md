# learn-wechat

跟练，微信小程序。

## 项目：猫咪健康管家

记录猫咪档案、健康数据与日常提醒的微信小程序。

### 主要功能

- **首页**：猫咪列表与概览
- **猫咪详情**：单项档案、体重与健康记录展示，含图表
- **档案编辑**：新增与修改猫咪基础信息
- **提醒事项**：疫苗、驱虫、复诊等时间提醒

### 目录结构

```
├── app.js              # 入口逻辑
├── app.json            # 全局配置（页面注册、窗口样式）
├── app.wxss            # 全局样式
├── project.config.json # 微信开发者工具项目配置
├── sitemap.json        # 搜索索引配置
├── pages/
│   ├── index/          # 首页
│   ├── cat-detail/     # 猫咪详情
│   ├── cat-edit/       # 档案编辑
│   └── reminders/      # 提醒事项
└── utils/
    ├── chart.js        # 图表辅助
    ├── date.js         # 日期处理
    └── store.js        # 本地数据存储
```

### 开发方式

1. 安装微信开发者工具
2. 「导入项目」选择本仓库根目录
3. `project.config.json` 中的 AppID 需替换为你自己的小程序 AppID
4. 本地调试配置写入 `project.private.config.json`，该文件已被 `.gitignore` 排除

### 许可

Apache License 2.0，详见 LICENSE。
