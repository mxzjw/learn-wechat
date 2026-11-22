const store = require('../../utils/store');
const dateUtil = require('../../utils/date');

function daysText(days) {
    if (days < 0) {
        return '逾期 ' + Math.abs(days) + ' 天';
    }
    if (days === 0) {
        return '今天';
    }
    return days + ' 天后';
}

function tipText(days) {
    if (days < 0) {
        return '需要尽快补做';
    }
    if (days <= 7) {
        return '即将到期';
    }
    return '计划中';
}

Page({
    data: {
        items: [],
        loading: true,
        hasCats: true,
        unsetCount: 0,
        summaryText: '驱虫与疫苗倒计时',
    },

    onShow() {
        this.load();
    },

    onPullDownRefresh() {
        this.load();
    },

    load() {
        this.setData({ loading: true });
        return store
            .listCats()
            .then((cats) => {
                const items = [];
                let unsetCount = 0;

                cats.forEach((cat) => {
                    const base = {
                        catId: cat.id,
                        catName: cat.name || '未命名猫咪',
                        avatar: cat.avatar || '',
                        emoji: cat.emoji || '🐱',
                    };

                    if (cat.dewormNext) {
                        items.push(this.buildItem(base, 'deworm', '驱虫', cat.dewormNext));
                    } else {
                        unsetCount += 1;
                    }

                    if (cat.vaccineNext) {
                        items.push(this.buildItem(base, 'vaccine', '疫苗', cat.vaccineNext));
                    } else {
                        unsetCount += 1;
                    }
                });

                items.sort(function (a, b) {
                    return a.days - b.days;
                });

                const overdue = items.filter(function (item) {
                    return item.days < 0;
                }).length;
                const week = items.filter(function (item) {
                    return item.days >= 0 && item.days <= 7;
                }).length;

                let summaryText = '驱虫与疫苗倒计时';
                if (items.length) {
                    summaryText = '逾期 ' + overdue + ' 项 · 7 天内 ' + week + ' 项';
                }

                this.setData({
                    items: items,
                    loading: false,
                    hasCats: cats.length > 0,
                    unsetCount: unsetCount,
                    summaryText: summaryText,
                });
                wx.stopPullDownRefresh();
            })
            .catch(() => {
                this.setData({ loading: false });
                wx.stopPullDownRefresh();
                wx.showToast({ title: '提醒加载失败', icon: 'none' });
            });
    },

    buildItem(base, type, typeLabel, date) {
        const days = dateUtil.diffDays(date);
        return {
            key: base.catId + '_' + type,
            catId: base.catId,
            catName: base.catName,
            avatar: base.avatar,
            emoji: base.emoji,
            type: type,
            typeLabel: typeLabel,
            dateText: dateUtil.formatMonthDay(date) + ' · ' + date,
            days: days === null ? 0 : days,
            daysText: daysText(days === null ? 0 : days),
            tipText: tipText(days === null ? 0 : days),
            level: dateUtil.countdownLevel(days),
        };
    },

    onOpenCat(event) {
        const id = event.currentTarget.dataset.id;
        wx.navigateTo({ url: '/pages/cat-detail/cat-detail?id=' + id });
    },

    onGoHome() {
        wx.switchTab({ url: '/pages/index/index' });
    },
});
