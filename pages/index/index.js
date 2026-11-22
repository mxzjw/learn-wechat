const store = require('../../utils/store');
const dateUtil = require('../../utils/date');

const DEFAULT_EMOJI = ['🐱', '🐈', '😺', '🐈‍⬛'];

function badgeText(label, days) {
    if (days === null) {
        return '';
    }
    if (days < 0) {
        return label + ' 逾期' + Math.abs(days) + '天';
    }
    if (days === 0) {
        return label + ' 今天';
    }
    return label + ' ' + days + '天后';
}

Page({
    data: {
        cats: [],
        loading: true,
        subtitle: '记录体重与疫苗计划',
    },

    onShow() {
        this.loadCats();
    },

    onPullDownRefresh() {
        this.loadCats();
    },

    loadCats() {
        this.setData({ loading: true });
        return store
            .listCats()
            .then((cats) => {
                return Promise.all(
                    cats.map((cat) => {
                        return store.listWeights(cat.id).then((weights) => this.decorate(cat, weights));
                    })
                );
            })
            .then((list) => {
                this.setData({
                    cats: list,
                    loading: false,
                    subtitle: list.length ? list.length + ' 只猫咪的健康档案' : '记录体重与疫苗计划',
                });
                wx.stopPullDownRefresh();
            })
            .catch(() => {
                this.setData({ loading: false });
                wx.stopPullDownRefresh();
                wx.showToast({ title: '档案加载失败', icon: 'none' });
            });
    },

    decorate(cat, weights) {
        const latest = weights.length ? weights[weights.length - 1] : null;
        const previous = weights.length > 1 ? weights[weights.length - 2] : null;
        const dewormDays = dateUtil.diffDays(cat.dewormNext);
        const vaccineDays = dateUtil.diffDays(cat.vaccineNext);

        let deltaText = '';
        if (latest && previous) {
            const diff = latest.weight - previous.weight;
            if (Math.abs(diff) < 0.05) {
                deltaText = '与上次持平';
            } else {
                deltaText = (diff > 0 ? '+' : '') + diff.toFixed(1) + 'kg';
            }
        }

        return {
            id: cat.id,
            name: cat.name || '未命名猫咪',
            breedLabel: cat.breed || '',
            avatar: cat.avatar || '',
            emoji: cat.emoji || DEFAULT_EMOJI[0],
            ageText: cat.birthday ? dateUtil.ageText(cat.birthday) : '生日未填',
            weightText: latest ? latest.weight.toFixed(1) + ' kg' : '暂无体重',
            deltaText: deltaText,
            dewormBadge: badgeText('驱虫', dewormDays),
            dewormLevel: dateUtil.countdownLevel(dewormDays),
            vaccineBadge: badgeText('疫苗', vaccineDays),
            vaccineLevel: dateUtil.countdownLevel(vaccineDays),
        };
    },

    onOpen(event) {
        const id = event.currentTarget.dataset.id;
        wx.navigateTo({ url: '/pages/cat-detail/cat-detail?id=' + id });
    },

    onAdd() {
        wx.navigateTo({ url: '/pages/cat-edit/cat-edit' });
    },
});
