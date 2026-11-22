const store = require('../../utils/store');
const dateUtil = require('../../utils/date');
const chart = require('../../utils/chart');

const WEEK_LABELS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

function formatWeight(value) {
    const rounded = (Math.round(value * 100) / 100).toFixed(2);
    return rounded.replace(/(\.\d)0$/, '$1').replace(/\.00$/, '') + ' kg';
}

Page({
    data: {
        catId: '',
        cat: null,
        latestWeight: '--',
        deltaText: '--',
        deltaClass: '',
        recordCount: 0,
        records: [],
        range: 'all',
        chartEmpty: true,
        chartFallback: false,
        dewormPicker: '',
        vaccinePicker: '',
        dewormDateText: '尚未设置',
        dewormCountdown: '未设置',
        dewormLevel: 'muted',
        vaccineDateText: '尚未设置',
        vaccineCountdown: '未设置',
        vaccineLevel: 'muted',
        today: dateUtil.today(),
        showSheet: false,
        form: {
            weight: '',
            date: dateUtil.today(),
            note: '',
        },
    },

    onLoad(options) {
        this.weights = [];
        this.series = [];
        this.setData({ catId: (options && options.id) || '' });
    },

    onShow() {
        this.loadData();
    },

    onPullDownRefresh() {
        this.loadData();
    },

    loadData() {
        const id = this.data.catId;
        if (!id) {
            wx.stopPullDownRefresh();
            return Promise.resolve();
        }
        return Promise.all([store.getCat(id), store.listWeights(id)])
            .then((result) => {
                const cat = result[0];
                const weights = result[1];
                wx.stopPullDownRefresh();
                if (!cat) {
                    this.setData({ cat: null });
                    wx.showToast({ title: '猫咪档案不存在', icon: 'none' });
                    return;
                }
                this.weights = weights;
                this.applyCat(cat, weights);
            })
            .catch(() => {
                wx.stopPullDownRefresh();
                wx.showToast({ title: '加载失败，请重试', icon: 'none' });
            });
    },

    applyCat(cat, weights) {
        const today = dateUtil.today();
        const latest = weights.length ? weights[weights.length - 1] : null;
        const previous = weights.length > 1 ? weights[weights.length - 2] : null;

        let deltaText = '--';
        let deltaClass = '';
        if (latest && previous) {
            const diff = latest.weight - previous.weight;
            if (Math.abs(diff) < 0.05) {
                deltaText = '持平';
                deltaClass = 'delta-flat';
            } else {
                deltaText = (diff > 0 ? '+' : '') + diff.toFixed(1) + 'kg';
                deltaClass = diff > 0 ? 'delta-up' : 'delta-down';
            }
        }

        const records = [];
        for (let i = weights.length - 1; i >= 0; i -= 1) {
            const item = weights[i];
            const base = i > 0 ? weights[i - 1] : null;
            let itemDelta = '';
            let itemDeltaClass = '';
            if (base) {
                const diff = item.weight - base.weight;
                if (Math.abs(diff) < 0.05) {
                    itemDelta = '持平';
                    itemDeltaClass = 'delta-flat';
                } else {
                    itemDelta = (diff > 0 ? '+' : '') + diff.toFixed(2).replace(/0$/, '') + 'kg';
                    itemDeltaClass = diff > 0 ? 'delta-up' : 'delta-down';
                }
            }
            const parsed = dateUtil.parseDate(item.date);
            records.push({
                id: item.id,
                date: item.date,
                dateLabel: dateUtil.formatMonthDay(item.date),
                weekLabel: parsed ? WEEK_LABELS[parsed.getDay()] : '',
                weightText: formatWeight(item.weight),
                note: item.note || '',
                deltaText: itemDelta,
                deltaClass: itemDeltaClass,
            });
        }

        const dewormDays = dateUtil.diffDays(cat.dewormNext);
        const vaccineDays = dateUtil.diffDays(cat.vaccineNext);

        this.setData(
            {
                cat: {
                    id: cat.id,
                    name: cat.name || '未命名猫咪',
                    breed: cat.breed || '',
                    avatar: cat.avatar || '',
                    emoji: cat.emoji || '🐱',
                    ageText: cat.birthday ? dateUtil.ageText(cat.birthday) : '生日未填',
                    birthdayText: cat.birthday ? ' · ' + cat.birthday + ' 出生' : '',
                    dewormNext: cat.dewormNext || '',
                    vaccineNext: cat.vaccineNext || '',
                },
                latestWeight: latest ? formatWeight(latest.weight) : '--',
                deltaText: deltaText,
                deltaClass: deltaClass,
                recordCount: weights.length,
                records: records,
                dewormPicker: cat.dewormNext || today,
                vaccinePicker: cat.vaccineNext || today,
                dewormDateText: cat.dewormNext ? dateUtil.formatMonthDay(cat.dewormNext) + ' · ' + cat.dewormNext : '尚未设置，点此选择',
                dewormCountdown: dateUtil.countdownText(dewormDays),
                dewormLevel: dateUtil.countdownLevel(dewormDays),
                vaccineDateText: cat.vaccineNext ? dateUtil.formatMonthDay(cat.vaccineNext) + ' · ' + cat.vaccineNext : '尚未设置，点此选择',
                vaccineCountdown: dateUtil.countdownText(vaccineDays),
                vaccineLevel: dateUtil.countdownLevel(vaccineDays),
            },
            () => this.refreshChart()
        );
    },

    refreshChart() {
        const weights = this.weights || [];
        const range = this.data.range;
        let filtered = weights;
        if (range === '90d') {
            const from = dateUtil.addMonths(dateUtil.today(), -3);
            filtered = weights.filter(function (item) {
                return item.date >= from;
            });
        }
        const series = filtered.map(function (item) {
            return { label: dateUtil.formatShort(item.date), value: item.weight };
        });
        this.series = series;
        this.setData({ chartEmpty: series.length === 0, chartFallback: false }, () => {
            if (series.length) {
                this.drawChart();
            }
        });
    },

    drawChart() {
        const series = this.series;
        if (!series || !series.length) {
            return;
        }
        const query = wx.createSelectorQuery().in(this);
        query
            .select('#weightChart')
            .fields({ node: true, size: true })
            .exec((res) => {
                const info = res && res[0];
                if (!info || !info.node || !info.width) {
                    this.setData({ chartFallback: true });
                    return;
                }
                let pixelRatio = 2;
                try {
                    if (wx.getWindowInfo) {
                        pixelRatio = wx.getWindowInfo().pixelRatio || 2;
                    } else {
                        pixelRatio = wx.getSystemInfoSync().pixelRatio || 2;
                    }
                } catch (error) {
                    pixelRatio = 2;
                }
                const canvas = info.node;
                const ctx = canvas.getContext('2d');
                canvas.width = info.width * pixelRatio;
                canvas.height = info.height * pixelRatio;
                ctx.setTransform(1, 0, 0, 1, 0, 0);
                ctx.scale(pixelRatio, pixelRatio);
                chart.drawWeightChart(ctx, info.width, info.height, series);
                if (this.data.chartFallback) {
                    this.setData({ chartFallback: false });
                }
            });
    },

    onRange(event) {
        const range = event.currentTarget.dataset.range;
        if (range === this.data.range) {
            return;
        }
        this.setData({ range: range }, () => this.refreshChart());
    },

    onEdit() {
        wx.navigateTo({ url: '/pages/cat-edit/cat-edit?id=' + this.data.catId });
    },

    onDewormChange(event) {
        this.saveReminder('dewormNext', event.detail.value);
    },

    onVaccineChange(event) {
        this.saveReminder('vaccineNext', event.detail.value);
    },

    onQuickNext(event) {
        const dataset = event.currentTarget.dataset;
        const months = Number(dataset.months);
        const value = dateUtil.addMonths(dateUtil.today(), months);
        const field = dataset.type === 'deworm' ? 'dewormNext' : 'vaccineNext';
        this.saveReminder(field, value);
    },

    onClearNext(event) {
        const field = event.currentTarget.dataset.type === 'deworm' ? 'dewormNext' : 'vaccineNext';
        this.saveReminder(field, '');
    },

    saveReminder(field, value) {
        const payload = { id: this.data.catId };
        payload[field] = value;
        store
            .saveCat(payload)
            .then(() => {
                this.loadData();
                wx.showToast({ title: '健康计划已更新', icon: 'none' });
            })
            .catch(() => {
                wx.showToast({ title: '更新失败，请重试', icon: 'none' });
            });
    },

    onOpenSheet() {
        this.setData({
            showSheet: true,
            form: { weight: '', date: dateUtil.today(), note: '' },
        });
    },

    onCloseSheet() {
        this.setData({ showSheet: false });
    },

    onWeightInput(event) {
        this.setData({ 'form.weight': event.detail.value });
    },

    onDateChange(event) {
        this.setData({ 'form.date': event.detail.value });
    },

    onNoteInput(event) {
        this.setData({ 'form.note': event.detail.value });
    },

    onSubmit() {
        const weight = Number(this.data.form.weight);
        if (!weight || isNaN(weight)) {
            wx.showToast({ title: '请输入体重数值', icon: 'none' });
            return;
        }
        if (weight < 0.2 || weight > 20) {
            wx.showToast({ title: '体重需在 0.2 - 20 kg 之间', icon: 'none' });
            return;
        }
        store
            .addWeight({
                catId: this.data.catId,
                date: this.data.form.date,
                weight: weight,
                note: (this.data.form.note || '').trim(),
            })
            .then(() => {
                this.setData({ showSheet: false });
                wx.showToast({ title: '已记录', icon: 'success' });
                this.loadData();
            })
            .catch(() => {
                wx.showToast({ title: '保存失败，请重试', icon: 'none' });
            });
    },

    onLongPressRecord(event) {
        const id = event.currentTarget.dataset.id;
        const dateLabel = event.currentTarget.dataset.date;
        wx.showActionSheet({
            itemList: ['删除这条记录'],
            itemColor: '#c2433a',
            success: (res) => {
                if (res.tapIndex !== 0) {
                    return;
                }
                wx.showModal({
                    title: '删除记录',
                    content: '确认删除 ' + dateLabel + ' 的称重记录？',
                    confirmText: '删除',
                    confirmColor: '#c2433a',
                    success: (modal) => {
                        if (!modal.confirm) {
                            return;
                        }
                        store.removeWeight(id).then(() => {
                            wx.showToast({ title: '已删除', icon: 'success' });
                            this.loadData();
                        });
                    },
                });
            },
        });
    },
});
